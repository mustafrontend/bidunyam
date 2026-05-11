import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProductService } from '../services/product.service';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(12),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  search: z.string().optional(),
});

const ProductInputSchema = z.object({
  barcode: z.string().min(8),
  modelCode: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(3),
  categoryPath: z.string().min(1),
  brand: z.string().min(1),
  variants: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['COLOR', 'SIZE', 'CUSTOM']),
    values: z.array(z.object({
      label: z.string().min(1),
      price: z.coerce.number().min(0).default(0),
      stock: z.coerce.number().int().min(0).default(0),
    })).min(1),
  })).default([]),
  extraServices: z.array(z.object({
    name: z.string().min(1),
    price: z.coerce.number().min(0),
    description: z.string().default(''),
  })).default([]),
  categoryAttributes: z.record(z.string()).default({}),
  originalPrice: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  vatRate: z.union([z.literal(1), z.literal(10), z.literal(20)]),
  purchasePrice: z.coerce.number().min(0),
  variantGroupId: z.string().default(''),
  variantValue: z.string().default(''),
  stock: z.coerce.number().int().min(0),
  imageUrls: z.array(z.string().min(1)).min(1).max(5),
  description: z.string().min(5),
  shortDescription: z.string().default(''),
  bulletPoints: z.array(z.string()).max(5).default([]),
  desi: z.coerce.number().min(0),
  preparationDays: z.coerce.number().int().min(0),
  shippingType: z.enum(['SELF_SHIPPING', 'MARKETPLACE_LOGISTICS']),
  saleStatus: z.enum(['ACTIVE', 'PASSIVE']),
  approvalStatus: z.enum(['APPROVED', 'REJECTED', 'PENDING']),
  marketplaceListingNo: z.string().default(''),
});

const ProductUpdateSchema = ProductInputSchema.partial();

const BrandOptionSchema = z.object({
  name: z.string().min(1),
});

const CategoryOptionSchema = z.object({
  mainCategory: z.string().min(1),
  subCategory: z.string().optional(),
});

export const ProductController = {
  async getCatalogOptions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = await ProductService.getCatalogOptions();
      res.json({ success: true, data: options });
    } catch (err) {
      next(err);
    }
  },

  async createBrandOption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = BrandOptionSchema.parse(req.body);
      const options = await ProductService.createBrandOption(body.name);
      res.status(201).json({ success: true, data: options });
    } catch (err) {
      next(err);
    }
  },

  async createCategoryOption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = CategoryOptionSchema.parse(req.body);
      const options = await ProductService.createCategoryOption(body.mainCategory, body.subCategory);
      res.status(201).json({ success: true, data: options });
    } catch (err) {
      next(err);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = QuerySchema.parse(req.query);
      const { page, limit, ...filters } = query;

      const result = await ProductService.getProducts(filters, page, limit);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = ProductInputSchema.parse(req.body);
      const product = await ProductService.createProduct(body);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = ProductUpdateSchema.parse(req.body);
      const product = await ProductService.updateProduct(id, body);
      res.status(200).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },
};
