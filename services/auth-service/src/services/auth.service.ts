import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { SellerRepository, CreateSellerInput } from '../repositories/seller.repository';
import { publishEvent, getRedisClient } from '../repositories/redis.client';
import { prisma } from '../repositories/prisma.client';
import { AccountType } from '@prisma/client';

const SALT_ROUNDS = 12;

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

const signToken = (payload: { id: string; email: string; name: string; role: string; deviceId?: string }): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';

  if (!secret) throw new Error('JWT_SECRET is not configured');

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

export const AuthService = {
  async seedUsers() {
    const defaultUsers = [
      { name: 'ali', email: 'ali@demo.com', password: '123' },
      { name: 'mustafa', email: 'mustafa@demo.com', password: '123' }
    ];

    for (const u of defaultUsers) {
      const exists = await UserRepository.findByEmail(u.email);
      if (!exists) {
        const hashedPassword = await bcrypt.hash(u.password, SALT_ROUNDS);
        await UserRepository.create({
          email: u.email,
          password: hashedPassword,
          name: u.name,
        });
        console.log(`[Auth] Seeded user: ${u.name}`);
      }
    }
  },

  async register(input: RegisterInput, deviceId?: string): Promise<AuthResponse> {
    const exists = await UserRepository.existsByEmail(input.email);
    if (exists) {
      const err = new Error('Email is already registered') as Error & { statusCode: number };
      err.statusCode = 409;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await UserRepository.create({
      email: input.email,
      password: hashedPassword,
      name: input.name,
    });

    await publishEvent('user.registered', {
      userId: user.id,
      email: user.email,
      name: user.name,
      registeredAt: new Date().toISOString(),
    });

    const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role, deviceId });
    
    // Store in Redis (Whitelist)
    const redis = getRedisClient();
    await redis.set(`auth:token:${token}`, user.id, 'EX', 7 * 24 * 60 * 60);

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  },

  async login(input: LoginInput, deviceId?: string): Promise<AuthResponse> {
    const user = await UserRepository.findByEmail(input.email);

    if (!user || !user.isActive) {
      const err = new Error('Invalid credentials') as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    const isValidPassword = await bcrypt.compare(input.password, user.password);
    if (!isValidPassword) {
      const err = new Error('Invalid credentials') as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role, deviceId });

    // 🚀 Store session in Redis
    const redis = getRedisClient();
    // Prefix 'auth:token:' ile kaydediyoruz, 7 gün ömrü var
    await redis.set(`auth:token:${token}`, user.id, 'EX', 7 * 24 * 60 * 60);

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  },

  async getProfile(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    return user;
  },

  // ─── Seller (Panel) işlemleri ────────────────────────────────
  async registerSeller(input: {
    email: string;
    password: string;
    accountType: string;
    fullName?: string;
    tcNo?: string;
    iban?: string;
    companyName?: string;
    taxNo?: string;
    taxOffice?: string;
    acceptedKvkk?: boolean;
    acceptedSellerAgreement?: boolean;
  }, deviceId?: string) {
    const exists = await SellerRepository.existsByEmail(input.email);
    if (exists) {
      const err = new Error('Bu e-posta zaten kayıtlı') as Error & { statusCode: number };
      err.statusCode = 409;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
    const accountType: AccountType = input.accountType === 'TUZEL' ? 'TUZEL' : 'BIREYSEL';

    const seller = await SellerRepository.create({
      email: input.email,
      password: hashedPassword,
      accountType,
      fullName: input.fullName,
      tcNo: input.tcNo,
      iban: input.iban,
      companyName: input.companyName,
      taxNo: input.taxNo,
      taxOffice: input.taxOffice,
      acceptedKvkk: input.acceptedKvkk ?? false,
      acceptedSellerAgreement: input.acceptedSellerAgreement ?? false,
      // Sözleşme onay anı — imzalı sözleşme belgesinde kullanılır
      contractAcceptedAt: (input.acceptedKvkk || input.acceptedSellerAgreement) ? new Date() : undefined,
      contractVersion: '1.0',
    });

    const displayName = accountType === 'TUZEL' ? seller.companyName! : seller.fullName!;
    const token = signToken({ id: seller.id, email: seller.email, name: displayName, role: 'SELLER', deviceId });

    const redis = getRedisClient();
    await redis.set(`auth:token:${token}`, seller.id, 'EX', 7 * 24 * 60 * 60);

    return {
      token,
      user: { id: seller.id, email: seller.email, name: displayName, role: 'SELLER', accountType },
    };
  },

  async loginSeller(input: { email: string; password: string }, deviceId?: string) {
    const seller = await SellerRepository.findByEmail(input.email);

    if (!seller || !seller.isActive) {
      const err = new Error('Geçersiz e-posta veya şifre') as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    const isValid = await bcrypt.compare(input.password, seller.password);
    if (!isValid) {
      const err = new Error('Geçersiz e-posta veya şifre') as Error & { statusCode: number };
      err.statusCode = 401;
      throw err;
    }

    const displayName = seller.accountType === 'TUZEL' ? seller.companyName! : seller.fullName!;
    const token = signToken({ id: seller.id, email: seller.email, name: displayName, role: 'SELLER', deviceId });

    const redis = getRedisClient();
    await redis.set(`auth:token:${token}`, seller.id, 'EX', 7 * 24 * 60 * 60);

    return {
      token,
      user: {
        id: seller.id,
        email: seller.email,
        name: displayName,
        role: 'SELLER',
        accountType: seller.accountType,
      },
    };
  },

  async getSellerProfile(sellerId: string) {
    const seller = await SellerRepository.findById(sellerId);
    if (!seller) {
      const err = new Error('Hesap bulunamadı') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    return { ...seller, role: 'SELLER' };
  },

  async updateSellerProfile(sellerId: string, input: Record<string, unknown>) {
    // Yalnızca izin verilen alanlar güncellenebilir
    const allowed = [
      'fullName', 'tcNo', 'iban', 'companyName', 'taxNo', 'taxOffice', 'companyIban',
      'storeName', 'storeBio', 'storeTheme', 'storeColor', 'storeLogo', 'storeBanner', 'storeSlug',
    ];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (input[key] !== undefined) data[key] = input[key];
    }

    // Slug'ı normalize et ve benzersizlik kontrolü
    if (typeof data.storeSlug === 'string' && data.storeSlug) {
      const slug = (data.storeSlug as string)
        .toLowerCase().trim()
        .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (!slug) {
        delete data.storeSlug;
      } else {
        const taken = await SellerRepository.slugTaken(slug, sellerId);
        if (taken) {
          const err = new Error('Bu mağaza adresi (slug) zaten kullanımda') as Error & { statusCode: number };
          err.statusCode = 409;
          throw err;
        }
        data.storeSlug = slug;
      }
    }

    const seller = await SellerRepository.updateProfile(sellerId, data);
    return { ...seller, role: 'SELLER' };
  },

  async getStoreBySlug(slug: string) {
    return SellerRepository.findBySlug(slug);
  },

  async getFavorites(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((item) => item.productId);
  },

  async addFavorite(userId: string, productId: string) {
    await prisma.favorite.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });

    return this.getFavorites(userId);
  },

  async removeFavorite(userId: string, productId: string) {
    await prisma.favorite.deleteMany({
      where: { userId, productId },
    });

    return this.getFavorites(userId);
  },

  // ─── Super Admin ──────────────────────────────────────────────
  async adminLogin(phone: string, password: string, deviceId?: string) {
    // Hardcoded credentials as per plan
    if (phone === '05555555555' && password === 'admin123') {
      const token = signToken({ id: 'super-admin-id', email: 'admin@system.local', name: 'Super Admin', role: 'ADMIN', deviceId });
      
      const redis = getRedisClient();
      await redis.set(`auth:token:${token}`, 'super-admin-id', 'EX', 7 * 24 * 60 * 60);

      return {
        token,
        user: { id: 'super-admin-id', email: 'admin@system.local', name: 'Super Admin', role: 'ADMIN' },
      };
    }

    const err = new Error('Geçersiz admin bilgileri') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  },

  async getAllUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });
  },

  async getAllSellers() {
    const sellers = await prisma.sellerAccount.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        accountType: true,
        fullName: true,
        companyName: true,
        taxNo: true,
        taxOffice: true,
        isActive: true,
        createdAt: true,
        storeName: true,
        storeSlug: true,
        iban: true,
        companyIban: true,
        acceptedSellerAgreement: true,
        contractAcceptedAt: true,
      }
    });

    // Ürün / satış / XML feed istatistikleri: aynı veritabanında olduğu için
    // tek seferde gruplayıp bellekte eşleştiriyoruz (satıcı başına N+1 sorgu yok).
    type ProductStat = {
      userId: string;
      productCount: number;
      activeProducts: number;
      totalStock: number;
      totalSales: number;
      revenue: number;
    };
    type FeedStat = { userId: string; feedCount: number; pendingFeeds: number; approvedFeeds: number };

    const [productStats, feedStats] = await Promise.all([
      prisma.$queryRaw<ProductStat[]>`
        SELECT "userId",
               COUNT(*)::int AS "productCount",
               COUNT(*) FILTER (WHERE "saleStatus" = 'ACTIVE')::int AS "activeProducts",
               COALESCE(SUM("stock"), 0)::int AS "totalStock",
               COALESCE(SUM("sales"), 0)::int AS "totalSales",
               COALESCE(SUM("price" * "sales"), 0)::float8 AS "revenue"
        FROM "products"
        GROUP BY "userId"
      `.catch(() => [] as ProductStat[]),
      prisma.$queryRaw<FeedStat[]>`
        SELECT "userId",
               COUNT(*)::int AS "feedCount",
               COUNT(*) FILTER (WHERE "approvalStatus" = 'PENDING')::int AS "pendingFeeds",
               COUNT(*) FILTER (WHERE "approvalStatus" = 'APPROVED')::int AS "approvedFeeds"
        FROM "xml_feeds"
        GROUP BY "userId"
      `.catch(() => [] as FeedStat[]),
    ]);

    const productByUser = new Map(productStats.map((s) => [s.userId, s]));
    const feedByUser = new Map(feedStats.map((s) => [s.userId, s]));

    return sellers.map((s) => {
      const p = productByUser.get(s.id);
      const f = feedByUser.get(s.id);
      const isBireysel = s.accountType === 'BIREYSEL';
      return {
        ...s,
        displayName: s.storeName || (isBireysel ? s.fullName : s.companyName) || s.email,
        payoutIban: (isBireysel ? s.iban : s.companyIban) || null,
        productCount: p?.productCount ?? 0,
        activeProducts: p?.activeProducts ?? 0,
        totalStock: p?.totalStock ?? 0,
        totalSales: p?.totalSales ?? 0,
        revenue: Math.round((p?.revenue ?? 0) * 100) / 100,
        feedCount: f?.feedCount ?? 0,
        pendingFeeds: f?.pendingFeeds ?? 0,
        approvedFeeds: f?.approvedFeeds ?? 0,
      };
    });
  }
};
