import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const campaigns = [
    {
      title: "GALAXY S25 ULTRA SERİSİ",
      description: "%0 FAİZLİ 3 TAKSİT FIRSATI",
      imageUrl: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?q=80&w=800&auto=format&fit=crop",
      discountType: "FIXED_AMOUNT",
      discountValue: 2000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: "ACTIVE"
    },
    {
      title: "ELEKTRONİK FIRSATLAR",
      description: "HER GÜN YENİLENEN İNDİRİMLER",
      imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800&auto=format&fit=crop",
      discountType: "PERCENTAGE",
      discountValue: 15,
      startDate: new Date(),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: "ACTIVE"
    },
    {
      title: "KİŞİSEL BAKIM ÜRÜNLERİ",
      description: "YAZA HAZIRLIK FIRSATLARI",
      imageUrl: "https://images.unsplash.com/photo-1522850959074-b7c11f71f5c1?q=80&w=800&auto=format&fit=crop",
      discountType: "PERCENTAGE",
      discountValue: 25,
      startDate: new Date(),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      status: "ACTIVE"
    },
    {
      title: "MODADA YENİ SEZON",
      description: "YAZ KOLEKSİYONUNDA KAÇIRILMAYACAK FIRSATLAR",
      imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
      discountType: "PERCENTAGE",
      discountValue: 40,
      startDate: new Date(),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: "ACTIVE"
    },
    {
      title: "EV GEREÇLERİ ŞENLİĞİ",
      description: "MUTFAK VE DEKORASYON ÜRÜNLERİ",
      imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=800&auto=format&fit=crop",
      discountType: "FIXED_AMOUNT",
      discountValue: 500,
      startDate: new Date(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: "ACTIVE"
    }
  ];

  for (const c of campaigns) {
    await prisma.campaign.create({
      data: c
    });
  }
  console.log("Mock campaigns inserted.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
