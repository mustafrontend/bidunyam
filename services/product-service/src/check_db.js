const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  console.log('Total products count:', await prisma.product.count());
  console.log('Recent 20 products:');
  console.log(JSON.stringify(products.map(p => ({
    id: p.id,
    name: p.name,
    isActive: p.isActive,
    approvalStatus: p.approvalStatus,
    userId: p.userId,
    sellerName: p.sellerName,
    createdAt: p.createdAt
  })), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
