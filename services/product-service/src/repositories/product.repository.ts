import { Product, IProduct } from '../models/product.model';

export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export const ProductRepository = {
  async findAll(
    filters: ProductFilters,
    pagination: PaginationOptions
  ): Promise<{ products: IProduct[]; total: number }> {
    const query: Record<string, unknown> = { isActive: true };

    if (filters.category) query.category = filters.category;
    if (filters.brand) query.brand = filters.brand;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {
        ...(filters.minPrice !== undefined && { $gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { $lte: filters.maxPrice }),
      };
    }
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(pagination.limit).sort({ createdAt: -1 }),
      Product.countDocuments(query),
    ]);

    return { products, total };
  },

  async findById(id: string): Promise<IProduct | null> {
    return Product.findOne({ _id: id, isActive: true });
  },

  async seed(products: Partial<IProduct>[]): Promise<void> {
    await Product.insertMany(products, { ordered: false });
  },
};
