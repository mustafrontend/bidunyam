import { ProductRepository, ProductFilters } from '../repositories/product.repository';

export const ProductService = {
  async getProducts(filters: ProductFilters, page: number, limit: number) {
    const { products, total } = await ProductRepository.findAll(filters, { page, limit });
    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  async getProductById(id: string) {
    const product = await ProductRepository.findById(id);
    if (!product) {
      const err = new Error('Product not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    return product;
  },

  async createProduct(input: Record<string, unknown>) {
    const imageUrls = Array.isArray(input.imageUrls)
      ? (input.imageUrls as string[]).filter(Boolean).slice(0, 5)
      : [];
    const fallbackImage = typeof input.imageUrl === 'string' ? input.imageUrl : '';
    const primaryImage = imageUrls[0] || fallbackImage;

    const payload = {
      ...input,
      imageUrls,
      imageUrl: primaryImage,
      category: (input.category as string) || String((input.categoryPath as string) || '').split('>').pop()?.trim() || 'Genel',
      discountPercent:
        Number(input.originalPrice) > 0
          ? Math.max(0, Math.round(((Number(input.originalPrice) - Number(input.price)) / Number(input.originalPrice)) * 100))
          : 0,
      isActive: input.saleStatus === 'PASSIVE' ? false : true,
    };

    const product = await ProductRepository.create(payload);
    return product;
  },

  async updateProduct(id: string, input: Record<string, unknown>) {
    const imageUrls = Array.isArray(input.imageUrls)
      ? (input.imageUrls as string[]).filter(Boolean).slice(0, 5)
      : undefined;

    const payload: Record<string, unknown> = {
      ...input,
      ...(imageUrls ? { imageUrls, imageUrl: imageUrls[0] } : {}),
      ...(typeof input.saleStatus === 'string' ? { isActive: input.saleStatus === 'PASSIVE' ? false : true } : {}),
    };

    if (typeof input.price === 'number' && typeof input.originalPrice === 'number' && Number(input.originalPrice) > 0) {
      payload.discountPercent = Math.max(
        0,
        Math.round(((Number(input.originalPrice) - Number(input.price)) / Number(input.originalPrice)) * 100)
      );
    }

    const product = await ProductRepository.updateById(id, payload);
    if (!product) {
      const err = new Error('Product not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    return product;
  },

  async deleteProduct(id: string): Promise<void> {
    await ProductRepository.deleteById(id);
  },

  async getProductByIdAny(id: string) {
    const product = await ProductRepository.findByIdAny(id);
    if (!product) {
      const err = new Error('Product not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    return product;
  },
};
