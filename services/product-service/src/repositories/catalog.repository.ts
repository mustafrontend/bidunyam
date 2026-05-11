import { Brand } from '../models/brand.model';
import { Category } from '../models/category.model';

function normalizeValue(value: string): string {
  return value.trim().toLocaleLowerCase('tr');
}

function splitCategoryPath(path?: string): { main: string; sub: string } {
  const [main = '', sub = ''] = (path || '').split('>').map((part) => part.trim());
  return { main, sub };
}

export const CatalogRepository = {
  async upsertBrand(name?: string): Promise<void> {
    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
      return;
    }

    await Brand.findOneAndUpdate(
      { normalizedName: normalizeValue(trimmedName) },
      { name: trimmedName, normalizedName: normalizeValue(trimmedName) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  },

  async upsertCategory(mainCategory?: string, subCategory?: string): Promise<void> {
    const main = String(mainCategory || '').trim();
    const sub = String(subCategory || '').trim();

    if (!main) {
      return;
    }

    const normalizedMain = normalizeValue(main);

    const category = await Category.findOneAndUpdate(
      { normalizedName: normalizedMain },
      { name: main, normalizedName: normalizedMain },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!sub) {
      return;
    }

    const normalizedSub = normalizeValue(sub);
    const hasSub = category.subCategories.some((item) => item.normalizedName === normalizedSub);

    if (!hasSub) {
      category.subCategories.push({ name: sub, normalizedName: normalizedSub });
      await category.save();
    }
  },

  async syncFromProduct(input: { brand?: string; category?: string; categoryPath?: string }): Promise<void> {
    const path = splitCategoryPath(input.categoryPath || input.category);
    const mainCategory = path.main || String(input.category || '').trim();
    const subCategory = path.sub;

    await Promise.all([
      this.upsertBrand(input.brand),
      this.upsertCategory(mainCategory, subCategory),
    ]);
  },

  async getOptions(): Promise<{
    brands: string[];
    categories: Array<{ name: string; subCategories: string[] }>;
  }> {
    const [brands, categories] = await Promise.all([
      Brand.find({}, { name: 1, _id: 0 }).sort({ name: 1 }),
      Category.find({}, { name: 1, subCategories: 1, _id: 0 }).sort({ name: 1 }),
    ]);

    return {
      brands: brands.map((item) => item.name),
      categories: categories.map((item) => ({
        name: item.name,
        subCategories: [...item.subCategories]
          .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
          .map((sub) => sub.name),
      })),
    };
  },
};
