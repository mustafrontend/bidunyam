import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ReviewRepository } from '../repositories/review.repository';

const ReviewInputSchema = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5).default(5),
  comment: z.string().min(1),
  user: z.string().default('N** Ö**'),
  dateString: z.string().default('26 Ağustos 2025'),
  sellerName: z.string().default('KOZMETİK PINARIM'),
  likes: z.number().default(0),
});

const ReviewUpdateSchema = ReviewInputSchema.partial();

export const ReviewController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.query;
      const reviews = await ReviewRepository.findAll(productId as string);
      res.json({ success: true, data: reviews });
    } catch (err) {
      next(err);
    }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const review = await ReviewRepository.findById(id);
      res.json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = ReviewInputSchema.parse(req.body);
      const review = await ReviewRepository.create(body);
      res.status(201).json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const body = ReviewUpdateSchema.parse(req.body);
      const review = await ReviewRepository.update(id, body);
      res.json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ReviewRepository.delete(id);
      res.status(200).json({ success: true, message: 'Review deleted' });
    } catch (err) {
      next(err);
    }
  },
};
