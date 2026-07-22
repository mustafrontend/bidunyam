import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';

// ─── Validation Schemas ────────────────────────────────────────
const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Kayıt sırasında modalda okunup onaylanan sözleşmelerin dökümü
const AcceptedContractSchema = z.object({
  key: z.string().min(1).max(60),
  title: z.string().max(200).optional(),
  version: z.string().max(20).optional(),
  acceptedAt: z.string().optional(),
});

// Yüklenen evraklar: { vergiLevhasi: "data:application/pdf;base64,..." }
const DocumentsSchema = z.record(z.string(), z.string()).optional();

const SellerRegisterSchema = z.discriminatedUnion('accountType', [
  z.object({
    accountType: z.literal('BIREYSEL'),
    email: z.string().email(),
    password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
    fullName: z.string().min(2).max(60),
    tcNo: z.string().optional(),
    iban: z.string().optional(),
    acceptedKvkk: z.boolean().optional(),
    acceptedSellerAgreement: z.boolean().optional(),
    acceptedContracts: z.array(AcceptedContractSchema).optional(),
    documents: DocumentsSchema,
  }),
  z.object({
    accountType: z.literal('TUZEL'),
    email: z.string().email(),
    password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
    companyName: z.string().min(2).max(120),
    taxNo: z.string().length(10, 'Vergi numarası 10 haneli olmalıdır'),
    taxOffice: z.string().min(2).max(80),
    companyIban: z.string().optional(),
    mersisNo: z.string().max(20).optional(),
    tradeRegistryNo: z.string().max(40).optional(),
    authorizedName: z.string().max(80).optional(),
    kepAddress: z.string().max(120).optional(),
    acceptedKvkk: z.boolean().optional(),
    acceptedSellerAgreement: z.boolean().optional(),
    acceptedContracts: z.array(AcceptedContractSchema).optional(),
    documents: DocumentsSchema,
  }),
]);

const SellerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const FavoriteParamsSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
});

// ─── Controller ────────────────────────────────────────────────
export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = RegisterSchema.parse(req.body);
      const deviceId = (req.headers['x-device-id'] as string) || req.body.deviceId;
      const result = await AuthService.register(body, deviceId);
      res.status(201).json({ success: true, message: 'User registered successfully', data: result });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = LoginSchema.parse(req.body);
      const deviceId = (req.headers['x-device-id'] as string) || req.body.deviceId;
      const result = await AuthService.login(body, deviceId);
      res.status(200).json({ success: true, message: 'Login successful', data: result });
    } catch (err) {
      next(err);
    }
  },

  async profile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const user = await AuthService.getProfile(userId);
      res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  // ─── Seller (Panel) ──────────────────────────────────────────
  async sellerRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = SellerRegisterSchema.parse(req.body);
      const deviceId = (req.headers['x-device-id'] as string) || req.body.deviceId;
      const result = await AuthService.registerSeller(body, deviceId);
      res.status(201).json({ success: true, message: 'Hesap oluşturuldu', data: result });
    } catch (err) {
      next(err);
    }
  },

  async sellerLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = SellerLoginSchema.parse(req.body);
      const deviceId = (req.headers['x-device-id'] as string) || req.body.deviceId;
      const result = await AuthService.loginSeller(body, deviceId);
      res.status(200).json({ success: true, message: 'Giriş başarılı', data: result });
    } catch (err) {
      next(err);
    }
  },

  async sellerProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = (req as Request & { user?: { id: string } }).user?.id;
      if (!sellerId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const seller = await AuthService.getSellerProfile(sellerId);
      res.status(200).json({ success: true, data: seller });
    } catch (err) {
      next(err);
    }
  },

  async submitSellerOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = (req as Request & { user?: { id: string } }).user?.id;
      if (!sellerId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const result = await AuthService.submitSellerOnboarding(sellerId, req.body || {});
      res.status(200).json({
        success: true,
        message:
          result.status === 'REVIEW_PENDING'
            ? 'Sözleşme ve belgeleriniz alındı. Başvurunuz admin onayına gönderildi.'
            : 'Kaydedildi. Eksik sözleşme/belgeleri tamamladığınızda başvurunuz onaya gönderilecek.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  async getSellerDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AuthService.getSellerDocuments(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async reviewSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const action = String(req.body?.action || '').toUpperCase();
      if (action !== 'APPROVE' && action !== 'REJECT') {
        res.status(400).json({ success: false, message: "action 'APPROVE' veya 'REJECT' olmalı" });
        return;
      }
      const reviewer = (req as Request & { user?: { email?: string; id?: string } }).user;
      const seller = await AuthService.reviewSeller(
        req.params.id,
        action,
        req.body?.note,
        reviewer?.email || reviewer?.id || 'admin'
      );
      res.status(200).json({ success: true, data: seller });
    } catch (err) {
      next(err);
    }
  },

  async updateSellerProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = (req as Request & { user?: { id: string } }).user?.id;
      if (!sellerId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const seller = await AuthService.updateSellerProfile(sellerId, req.body);
      res.status(200).json({ success: true, data: seller });
    } catch (err) {
      next(err);
    }
  },

  async getStoreBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const store = await AuthService.getStoreBySlug(req.params.slug);
      if (!store) {
        res.status(404).json({ success: false, message: 'Mağaza bulunamadı' });
        return;
      }
      res.status(200).json({ success: true, data: store });
    } catch (err) {
      next(err);
    }
  },

  async getFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const productIds = await AuthService.getFavorites(userId);
      res.status(200).json({ success: true, data: { productIds } });
    } catch (err) {
      next(err);
    }
  },

  async addFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { productId } = FavoriteParamsSchema.parse(req.params);
      const productIds = await AuthService.addFavorite(userId, productId);
      res.status(200).json({ success: true, message: 'Favorilere eklendi', data: { productIds } });
    } catch (err) {
      next(err);
    }
  },

  async removeFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { productId } = req.params;
      const productIds = await AuthService.removeFavorite(userId, productId);
      res.status(200).json({ success: true, message: 'Favorilerden kaldırıldı', data: { productIds } });
    } catch (err) {
      next(err);
    }
  },

  // ─── Super Admin ──────────────────────────────────────────────────
  async adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, password, deviceId } = req.body;
      const result = await AuthService.adminLogin(phone, password, deviceId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getAdminUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await AuthService.getAllUsers();
      res.status(200).json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  },

  async getAdminSellers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellers = await AuthService.getAllSellers();
      res.status(200).json({ success: true, data: sellers });
    } catch (err) {
      next(err);
    }
  }
};
