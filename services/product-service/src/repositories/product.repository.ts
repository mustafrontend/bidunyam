import prisma from './prisma.client';
import { Prisma } from '@prisma/client';

export interface ProductFilters {
  category?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  condition?: string;
  listingType?: string;
  includeAll?: boolean;
  userId?: string;
  attributes?: Record<string, string[]>;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export const ProductRepository = {
  async findAll(
    filters: ProductFilters,
    pagination: PaginationOptions
  ) {
    const where: Prisma.ProductWhereInput = {};

    if (!filters.includeAll) {
      where.isActive = true;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.category) {
      const cat = filters.category.trim();
      const catOr: Prisma.ProductWhereInput[] = [
        { categoryName: { equals: cat, mode: Prisma.QueryMode.insensitive } },
        { categoryPath: { contains: cat, mode: Prisma.QueryMode.insensitive } },
        { name: { contains: cat, mode: Prisma.QueryMode.insensitive } },
      ];

      if (Array.isArray(where.AND)) {
        where.AND.push({ OR: catOr });
      } else if (where.AND) {
        where.AND = [where.AND as any, { OR: catOr }];
      } else {
        where.AND = [{ OR: catOr }];
      }
    }

    if (filters.brand && filters.brand.length > 0) {
      where.brandName = { in: filters.brand };
    }

    if (filters.listingType) {
      where.listingType = filters.listingType;
    }

    if (filters.condition) {
      where.condition = filters.condition;
    }

    if (filters.attributes && Object.keys(filters.attributes).length > 0) {
      const andConditions: any[] = [];
      for (const [key, values] of Object.entries(filters.attributes)) {
        if (values.length > 0) {
          andConditions.push({
            OR: values.map(val => ({
              categoryAttributes: {
                path: [key],
                equals: val
              }
            }))
          });
        }
      }
      if (andConditions.length > 0) {
        where.AND = andConditions;
      }
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {
        ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
      };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { categoryName: { contains: filters.search, mode: 'insensitive' } },
        { brandName: { contains: filters.search, mode: 'insensitive' } },
        { categoryPath: { contains: filters.search, mode: 'insensitive' } },
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

    // Dinamik Facets Hesaplanması
    let facets: Array<{ name: string; options: string[] }> = [];
    try {
      if (products.length > 0) {
        const productIds = products.map(p => p.id);
        const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
        
        // PostgreSQL jsonb_each_text kullanarak benzersiz key/value değerlerini çeker
        const facetsQuery = `
          SELECT 
            key as name, 
            json_agg(DISTINCT value) as options
          FROM 
            products p,
            jsonb_each_text(p."categoryAttributes")
          WHERE 
            p.id IN (${placeholders})
          GROUP BY key
        `;
        
        const rawFacets: any[] = await prisma.$queryRawUnsafe(facetsQuery, ...productIds);
        
        facets = rawFacets.map(f => ({
          name: f.name,
          options: f.options
        }));
      }
    } catch (err) {
      console.error("Facets extraction error:", err);
    }

    return { products, total, facets };
  },

  async findById(id: string) {
    return prisma.product.findFirst({
      where: { id, isActive: true },
      include: {
        questions: {
          orderBy: { createdAt: 'desc' }
        },
        reviews: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  },

  async findByIdAny(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { createdAt: 'desc' }
        },
        reviews: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  },

  async create(input: any) {
    return prisma.product.create({
      data: {
        userId: input.userId || 'admin-user-001',
        barcode: input.barcode,
        modelCode: input.modelCode,
        sku: input.sku,
        name: input.name,
        shortDescription: input.shortDescription || '',
        bulletPoints: input.bulletPoints || [],
        description: input.description,
        categoryPath: input.categoryPath || '',
        categoryAttributes: input.categoryAttributes || {},
        price: Number(input.price),
        purchasePrice: Number(input.purchasePrice),
        vatRate: Number(input.vatRate || 20),
        originalPrice: Number(input.originalPrice),
        discountPercent: Number(input.discountPercent || 0),
        categoryName: input.category || '',
        brandName: input.brand || '',
        variants: input.variants || [],
        extraServices: input.extraServices || [],
        variantGroupId: input.variantGroupId || '',
        variantValue: input.variantValue || '',
        imageUrls: input.imageUrls || [],
        imageUrl: input.imageUrl,
        desi: Number(input.desi || 0),
        preparationDays: Number(input.preparationDays || 1),
        shippingType: input.shippingType || 'MARKETPLACE_LOGISTICS',
        saleStatus: input.saleStatus || 'ACTIVE',
        approvalStatus: input.approvalStatus || 'APPROVED',
        marketplaceListingNo: input.marketplaceListingNo || '',
        stock: Number(input.stock || 0),
        rating: Number(input.rating || 0),
        reviewCount: Number(input.reviewCount || 0),
        isActive: input.isActive ?? true,
        condition: input.condition || 'SIFIR',
        listingType: input.listingType || 'KURUMSAL',
        sellerName: input.sellerName || 'FUAR BOX',
        sellerRating: Number(input.sellerRating || 9.3),
      },
    });
  },

  async updateById(id: string, input: any) {
    const data: Prisma.ProductUpdateInput = {};

    if (input.barcode !== undefined) data.barcode = input.barcode;
    if (input.modelCode !== undefined) data.modelCode = input.modelCode;
    if (input.sku !== undefined) data.sku = input.sku;
    if (input.name !== undefined) data.name = input.name;
    if (input.shortDescription !== undefined) data.shortDescription = input.shortDescription;
    if (input.bulletPoints !== undefined) data.bulletPoints = input.bulletPoints;
    if (input.description !== undefined) data.description = input.description;
    if (input.categoryPath !== undefined) data.categoryPath = input.categoryPath;
    if (input.categoryAttributes !== undefined) data.categoryAttributes = input.categoryAttributes;
    if (input.price !== undefined) data.price = Number(input.price);
    if (input.purchasePrice !== undefined) data.purchasePrice = Number(input.purchasePrice);
    if (input.vatRate !== undefined) data.vatRate = Number(input.vatRate);
    if (input.originalPrice !== undefined) data.originalPrice = Number(input.originalPrice);
    if (input.discountPercent !== undefined) data.discountPercent = Number(input.discountPercent);
    if (input.category !== undefined) data.categoryName = input.category;
    if (input.brand !== undefined) data.brandName = input.brand;
    if (input.variants !== undefined) data.variants = input.variants;
    if (input.extraServices !== undefined) data.extraServices = input.extraServices;
    if (input.variantGroupId !== undefined) data.variantGroupId = input.variantGroupId;
    if (input.variantValue !== undefined) data.variantValue = input.variantValue;
    if (input.imageUrls !== undefined) data.imageUrls = input.imageUrls;
    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
    if (input.desi !== undefined) data.desi = Number(input.desi);
    if (input.preparationDays !== undefined) data.preparationDays = Number(input.preparationDays);
    if (input.shippingType !== undefined) data.shippingType = input.shippingType;
    if (input.saleStatus !== undefined) data.saleStatus = input.saleStatus;
    if (input.approvalStatus !== undefined) data.approvalStatus = input.approvalStatus;
    if (input.condition !== undefined) data.condition = input.condition;
    if (input.listingType !== undefined) data.listingType = input.listingType;
    if (input.marketplaceListingNo !== undefined) data.marketplaceListingNo = input.marketplaceListingNo;
    if (input.stock !== undefined) data.stock = Number(input.stock);
    if (input.rating !== undefined) data.rating = Number(input.rating);
    if (input.reviewCount !== undefined) data.reviewCount = Number(input.reviewCount);
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.sellerName !== undefined) data.sellerName = input.sellerName;
    if (input.sellerRating !== undefined) data.sellerRating = Number(input.sellerRating);

    return prisma.product.update({
      where: { id },
      data,
    });
  },

  async deleteById(id: string): Promise<boolean> {
    try {
      await prisma.product.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },
};
