const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const cats = await prisma.category.findMany({ include: { subCategories: true } });
  console.log("Total main categories:", cats.length);
  for (const cat of cats) {
    console.log(cat.name, "-> SubCats:", cat.subCategories.length);
    if (cat.subCategories.length > 0) {
      console.log("  Sample:", cat.subCategories[0].name);
    }
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
