import prisma from './prisma.client';

export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  includeAll?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export const ProductRepository = {
  async findAll(filters: ProductFilters, pagination: PaginationOptions) {
    const where: any = filters.includeAll ? {} : { isActive: true };
    if (filters.category) where.category = filters.category;
    if (filters.brand) where.brand = filters.brand;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    const skip = (pagination.page - 1) * pagination.limit;
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);
    return { products, total };
  },

  async findById(id: string) {
    return prisma.product.findFirst({ where: { id, isActive: true } });
  },

  async create(input: any) {
    return prisma.product.create({ data: input });
  },

  async updateById(id: string, input: any) {
    return prisma.product.update({ where: { id }, data: input });
  },

  async findByIdAny(id: string) {
    return prisma.product.findUnique({ where: { id } });
  },

  async deleteById(id: string) {
    await prisma.product.delete({ where: { id } });
    return true;
  },
};
