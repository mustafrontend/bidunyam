const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const cat = await prisma.category.findUnique({
    where: { name: 'Bebek ve Küçük Çocuk Ürünleri' },
    include: { subCategories: true }
  });
  console.log("Subcategories for Bebek ve Küçük Çocuk Ürünleri:", cat?.subCategories.slice(0, 10));
  console.log("Total subcategories:", cat?.subCategories.length);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
