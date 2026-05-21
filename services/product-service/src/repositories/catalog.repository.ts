import prisma from './prisma.client';

export const CatalogRepository = {

  async upsertBrand(name?: string): Promise<any> {
    if (!name) return null;
    // Brand'i varsa bul, yoksa oluştur
    return prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  },

  async upsertCategory(mainCategory?: string, subCategory?: string): Promise<any> {
    if (!mainCategory) return null;
    // Ana kategori varsa bul, yoksa oluştur
    let category = await prisma.category.findUnique({ where: { name: mainCategory } });
    if (!category) {
      category = await prisma.category.create({ data: { name: mainCategory } });
    }
    let subCat = null;
    if (subCategory) {
      subCat = await prisma.subCategory.findFirst({ where: { name: subCategory, categoryId: category.id } });
      if (!subCat) {
        subCat = await prisma.subCategory.create({ data: { name: subCategory, categoryId: category.id } });
      }
    }
    return { category, subCategory: subCat };
  },

  async syncFromProduct(_input: { brand?: string; category?: string; categoryPath?: string }): Promise<void> {
    // No-op since we aggregate dynamically from Products table
  },

  async getOptions(): Promise<{
    brands: string[];
    categories: Array<{ name: string; subCategories: string[] }>;
  }> {
    // Brand, Category ve SubCategory tablolarından oku
    const [brandsData, categoriesData, subCategoriesData] = await Promise.all([
      prisma.brand.findMany({ orderBy: { name: 'asc' } }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.subCategory.findMany({ orderBy: { name: 'asc' } }),
    ]);

    const brands = brandsData.map((b: any) => b.name).filter(Boolean);
    const categories = categoriesData.map((cat: any) => ({
      name: cat.name,
      subCategories: subCategoriesData
        .filter((sub: any) => sub.categoryId === cat.id)
        .map((sub: any) => sub.name)
        .sort((a: string, b: string) => a.localeCompare(b, 'tr')),
    }));

    return {
      brands,
      categories,
    };
  },
};
