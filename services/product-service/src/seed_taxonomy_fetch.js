const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Fetching Google Taxonomy TR...");
  const res = await fetch("https://www.google.com/basepages/producttype/taxonomy.tr-TR.txt");
  const text = await res.text();
  
  const lines = text.split('\n');
  const categories = new Set();
  const subCategories = new Set();
  
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    
    const parts = line.split(' > ').map(p => p.trim());
    if (parts.length === 0) continue;
    
    const mainCategory = parts[0];
    categories.add(mainCategory);
    
    for (let i = 1; i < parts.length; i++) {
      subCategories.add(JSON.stringify({ main: mainCategory, sub: parts[i] }));
    }
  }

  console.log(`Found ${categories.size} main categories and ${subCategories.size} subcategories.`);
  
  for (const mainName of categories) {
    await prisma.category.upsert({
      where: { name: mainName },
      update: {},
      create: { name: mainName }
    });
  }
  
  const allMain = await prisma.category.findMany();
  const catMap = {};
  allMain.forEach(c => catMap[c.name] = c.id);
  
  let count = 0;
  for (const subStr of subCategories) {
    const { main, sub } = JSON.parse(subStr);
    const catId = catMap[main];
    if (catId) {
      try {
         await prisma.subCategory.upsert({
            where: { name_categoryId: { name: sub, categoryId: catId } },
            update: {},
            create: { name: sub, categoryId: catId }
         });
         count++;
      } catch(e) {}
    }
  }
  
  console.log(`✅ Success! Inserted ${categories.size} main categories and ${count} subcategories.`);
}

run()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
