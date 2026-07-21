import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProductService } from '../services/product.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(12),
  category: z.string().optional(),
  brand: z.union([z.string(), z.array(z.string())]).optional().transform(val => val === undefined ? [] : (Array.isArray(val) ? val : [val])),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  search: z.string().optional(),
  condition: z.string().optional(),
  listingType: z.string().optional(),
  sellerId: z.string().optional(),
  includeAll: z.coerce.boolean().default(false),
  myProducts: z.coerce.boolean().default(false),
});

const ProductInputSchema = z.object({
  barcode: z.string().min(8),
  modelCode: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(3),
  categoryPath: z.string().min(1),
  brand: z.string().min(1),
  variants: z.any().default([]),
  extraServices: z.any().default([]),
  categoryAttributes: z.any().default({}),
  originalPrice: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  vatRate: z.union([z.literal(1), z.literal(10), z.literal(20)]).default(20),
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
  shippingType: z.string().default('MARKETPLACE_LOGISTICS'),
  saleStatus: z.string().default('ACTIVE'),
  approvalStatus: z.string().default('APPROVED'),
  marketplaceListingNo: z.string().default(''),
  condition: z.enum(['SIFIR', 'AZ_KULLANILMIS', 'IKINCI_EL']).default('SIFIR'),
  listingType: z.enum(['KURUMSAL', 'BIREYSEL']).default('KURUMSAL'),
  sellerName: z.string().default('FUAR BOX'),
  sellerRating: z.coerce.number().default(9.3),
});

const ProductUpdateSchema = ProductInputSchema.partial();

const BrandOptionSchema = z.object({
  name: z.string().min(1),
});

const CategoryOptionSchema = z.object({
  mainCategory: z.string().min(1),
  subCategory: z.string().optional(),
});

const QuestionInputSchema = z.object({
  question: z.string().min(5),
  user: z.string().optional(),
  purchased: z.boolean().optional(),
  sellerName: z.string().optional(),
  category: z.string().optional(),
});

const ReviewInputSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(3),
  user: z.string().optional(),
  dateString: z.string().optional(),
  sellerName: z.string().optional(),
});

const BulkPriceSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(500),
  operation: z.enum(['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'PERCENTAGE_INCREASE', 'FIXED_INCREASE']),
  value: z.coerce.number().min(0),
});

const BulkStatusSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(500),
  isActive: z.boolean(),
});

const BulkCategorySchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(500),
  categoryName: z.string().min(1),
});

const BulkDeleteSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(500),
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

  async getCategoryFilters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.query;
      if (!category || typeof category !== 'string') {
        res.status(400).json({ success: false, message: 'category query parameter is required' });
        return;
      }
      const filters = await ProductService.getCategoryFilters(category);
      res.json({ success: true, data: filters });
    } catch (err) {
      next(err);
    }
  },

  // ─── Category Filter Templates ────────────────────────────────
  async getFilterTemplates(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = await ProductService.getFilterTemplates();
      res.json({ success: true, data: templates });
    } catch (err) {
      next(err);
    }
  },

  async upsertFilterTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schema = z.object({
        categoryName: z.string().min(1),
        filters: z.array(z.object({
          name: z.string().min(1),
          label: z.string().optional(),
          type: z.enum(['select', 'number', 'text', 'boolean']).default('text'),
          options: z.array(z.string()).optional(),
          unit: z.string().optional(),
          required: z.boolean().optional(),
        })).default([]),
      });
      const body = schema.parse(req.body);
      const result = await ProductService.upsertFilterTemplate(body.categoryName, body.filters);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async deleteFilterTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.params;
      const result = await ProductService.deleteFilterTemplate(category);
      res.json({ success: true, data: result });
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

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = QuerySchema.parse(req.query);
      const { page, limit, ...filters } = query;

      // Extract dynamic attr_ fields from req.query
      const attributes: Record<string, string[]> = {};
      for (const key in req.query) {
        if (key.startsWith('attr_')) {
          const rawVal = req.query[key];
          const attrName = key.replace('attr_', '');
          attributes[attrName] = Array.isArray(rawVal) 
            ? (rawVal as string[]) 
            : [String(rawVal)];
        }
      }

      const filtersWithUser: any = { ...filters, attributes };
      const wantsMyProducts = query.includeAll || query.myProducts;
      if (req.user?.id && (req.user.role === 'SELLER' || req.user.role === 'ADMIN') && wantsMyProducts) {
        filtersWithUser.userId = req.user.id;
      }
      // Public: belirli bir satıcının (mağaza) ürünlerini getir
      if (query.sellerId) {
        filtersWithUser.userId = query.sellerId;
      }

      const result = await ProductService.getProducts(filtersWithUser, page, limit);

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

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = ProductInputSchema.parse(req.body);
      const userId = req.user?.id;
      if (req.user?.name) {
        body.sellerName = req.user.name;
      }
      const product = await ProductService.createProduct(body, userId);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = ProductUpdateSchema.parse(req.body);
      const userId = req.user?.id;
      const product = await ProductService.updateProduct(id, body, userId);
      res.status(200).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },

  async getByIdAny(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const product = await ProductService.getProductByIdAny(id);
      
      if (userId && product.userId !== userId) {
        const err = new Error('You do not own this product') as Error & { statusCode: number };
        err.statusCode = 403;
        throw err;
      }

      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      await ProductService.deleteProduct(id, userId);
      res.status(200).json({ success: true, message: 'Product deleted' });
    } catch (err) {
      next(err);
    }
  },

  // ─── Q&As Controllers ─────────────────────────────────────────
  async getQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const questions = await ProductService.getQuestionsByProductId(id);
      res.json({ success: true, data: questions });
    } catch (err) {
      next(err);
    }
  },

  async createQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = QuestionInputSchema.parse(req.body);
      const question = await ProductService.createQuestion(id, body);
      res.status(201).json({ success: true, data: question });
    } catch (err) {
      next(err);
    }
  },

  async answerQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { questionId } = req.params;
      const { answer } = req.body;
      const result = await ProductService.createAnswerForQuestion(questionId, answer);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  // ─── Reviews Controllers ──────────────────────────────────────
  async getReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reviews = await ProductService.getReviewsByProductId(id);
      res.json({ success: true, data: reviews });
    } catch (err) {
      next(err);
    }
  },

  async createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = ReviewInputSchema.parse(req.body);
      const review = await ProductService.createReview(id, body);
      res.status(201).json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  },

  // ─── Super Admin ──────────────────────────────────────────────────
  async getAdminProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await ProductService.getAdminAllProducts();
      res.status(200).json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  },

  // ─── Bulk Operations ──────────────────────────────────────────
  async bulkUpdatePrice(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = BulkPriceSchema.parse(req.body);
      const userId = req.user?.id;
      const result = await ProductService.bulkUpdatePrice(body.productIds, body.operation, body.value, userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async bulkUpdateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = BulkStatusSchema.parse(req.body);
      const userId = req.user?.id;
      const result = await ProductService.bulkUpdateStatus(body.productIds, body.isActive, userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async bulkUpdateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = BulkCategorySchema.parse(req.body);
      const userId = req.user?.id;
      const result = await ProductService.bulkUpdateCategory(body.productIds, body.categoryName, userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async bulkDelete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = BulkDeleteSchema.parse(req.body);
      const userId = req.user?.id;
      const result = await ProductService.bulkDelete(body.productIds, userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async bulkUpdateStock(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const schema = z.object({
        productIds: z.array(z.string()).min(1),
        operation: z.enum(['SET', 'INCREASE', 'DECREASE']),
        value: z.coerce.number().min(0),
      });
      const body = schema.parse(req.body);
      const result = await ProductService.bulkUpdateStock(
        body.productIds, body.operation, body.value, req.user?.id
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async bulkUpdateCondition(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const schema = z.object({
        productIds: z.array(z.string()).min(1),
        condition: z.enum(['SIFIR', 'AZ_KULLANILMIS', 'IKINCI_EL']).optional(),
        listingType: z.enum(['KURUMSAL', 'BIREYSEL']).optional(),
      });
      const body = schema.parse(req.body);
      const result = await ProductService.bulkUpdateCondition(
        body.productIds, body.condition, body.listingType, req.user?.id
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async bulkUpdateVat(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const schema = z.object({
        productIds: z.array(z.string()).min(1),
        vatRate: z.coerce.number().refine((v) => [1, 10, 20].includes(v), 'KDV 1, 10 veya 20 olmalı'),
      });
      const body = schema.parse(req.body);
      const result = await ProductService.bulkUpdateVat(body.productIds, body.vatRate, req.user?.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
