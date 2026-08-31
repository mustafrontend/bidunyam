const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const r = await prisma.platformSetting.upsert({
    where: { id: 'default' },
    create: { id: 'default', freeShippingLimit: 1 },
    update: { freeShippingLimit: 1 },
  });
  console.log('freeShippingLimit=' + r.freeShippingLimit);
  await prisma.$disconnect();
})().catch(async e => { console.error('ERR', e.message); await prisma.$disconnect(); process.exit(1); });
