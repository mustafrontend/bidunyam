// 1 TL'lik test ürünü oluşturur (iyzico gerçek ödeme testi için).
// Container içinde çalıştırılır: docker cp + docker exec node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const stamp = Date.now();
  const product = await prisma.product.create({
    data: {
      barcode: 'TEST1TL' + stamp,
      sku: 'SKU-1TL-' + stamp,
      modelCode: 'BIDUNYAM-1TL',
      name: 'Test Ürünü 1 TL (iyzico Testi)',
      shortDescription: 'İyzico ödeme testi için 1 TL değerinde ürün.',
      description: 'Bu ürün yalnızca gerçek ödeme (iyzico) akışını test etmek için oluşturulmuştur. Fiyatı 1 TL\'dir.',
      bulletPoints: ['İyzico test ürünü', 'Fiyat: 1 TL'],
      categoryPath: 'Süpermarket > Atıştırmalık',
      categoryName: 'Süpermarket',
      brandName: 'biDünyam',
      price: 1,
      purchasePrice: 1,
      originalPrice: 1,
      discountPercent: 0,
      vatRate: 20,
      imageUrl: 'https://placehold.co/600x600/ff6000/ffffff/png',
      imageUrls: [],
      desi: 1,
      preparationDays: 1,
      stock: 100,
      saleStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      isActive: true,
      rating: 0,
      reviewCount: 0,
    },
  });
  console.log('CREATED_PRODUCT_ID=' + product.id);
  console.log('SLUG_URL=/product/test-urunu-1-tl-p-' + product.id);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error('ERROR', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
