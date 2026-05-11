import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProductService } from '../services/product.service';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  search: z.string().optional(),
});

export const ProductController = {
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
};
