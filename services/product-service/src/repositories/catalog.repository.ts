import prisma from './prisma.client';
import { normalizeMainCategory, normalizeSubCategory } from '../data/categoryNormalize';

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
    // Serbest metin kategori adlarını kanonik ağaca eşle (çöp/kopya birikmesin)
    const mainName = normalizeMainCategory(mainCategory);
    if (!mainName) return null;
    // Ana kategori varsa bul, yoksa oluştur
    let category = await prisma.category.findUnique({ where: { name: mainName } });
    if (!category) {
      category = await prisma.category.create({ data: { name: mainName } });
    }
    let subCat = null;
    const subName = normalizeSubCategory(subCategory);
    // Boş/ara kademe alt kategorileri (ör. "Üst Giyim") oluşturma
    if (subName && subName.toLocaleLowerCase('tr') !== mainName.toLocaleLowerCase('tr')) {
      subCat = await prisma.subCategory.findFirst({ where: { name: subName, categoryId: category.id } });
      if (!subCat) {
        subCat = await prisma.subCategory.create({ data: { name: subName, categoryId: category.id } });
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
