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

const SellerRegisterSchema = z.discriminatedUnion('accountType', [
  z.object({
    accountType: z.literal('BIREYSEL'),
    email: z.string().email(),
    password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
    fullName: z.string().min(2).max(60),
  }),
  z.object({
    accountType: z.literal('TUZEL'),
    email: z.string().email(),
    password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
    companyName: z.string().min(2).max(120),
    taxNo: z.string().length(10, 'Vergi numarası 10 haneli olmalıdır'),
    taxOffice: z.string().min(2).max(80),
  }),
]);

const SellerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Controller ────────────────────────────────────────────────
export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = RegisterSchema.parse(req.body);
      const result = await AuthService.register(body);
      res.status(201).json({ success: true, message: 'User registered successfully', data: result });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = LoginSchema.parse(req.body);
      const result = await AuthService.login(body);
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
      const result = await AuthService.registerSeller(body);
      res.status(201).json({ success: true, message: 'Hesap oluşturuldu', data: result });
    } catch (err) {
      next(err);
    }
  },

  async sellerLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = SellerLoginSchema.parse(req.body);
      const result = await AuthService.loginSeller(body);
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
};
