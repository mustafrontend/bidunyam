import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { QuestionRepository } from '../repositories/question.repository';

const QuestionInputSchema = z.object({
  productId: z.string(),
  category: z.string().default('tümü'),
  question: z.string().min(1),
  user: z.string().default('M** Ö**'),
  purchased: z.boolean().default(true),
  sellerName: z.string().default('FUAR BOX'),
  responseRate: z.string().optional(),
  answer: z.string().optional(),
  status: z.string().default('PENDING'),
});

const QuestionUpdateSchema = QuestionInputSchema.partial();

export const QuestionController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.query;
      const questions = await QuestionRepository.findAll(productId as string);
      res.json({ success: true, data: questions });
    } catch (err) {
      next(err);
    }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const question = await QuestionRepository.findById(id);
      res.json({ success: true, data: question });
    } catch (err) {
      next(err);
    }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = QuestionInputSchema.parse(req.body);
      const question = await QuestionRepository.create(body);
      res.status(201).json({ success: true, data: question });
    } catch (err) {
      next(err);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const body = QuestionUpdateSchema.parse(req.body);
      const question = await QuestionRepository.update(id, body);
      res.json({ success: true, data: question });
    } catch (err) {
      next(err);
    }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await QuestionRepository.delete(id);
      res.status(200).json({ success: true, message: 'Question deleted' });
    } catch (err) {
      next(err);
    }
  },
};
