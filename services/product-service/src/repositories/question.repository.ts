import prisma from './prisma.client';

export const QuestionRepository = {
  async findAll(productId: string) {
    return prisma.question.findMany({ where: { productId } });
  },
  async findById(id: string) {
    return prisma.question.findUnique({ where: { id } });
  },
  async create(data: any) {
    return prisma.question.create({ data });
  },
  async update(id: string, data: any) {
    return prisma.question.update({ where: { id }, data });
  },
  async delete(id: string) {
    return prisma.question.delete({ where: { id } });
  },
};
