const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

process.env.DATABASE_URL = "postgresql://trendyol_admin:Tr3ndyolSecret2024@localhost:5432/trendyol_users?schema=public";

const prisma = new PrismaClient();

async function seedGoogleTaxonomy() {
  console.log("Reading Google Taxonomy TR file...");
  // Read the downloaded markdown file containing the taxonomy
  const fileContent = fs.readFileSync(
    "C:\\Users\\mustafaozturk\\.gemini\\antigravity\\brain\\c6988717-f345-4582-95f6-2afc1159c9c0\\.system_generated\\steps\\2175\\content.md",
    "utf8"
  );

  const lines = fileContent.split('\n');
  const categories = new Set();
  const subCategories = new Set();
  
  console.log("Parsing categories...");

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#') || line.startsWith('Title:') || line.startsWith('Description:') || line.startsWith('Source:') || line === '---') {
      continue;
    }

    const parts = line.split(' > ').map(p => p.trim());
    if (parts.length === 0) continue;

    const mainCategory = parts[0];
    categories.add(mainCategory);

    // Any sub-level item will be added as a subcategory of the main category
    for (let i = 1; i < parts.length; i++) {
      subCategories.add(JSON.stringify({ main: mainCategory, sub: parts[i] }));
    }
  }

  console.log(`Bulunan Ana Kategori Sayısı: ${categories.size}`);
  console.log(`Bulunan Alt Kategori Sayısı: ${subCategories.size}`);
  console.log("Veritabanına kaydediliyor...");

  // 1. Insert Main Categories
  for (const mainName of categories) {
    await prisma.category.upsert({
      where: { name: mainName },
      update: {},
      create: { name: mainName }
    });
  }
  
  // 2. Fetch all main categories to get their IDs
  const allMainCategories = await prisma.category.findMany();
  const categoryMap = {};
  allMainCategories.forEach(c => categoryMap[c.name] = c.id);

  // 3. Insert Sub Categories
  let count = 0;
  for (const subStr of subCategories) {
    const { main, sub } = JSON.parse(subStr);
    const categoryId = categoryMap[main];
    
    if (categoryId) {
      // Upsert subcategory
      try {
         await prisma.subCategory.upsert({
            where: {
              name_categoryId: {
                name: sub,
                categoryId: categoryId
              }
            },
            update: {},
            create: {
              name: sub,
              categoryId: categoryId
            }
         });
         count++;
      } catch(e) {
         // ignore duplicates
      }
    }
  }

  console.log(`✅ İşlem Tamamlandı. ${categories.size} Ana Kategori ve ${count} Alt Kategori veritabanına başarıyla yüklendi.`);
}

seedGoogleTaxonomy()
  .catch(e => {
    console.error("Hata:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
