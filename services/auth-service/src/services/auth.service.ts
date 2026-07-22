import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { SellerRepository, CreateSellerInput } from '../repositories/seller.repository';
import { publishEvent, getRedisClient } from '../repositories/redis.client';
import { prisma } from '../repositories/prisma.client';
import { AccountType } from '@prisma/client';

const SALT_ROUNDS = 12;

// ─── Satıcı sözleşmeleri / onboarding ───────────────────────────
export const CONTRACT_VERSION = '1.1';

export interface AcceptedContract {
  key: string;
  title: string;
  version: string;
  acceptedAt: string;
}

/** İstemciden gelen ham hâli: yalnızca `key` garanti edilir. */
export type AcceptedContractInput = {
  key: string;
  title?: string;
  version?: string;
  acceptedAt?: string;
};

/** Her satıcı tipinin onaylamak zorunda olduğu sözleşme anahtarları */
const REQUIRED_CONTRACTS: Record<string, string[]> = {
  BIREYSEL: ['uyelik', 'kvkk', 'komisyon', 'mesafeli-satis'],
  TUZEL: ['uyelik', 'kvkk', 'komisyon', 'mesafeli-satis', 'tuzel-taahhut'],
};

/** Tüzel kişiden zorunlu evraklar */
const REQUIRED_DOCUMENTS: Record<string, string[]> = {
  BIREYSEL: ['kimlik'],
  TUZEL: ['vergiLevhasi', 'imzaSirkuleri', 'ticaretSicilGazetesi', 'yetkiliKimlik'],
};

const MAX_DOCUMENT_CHARS = 6_000_000; // ~4.5 MB base64

function sanitizeAcceptedContracts(list?: AcceptedContractInput[]): AcceptedContract[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((c) => c && typeof c.key === 'string')
    .map((c) => ({
      key: String(c.key).slice(0, 60),
      title: String(c.title ?? '').slice(0, 200),
      version: String(c.version ?? CONTRACT_VERSION).slice(0, 20),
      acceptedAt: c.acceptedAt ? String(c.acceptedAt) : new Date().toISOString(),
    }));
}

function sanitizeDocuments(docs?: Record<string, string>): Record<string, string> {
  if (!docs || typeof docs !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(docs)) {
    if (typeof value !== 'string' || !value.startsWith('data:')) continue;
    if (value.length > MAX_DOCUMENT_CHARS) {
      const err = new Error(`"${key}" belgesi çok büyük. Lütfen 4 MB altında bir dosya yükleyin.`) as Error & { statusCode: number };
      err.statusCode = 413;
      throw err;
    }
    out[String(key).slice(0, 40)] = value;
  }
  return out;
}

export function missingOnboardingItems(
  accountType: string,
  contracts?: AcceptedContractInput[],
  documents?: Record<string, string>
): { contracts: string[]; documents: string[] } {
  const acceptedKeys = new Set(sanitizeAcceptedContracts(contracts).map((c) => c.key));
  const presentDocs = new Set(Object.keys(documents || {}));
  return {
    contracts: (REQUIRED_CONTRACTS[accountType] || REQUIRED_CONTRACTS.BIREYSEL).filter((k) => !acceptedKeys.has(k)),
    documents: (REQUIRED_DOCUMENTS[accountType] || REQUIRED_DOCUMENTS.BIREYSEL).filter((k) => !presentDocs.has(k)),
  };
}

/** Sözleşme + evrak tamamsa kayıt admin onayına düşer, değilse eksik kalır. */
function onboardingStatusFor(
  accountType: string,
  contracts?: AcceptedContractInput[],
  documents?: Record<string, string>
): string {
  const missing = missingOnboardingItems(accountType, contracts, documents);
  return missing.contracts.length === 0 && missing.documents.length === 0
    ? 'REVIEW_PENDING'
    : 'CONTRACTS_PENDING';
}

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
    companyIban?: string;
    mersisNo?: string;
    tradeRegistryNo?: string;
    authorizedName?: string;
    kepAddress?: string;
    acceptedKvkk?: boolean;
    acceptedSellerAgreement?: boolean;
    /** [{ key, title, version, acceptedAt }] — modalda okunup onaylanan sözleşmeler */
    acceptedContracts?: Array<{ key: string; title?: string; version?: string; acceptedAt?: string }>;
    /** { vergiLevhasi: "data:...", ... } */
    documents?: Record<string, string>;
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
      companyIban: input.companyIban,
      mersisNo: input.mersisNo,
      tradeRegistryNo: input.tradeRegistryNo,
      authorizedName: input.authorizedName,
      kepAddress: input.kepAddress,
      acceptedKvkk: input.acceptedKvkk ?? false,
      acceptedSellerAgreement: input.acceptedSellerAgreement ?? false,
      // Sözleşme onay anı — imzalı sözleşme belgesinde kullanılır
      contractAcceptedAt: (input.acceptedKvkk || input.acceptedSellerAgreement) ? new Date() : undefined,
      contractVersion: CONTRACT_VERSION,
      acceptedContracts: sanitizeAcceptedContracts(input.acceptedContracts),
      documents: sanitizeDocuments(input.documents),
      // Sözleşmeler eksikse satıcı yalnızca "Sözleşmelerim" ekranını görür;
      // tamamlandığında kayıt admin onayına düşer.
      onboardingStatus: onboardingStatusFor(accountType, input.acceptedContracts, input.documents),
      onboardingSubmittedAt:
        onboardingStatusFor(accountType, input.acceptedContracts, input.documents) === 'REVIEW_PENDING'
          ? new Date()
          : undefined,
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
    // Evrakların base64 içeriği profil yanıtında taşınmaz; yalnızca hangi
    // belgelerin yüklendiği ve neyin eksik olduğu bildirilir.
    const documents = (seller.documents as Record<string, string>) || {};
    const contracts = (seller.acceptedContracts as unknown as AcceptedContract[]) || [];
    const { documents: _omitDocs, ...rest } = seller as Record<string, unknown> & { documents?: unknown };

    return {
      ...rest,
      role: 'SELLER',
      uploadedDocuments: Object.keys(documents),
      missing: missingOnboardingItems(seller.accountType, contracts, documents),
      contractVersionCurrent: CONTRACT_VERSION,
    };
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

  /**
   * Satıcı, sözleşmeleri okuyup onayladığında ve evraklarını yüklediğinde
   * çağrılır. Eksik yoksa kayıt admin onayına (REVIEW_PENDING) düşer.
   */
  async submitSellerOnboarding(
    sellerId: string,
    input: { acceptedContracts?: AcceptedContract[]; documents?: Record<string, string> }
  ) {
    const seller = await SellerRepository.findById(sellerId);
    if (!seller) {
      const err = new Error('Satıcı bulunamadı') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    // Daha önce onaylananlarla birleştir (satıcı tek tek onaylayabilir)
    const existingContracts = sanitizeAcceptedContracts(
      seller.acceptedContracts as unknown as AcceptedContract[] | undefined
    );
    const incomingContracts = sanitizeAcceptedContracts(input.acceptedContracts);
    const byKey = new Map(existingContracts.map((c) => [c.key, c]));
    for (const c of incomingContracts) byKey.set(c.key, c);
    const mergedContracts = [...byKey.values()];

    const mergedDocuments = {
      ...((seller.documents as Record<string, string>) || {}),
      ...sanitizeDocuments(input.documents),
    };

    const missing = missingOnboardingItems(seller.accountType, mergedContracts, mergedDocuments);
    const complete = missing.contracts.length === 0 && missing.documents.length === 0;

    // Zaten onaylı bir satıcı yeni belge yüklerse onayı geri alınmaz
    const alreadyApproved = seller.onboardingStatus === 'APPROVED';
    const nextStatus = alreadyApproved ? 'APPROVED' : complete ? 'REVIEW_PENDING' : 'CONTRACTS_PENDING';

    const updated = await SellerRepository.updateProfile(sellerId, {
      acceptedContracts: mergedContracts,
      documents: mergedDocuments,
      acceptedKvkk: mergedContracts.some((c) => c.key === 'kvkk'),
      acceptedSellerAgreement: mergedContracts.some((c) => c.key === 'uyelik'),
      contractAcceptedAt: mergedContracts.length > 0 ? new Date() : null,
      contractVersion: CONTRACT_VERSION,
      onboardingStatus: nextStatus,
      onboardingSubmittedAt: nextStatus === 'REVIEW_PENDING' ? new Date() : seller.onboardingSubmittedAt,
      // Yeniden gönderimde eski red notu temizlenir
      onboardingNote: nextStatus === 'REVIEW_PENDING' ? null : seller.onboardingNote,
    });

    const { documents, ...safe } = updated as Record<string, unknown> & { documents?: unknown };
    return { seller: safe, missing, status: nextStatus };
  },

  /** Admin: satıcı başvurusunu onaylar veya reddeder. */
  async reviewSeller(sellerId: string, action: 'APPROVE' | 'REJECT', note: string | undefined, reviewer: string) {
    const seller = await SellerRepository.findById(sellerId);
    if (!seller) {
      const err = new Error('Satıcı bulunamadı') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    if (action === 'REJECT' && !note?.trim()) {
      const err = new Error('Red gerekçesi zorunludur') as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }

    const updated = await SellerRepository.updateProfile(sellerId, {
      onboardingStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      onboardingNote: note?.trim() ? note.trim().slice(0, 500) : null,
      onboardingReviewedAt: new Date(),
      onboardingReviewedBy: reviewer,
    });

    const { documents, ...safe } = updated as Record<string, unknown> & { documents?: unknown };
    return safe;
  },

  /** Admin: satıcının yüklediği evrakları görüntüler. */
  async getSellerDocuments(sellerId: string) {
    const seller = await SellerRepository.findById(sellerId);
    if (!seller) {
      const err = new Error('Satıcı bulunamadı') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    return {
      id: seller.id,
      email: seller.email,
      accountType: seller.accountType,
      companyName: seller.companyName,
      fullName: seller.fullName,
      taxNo: seller.taxNo,
      taxOffice: seller.taxOffice,
      mersisNo: seller.mersisNo,
      tradeRegistryNo: seller.tradeRegistryNo,
      authorizedName: seller.authorizedName,
      kepAddress: seller.kepAddress,
      onboardingStatus: seller.onboardingStatus,
      onboardingNote: seller.onboardingNote,
      onboardingSubmittedAt: seller.onboardingSubmittedAt,
      acceptedContracts: seller.acceptedContracts,
      documents: seller.documents,
    };
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
        acceptedContracts: true,
        onboardingStatus: true,
        onboardingNote: true,
        onboardingSubmittedAt: true,
        onboardingReviewedAt: true,
        mersisNo: true,
        authorizedName: true,
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
