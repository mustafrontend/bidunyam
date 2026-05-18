import prisma from './prisma.client';

export const ReviewRepository = {
  async findAll(productId: string) {
    return prisma.review.findMany({ where: { productId } });
  },
  async findById(id: string) {
    return prisma.review.findUnique({ where: { id } });
  },
  async create(data: any) {
    return prisma.review.create({ data });
  },
  async update(id: string, data: any) {
    return prisma.review.update({ where: { id }, data });
  },
  async delete(id: string) {
    return prisma.review.delete({ where: { id } });
  },
};
