const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Scanning existing products for categories and brands...");
  
  // Get all unique categories
  const products = await prisma.product.findMany({
    select: { categoryName: true, brandName: true, categoryPath: true },
    distinct: ['categoryName', 'brandName']
  });

  const uniqueCategories = new Set();
  const uniqueBrands = new Set();

  for (const p of products) {
    if (p.categoryPath) uniqueCategories.add(p.categoryPath.trim());
    else if (p.categoryName) uniqueCategories.add(p.categoryName.trim());
    
    if (p.brandName) uniqueBrands.add(p.brandName.trim());
  }

  console.log(`Found ${uniqueCategories.size} unique categories and ${uniqueBrands.size} unique brands.`);

  // Insert Brands
  for (const brand of uniqueBrands) {
    if (!brand) continue;
    await prisma.brand.upsert({
      where: { name: brand },
      update: {},
      create: { name: brand }
    });
  }

  // Insert Categories
  for (const catStr of uniqueCategories) {
    if (!catStr) continue;
    const parts = catStr.split('>').map(p => p.trim()).filter(Boolean);
    const mainCategory = parts[0] || catStr;
    const subCategory = parts[1] || undefined;

    let dbCat = await prisma.category.findUnique({ where: { name: mainCategory } });
    if (!dbCat) {
      dbCat = await prisma.category.create({ data: { name: mainCategory } });
    }

    if (subCategory) {
      let subCat = await prisma.subCategory.findFirst({ where: { name: subCategory, categoryId: dbCat.id } });
      if (!subCat) {
        await prisma.subCategory.create({ data: { name: subCategory, categoryId: dbCat.id } });
      }
    }
  }

  console.log("Sync complete!");
  await prisma.$disconnect();
}

run().catch(console.error);
