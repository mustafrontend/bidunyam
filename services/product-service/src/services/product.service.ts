import { ProductRepository, ProductFilters } from '../repositories/product.repository';
import { CatalogRepository } from '../repositories/catalog.repository';
import prisma from '../repositories/prisma.client';
import { initElasticsearch, indexProduct, syncXmlProductsToSearch } from '../repositories/elasticsearch.client';
import { xmlCatalogService } from './xmlCatalog.service';

export const ProductService = {
  async getProducts(filters: ProductFilters, page: number, limit: number) {
    const { products, total, facets } = await ProductRepository.findAll(filters, { page, limit });

    return {
      products,
      facets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  async getProductById(id: string) {
    const product = await ProductRepository.findById(id);
    if (!product) {
      const err = new Error('Product not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    // Increment views asynchronously
    prisma.product.update({
      where: { id },
      data: { views: { increment: 1 } }
    }).catch(console.error);

    return product;
  },

  async createProduct(input: Record<string, any>, userId?: string) {
    const imageUrls = Array.isArray(input.imageUrls)
      ? (input.imageUrls as string[]).filter(Boolean).slice(0, 5)
      : [];
    const fallbackImage = typeof input.imageUrl === 'string' ? input.imageUrl : '';
    const primaryImage = imageUrls[0] || fallbackImage;

    const payload = {
      ...input,
      userId,
      imageUrls,
      imageUrl: primaryImage,
      category: (input.category as string) || String((input.categoryPath as string) || '').split('>').pop()?.trim() || 'Genel',
      discountPercent:
        Number(input.originalPrice) > 0
          ? Math.max(0, Math.round(((Number(input.originalPrice) - Number(input.price)) / Number(input.originalPrice)) * 100))
          : 0,
      isActive: input.saleStatus === 'PASSIVE' ? false : true,
    };

    const product = await ProductRepository.create(payload);
    await indexProduct(product);
    return product;
  },

  async updateProduct(id: string, input: Record<string, any>, userId?: string) {
    if (userId) {
      const existing = await ProductRepository.findByIdAny(id);
      if (!existing) {
        const err = new Error('Product not found') as Error & { statusCode: number };
        err.statusCode = 404;
        throw err;
      }
      if (existing.userId !== userId) {
        const err = new Error('You do not own this product') as Error & { statusCode: number };
        err.statusCode = 403;
        throw err;
      }
    }

    const imageUrls = Array.isArray(input.imageUrls)
      ? (input.imageUrls as string[]).filter(Boolean).slice(0, 5)
      : undefined;

    const payload: Record<string, any> = {
      ...input,
      ...(imageUrls ? { imageUrls, imageUrl: imageUrls[0] } : {}),
      ...(typeof input.saleStatus === 'string' ? { isActive: input.saleStatus === 'PASSIVE' ? false : true } : {}),
    };

    if (typeof input.price === 'number' && typeof input.originalPrice === 'number' && Number(input.originalPrice) > 0) {
      payload.discountPercent = Math.max(
        0,
        Math.round(((Number(input.originalPrice) - Number(input.price)) / Number(input.originalPrice)) * 100)
      );
    }

    const product = await ProductRepository.updateById(id, payload);
    if (!product) {
      const err = new Error('Product not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    await indexProduct(product);
    return product;
  },

  async deleteProduct(id: string, userId?: string): Promise<void> {
    if (userId) {
      const existing = await ProductRepository.findByIdAny(id);
      if (!existing) {
        const err = new Error('Product not found') as Error & { statusCode: number };
        err.statusCode = 404;
        throw err;
      }
      if (existing.userId !== userId) {
        const err = new Error('You do not own this product') as Error & { statusCode: number };
        err.statusCode = 403;
        throw err;
      }
    }

    const deleted = await ProductRepository.deleteById(id);
    if (!deleted) {
      const err = new Error('Product not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
  },

  async getProductByIdAny(id: string) {
    const product = await ProductRepository.findByIdAny(id);
    if (!product) {
      const err = new Error('Product not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    return product;
  },

  async getCatalogOptions() {
    return CatalogRepository.getOptions();
  },

  async createBrandOption(name: string) {
    await CatalogRepository.upsertBrand(name);
    return CatalogRepository.getOptions();
  },

  async createCategoryOption(mainCategory: string, subCategory?: string) {
    await CatalogRepository.upsertCategory(mainCategory, subCategory);
    return CatalogRepository.getOptions();
  },

  async getCategoryFilters(category: string) {
    // 1. Check if there's a predefined filter template for this category
    const template = await prisma.categoryFilterTemplate.findUnique({
      where: { categoryName: category },
    }).catch(() => null);

    if (template && Array.isArray(template.filters) && (template.filters as any[]).length > 0) {
      return {
        category,
        attributes: template.filters,
        source: 'template',
      };
    }

    // 2. Auto-extract from products' categoryAttributes JSON field
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { categoryName: category },
          { categoryPath: { contains: category, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      select: { categoryAttributes: true },
      take: 500,
    });

    const facetMap = new Map<string, Set<string>>();
    for (const p of products) {
      const attrs = p.categoryAttributes as Record<string, string> | null;
      if (!attrs || typeof attrs !== 'object') continue;
      for (const [key, value] of Object.entries(attrs)) {
        if (!key || !value || typeof value !== 'string') continue;
        if (!facetMap.has(key)) facetMap.set(key, new Set());
        facetMap.get(key)!.add(value);
      }
    }

    const attributes = Array.from(facetMap.entries())
      .map(([name, optionsSet]) => ({
        name,
        options: Array.from(optionsSet).sort((a, b) => a.localeCompare(b, 'tr')),
      }))
      .filter(attr => attr.options.length > 1)
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    return {
      category,
      attributes,
      source: 'auto',
    };
  },

  // ─── Category Filter Templates (Dinamik Kategori Şablonları) ──
  async getFilterTemplates() {
    return prisma.categoryFilterTemplate.findMany({
      orderBy: { categoryName: 'asc' },
    });
  },

  async getFilterTemplate(categoryName: string) {
    return prisma.categoryFilterTemplate.findUnique({
      where: { categoryName },
    });
  },

  async upsertFilterTemplate(categoryName: string, filters: any[]) {
    return prisma.categoryFilterTemplate.upsert({
      where: { categoryName },
      update: { filters },
      create: { categoryName, filters },
    });
  },

  async deleteFilterTemplate(categoryName: string) {
    await prisma.categoryFilterTemplate.delete({ where: { categoryName } }).catch(() => null);
    return { deleted: true };
  },

  // Taksonomi + filtre şablonlarını seed'ler (kategori/alt kategori tabloları + şablonlar)
  async seedTaxonomy() {
    const { TAXONOMY, flattenTemplates } = await import('../data/taxonomy');

    for (const cat of TAXONOMY) {
      const category = await prisma.category.upsert({
        where: { name: cat.name },
        update: {},
        create: { name: cat.name },
      });
      for (const sub of cat.subCategories) {
        const existingSub = await prisma.subCategory.findFirst({
          where: { name: sub.name, categoryId: category.id },
        });
        if (!existingSub) {
          await prisma.subCategory.create({
            data: { name: sub.name, categoryId: category.id },
          });
        }
      }
    }

    // Filtre şablonları (alt kategori adına göre)
    const templates = flattenTemplates();
    for (const t of templates) {
      await prisma.categoryFilterTemplate.upsert({
        where: { categoryName: t.categoryName },
        update: { filters: t.filters as any },
        create: { categoryName: t.categoryName, filters: t.filters as any },
      });
    }
    console.log(`[Taxonomy Seed] ${TAXONOMY.length} kategori, ${templates.length} filtre şablonu senkronlandı.`);
  },

  // ─── Question & Answer Methods ──────────────────────────────
  async getQuestionsByProductId(productId: string) {
    return prisma.question.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createQuestion(productId: string, input: any) {
    const question = await prisma.question.create({
      data: {
        productId,
        question: input.question,
        user: input.user || 'M** Ö**',
        purchased: input.purchased !== false,
        sellerName: input.sellerName || 'FUAR BOX',
        category: input.category || 'tümü',
        status: 'PENDING',
      },
    });

    // Simulated seller reply after 3 seconds
    setTimeout(async () => {
      try {
        await prisma.question.update({
          where: { id: question.id },
          data: {
            answer: 'Merhaba, sorunuz için teşekkür ederiz. Ürünümüz %100 orijinal ve T.C. Tarım ve Orman Bakanlığı onaylıdır. Gönül rahatlığıyla kullanabilirsiniz. Başka bir sorunuz olursa yardımcı olmaktan mutluluk duyarız.',
            status: 'ANSWERED',
            responseRate: '1 saniye önce cevaplandı.',
          },
        });
        console.log(`[Product Service] Simulated reply successfully persisted for question ${question.id}`);
      } catch (err) {
        console.error('[Product Service] Simulated reply persistence failed:', err);
      }
    }, 3000);

    return question;
  },

  async createAnswerForQuestion(questionId: string, answer: string) {
    return prisma.question.update({
      where: { id: questionId },
      data: {
        answer,
        status: 'ANSWERED',
        responseRate: 'Az önce cevaplandı.',
      },
    });
  },

  // ─── Product Review Methods ────────────────────────────────
  async getReviewsByProductId(productId: string) {
    return prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createReview(productId: string, input: any) {
    const review = await prisma.review.create({
      data: {
        productId,
        rating: Number(input.rating || 5),
        comment: input.comment || '',
        user: input.user || 'N** Ö**',
        dateString: input.dateString || 'Yeni Değerlendirme',
        sellerName: input.sellerName || 'KOZMETİK PINARIM',
        likes: Number(input.likes || 0),
      },
    });

    // Aggregate product ratings
    const reviews = await prisma.review.findMany({
      where: { productId },
    });
    const reviewCount = reviews.length;
    const totalRatingSum = reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
    const rating = reviewCount > 0 ? Number((totalRatingSum / reviewCount).toFixed(1)) : 5.0;

    await prisma.product.update({
      where: { id: productId },
      data: {
        reviewCount,
        rating,
      },
    });

    return review;
  },

  async syncAllToSearch(): Promise<void> {
    try {
      await initElasticsearch();
      const products = await prisma.product.findMany();
      for (const product of products) {
        await indexProduct(product);
      }
      console.log(`[ES] Synced all ${products.length} products to search index.`);

      // Also sync active XML products across all users if any exist
      const allActiveXmlProducts = xmlCatalogService.getAllActiveProducts();
      if (allActiveXmlProducts && allActiveXmlProducts.length > 0) {
        console.log(`[ES] Found ${allActiveXmlProducts.length} active XML products across all users, syncing to search index...`);
        // Group by userId and sync
        const productsByUser: Record<string, any[]> = {};
        for (const p of allActiveXmlProducts) {
          if (!productsByUser[p.userId]) {
            productsByUser[p.userId] = [];
          }
          productsByUser[p.userId].push(p);
        }

        for (const [userId, items] of Object.entries(productsByUser)) {
          await syncXmlProductsToSearch(items, userId);
        }
      }
    } catch (err) {
      console.error('[ES] Failed to sync products to search index:', err);
    }
  },

  async seedProducts() {
    const count = await prisma.product.count();
    if (count > 0) {
      console.log('[Product Seed] Database already has products. Skipping seed...');
      return;
    }

    console.log('[Product Seed] Database is empty. Seeding sample products...');

    const productsData = [
      {
        barcode: "195949733064",
        modelCode: "A3106",
        sku: "IPH15PROMAX-256NT",
        name: "Apple iPhone 15 Pro Max 256 GB Natürel Titanyum",
        shortDescription: "A17 Pro çip. Titanyum tasarım. Pro kamera sistemi.",
        bulletPoints: ["Güçlü Titanyum gövde", "A17 Pro üstün performanslı çip", "5x Optik zoom kamera", "USB-C destekli hızlı veri aktarımı"],
        description: "Karşınızda havacılık ve uzay endüstrisi standartlarında titanyum tasarıma sahip ilk iPhone olan iPhone 15 Pro Max. A17 Pro çip ile oyunlarda ve günlük kullanımda devrim yaratıyor. Bugüne kadarki en güçlü iPhone kamera sistemi ile her detayı yakalayın.",
        categoryPath: "Elektronik > Telefon > Cep Telefonu",
        category: "Elektronik",
        brand: "Apple",
        price: 72999,
        originalPrice: 77999,
        purchasePrice: 60000,
        discountPercent: 6,
        imageUrls: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80"],
        imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
        stock: 15,
        rating: 4.8,
        reviewCount: 2,
        sellerName: "APPLE TÜRKIYE",
        sellerRating: 9.9,
        approvalStatus: "APPROVED",
        isActive: true,
      },
      {
        barcode: "195949733071",
        modelCode: "MBPM3MAX",
        sku: "MBPM3MAX-14SB",
        name: "MacBook Pro M3 Max 14 inç Uzay Siyahı",
        shortDescription: "M3 Max çip. Liquid Retina XDR ekran. Pro performans.",
        bulletPoints: ["14 inç Liquid Retina XDR", "M3 Max 14 CPU, 30 GPU çekirdeği", "36 GB Birleşik Bellek", "Tüm gün süren pil ömrü"],
        description: "MacBook Pro, M3 Max çipin getirdiği devasa performans ile sınırları aşıyor. En zorlu iş akışları, 3D çizimler, render işlemleri ve yazılım geliştirme süreçleri için mükemmel bir canavar. Eşsiz Liquid Retina XDR ekran ile görselleriniz hiç olmadığı kadar canlı.",
        categoryPath: "Elektronik > Bilgisayar > Laptop",
        category: "Elektronik",
        brand: "Apple",
        price: 104999,
        originalPrice: 109999,
        purchasePrice: 90000,
        discountPercent: 5,
        imageUrls: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"],
        imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        stock: 8,
        rating: 4.9,
        reviewCount: 2,
        sellerName: "APPLE TÜRKIYE",
        sellerRating: 9.9,
        approvalStatus: "APPROVED",
        isActive: true,
      },
      {
        barcode: "868000000001",
        modelCode: "SW-OVS-BLK",
        sku: "SW-OVS-BLK-XL",
        name: "Oversize Unisex Siyah Kapüşonlu Sweatshirt",
        shortDescription: "%100 Pamuk, yumuşacık şardonlu içi, rahat kesim.",
        bulletPoints: ["Organik sürdürülebilir pamuk", "Yumuşacık şardonlu iç yüzey", "Modern oversize kalıp", "Dayanıklı çift kat dikişler"],
        description: "Günün her saati rahatlığı ve şıklığı bir arada yaşamak isteyenler için tasarlandı. %100 birinci sınıf organik pamuk kumaştan üretilen bu kapüşonlu sweatshirt, dökümlü duruşu ve yumuşacık içiyle favori giysiniz olacak.",
        categoryPath: "Giyim > Üst Giyim > Sweatshirt",
        category: "Giyim",
        brand: "BasicWear",
        price: 499,
        originalPrice: 699,
        purchasePrice: 200,
        discountPercent: 29,
        imageUrls: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80"],
        imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
        stock: 120,
        rating: 4.5,
        reviewCount: 2,
        sellerName: "TREND MODA",
        sellerRating: 9.2,
        approvalStatus: "APPROVED",
        isActive: true,
      },
      {
        barcode: "697099578631",
        modelCode: "Q7MAX",
        sku: "ROBO-Q7MAX-WHT",
        name: "Roborock Q7 Max Robot Süpürge ve Paspas",
        shortDescription: "4200 Pa emiş gücü. LiDAR navigasyon. Akıllı temizlik.",
        bulletPoints: ["4200 Pa ultra yüksek emiş gücü", "3D LiDAR haritalama navigasyonu", "Süpürme ve paspaslama bir arada", "Büyük toz ve su haznesi"],
        description: "Roborock Q7 Max, evinizi zahmetsizce temizlemeniz için geliştirildi. 4200 Pa emiş gücü halılardaki en dip kirleri bile çekerken, hassas su pompalı paspas sistemi zeminlerinizi pırıl pırıl yapar. LiDAR navigasyonu sayesinde hiçbir engeli kaçırmaz.",
        categoryPath: "Ev & Yaşam > Elektrikli Ev Aletleri > Robot Süpürge",
        category: "Ev & Yaşam",
        brand: "Roborock",
        price: 14499,
        originalPrice: 16999,
        purchasePrice: 11000,
        discountPercent: 15,
        imageUrls: ["https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80"],
        imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
        stock: 35,
        rating: 4.7,
        reviewCount: 2,
        sellerName: "TEKNO CADDESİ",
        sellerRating: 9.5,
        approvalStatus: "APPROVED",
        isActive: true,
      },
      {
        barcode: "314589107360",
        modelCode: "BDC-EDP-100",
        sku: "CHANEL-BDC-100",
        name: "Bleu De Chanel Eau De Parfum 100 ml Erkek Parfümü",
        shortDescription: "Asil, özgür ve çekici bir erkeğin imza kokusu.",
        bulletPoints: ["Eau De Parfum (Kalıcı koku)", "Odunsu ve aromatik esintiler", "100 ml şık cam şişe", "Tüm cilt tiplerine uygun"],
        description: "Bleu De Chanel, sınır tanımayan, özgürlüğüne düşkün ve karizmatik erkeklerin kokusu. Taze narenciye akorları, kuru sedir ağacı ve kremsi sandal ağacının muhteşem harmanı ile teninizde gün boyu süren asil ve kalıcı bir iz bırakır.",
        categoryPath: "Kozmetik > Parfüm > Erkek Parfüm",
        category: "Kozmetik",
        brand: "Chanel",
        price: 4850,
        originalPrice: 5200,
        purchasePrice: 3000,
        discountPercent: 7,
        imageUrls: ["https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80"],
        imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
        stock: 50,
        rating: 4.6,
        reviewCount: 2,
        sellerName: "KOZMETİK PINARIM",
        sellerRating: 9.4,
        approvalStatus: "APPROVED",
        isActive: true,
      },
      {
        barcode: "868111111112",
        modelCode: "CHAIR-ERG-01",
        sku: "OFFICE-CHAIR-BLK",
        name: "Ortopedik Yönetici Çalışma Koltuğu Siyah",
        shortDescription: "Ortopedik bel ve boyun desteği. Fileli nefes alan sırt.",
        bulletPoints: ["Çift kollu amortisörlü mekanizma", "Ergonomik sırt ve bel desteği", "360 derece dönebilen sessiz tekerler", "Nefes alan terletmez file kumaş"],
        description: "Uzun saatler bilgisayar başında çalışanlar için ideal ortopedik yönetici koltuğu. Bel ve boyun ağrılarını azaltan ergonomik tasarımı, amortisörlü yükseklik ayarı ve sırt eğim kilitleme mekanizması ile ofisinize veya çalışma odanıza konfor getirir.",
        categoryPath: "Ev & Yaşam > Mobilya > Ofis Mobilyaları",
        category: "Ev & Yaşam",
        brand: "OfisLine",
        price: 2499,
        originalPrice: 3299,
        purchasePrice: 1500,
        discountPercent: 24,
        imageUrls: ["https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80"],
        imageUrl: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80",
        stock: 40,
        rating: 4.4,
        reviewCount: 2,
        sellerName: "OFİS DEPOSU",
        sellerRating: 9.1,
        approvalStatus: "APPROVED",
        isActive: true,
      }
    ];

    for (const pData of productsData) {
      const { category, brand, ...rest } = pData;
      const product = await prisma.product.create({
        data: {
          ...rest,
          categoryName: category,
          brandName: brand,
        }
      });

      // Create sample Reviews
      await prisma.review.createMany({
        data: [
          {
            productId: product.id,
            rating: 5,
            comment: "Harika bir ürün, kesinlikle tavsiye ediyorum!",
            user: "Mustafa Ö.",
            dateString: "10 Mart 2026",
            sellerName: product.sellerName,
            likes: 12,
          },
          {
            productId: product.id,
            rating: 4,
            comment: "Fiyat performansı mükemmel, paketleme çok iyiydi.",
            user: "Ayşe Y.",
            dateString: "14 Mart 2026",
            sellerName: product.sellerName,
            likes: 5,
          }
        ]
      });

      // Create sample Questions
      await prisma.question.createMany({
        data: [
          {
            productId: product.id,
            category: "Ürün Bilgisi",
            question: "Merhaba, ürünün garanti süresi kaç yıldır ve yetkili servis mi bakıyor?",
            user: "Ahmet K.",
            purchased: false,
            sellerName: product.sellerName,
            responseRate: "12 dakika içinde cevaplandı.",
            answer: `Merhaba, ürünümüz 2 yıl distribütör garantilidir. Türkiye'deki yetkili servislerden hizmet alabilirsiniz. İlginiz için teşekkür ederiz.`,
            status: "ANSWERED",
          },
          {
            productId: product.id,
            category: "Kargo ve Teslimat",
            question: "Bugün sipariş versem hangi gün kargoya teslim edilir acaba?",
            user: "Zeynep S.",
            purchased: true,
            sellerName: product.sellerName,
            responseRate: "2 saat içinde cevaplandı.",
            answer: "Merhaba, saat 16:00'a kadar verilen siparişleri aynı gün kargoya teslim etmekteyiz. Güzel günler dileriz.",
            status: "ANSWERED",
          }
        ]
      });
    }

    console.log('[Product Seed] Successfully seeded 6 premium products, reviews, and questions!');
  },

  // ─── Super Admin ──────────────────────────────────────────────────
  async getAdminAllProducts() {
    return prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        stock: true,
        views: true,
        sales: true,
        sellerName: true,
        isActive: true,
        createdAt: true,
      }
    });
  },

  // ─── Bulk Operations ──────────────────────────────────────────
  async bulkUpdatePrice(
    productIds: string[],
    operation: 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT' | 'PERCENTAGE_INCREASE' | 'FIXED_INCREASE',
    value: number,
    userId?: string
  ) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, ...(userId ? { userId } : {}) },
    });

    const updates = products.map((p) => {
      let newPrice = p.price;
      const newOriginalPrice = p.originalPrice;

      switch (operation) {
        case 'PERCENTAGE_DISCOUNT':
          newPrice = Math.round(p.price * (1 - value / 100) * 100) / 100;
          break;
        case 'FIXED_DISCOUNT':
          newPrice = Math.max(0, p.price - value);
          break;
        case 'PERCENTAGE_INCREASE':
          newPrice = Math.round(p.price * (1 + value / 100) * 100) / 100;
          break;
        case 'FIXED_INCREASE':
          newPrice = p.price + value;
          break;
      }

      const discountPercent = newOriginalPrice > 0
        ? Math.max(0, Math.round(((newOriginalPrice - newPrice) / newOriginalPrice) * 100))
        : 0;

      return prisma.product.update({
        where: { id: p.id },
        data: { price: newPrice, discountPercent },
      });
    });

    const results = await Promise.all(updates);
    return { updated: results.length };
  },

  async bulkUpdateStatus(productIds: string[], isActive: boolean, userId?: string) {
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds }, ...(userId ? { userId } : {}) },
      data: { isActive },
    });
    return { updated: result.count };
  },

  async bulkUpdateCategory(productIds: string[], categoryName: string, userId?: string) {
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds }, ...(userId ? { userId } : {}) },
      data: { categoryName },
    });
    return { updated: result.count };
  },

  // Toplu stok: sabitle / artır / azalt
  async bulkUpdateStock(
    productIds: string[],
    operation: 'SET' | 'INCREASE' | 'DECREASE',
    value: number,
    userId?: string
  ) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, ...(userId ? { userId } : {}) },
      select: { id: true, stock: true },
    });

    const updates = products.map((p) => {
      let next = p.stock;
      if (operation === 'SET') next = value;
      else if (operation === 'INCREASE') next = p.stock + value;
      else if (operation === 'DECREASE') next = p.stock - value;
      next = Math.max(0, Math.floor(next));
      return prisma.product.update({ where: { id: p.id }, data: { stock: next } });
    });

    const results = await Promise.all(updates);
    return { updated: results.length };
  },

  // Toplu ürün durumu / ilan tipi (Dolap için)
  async bulkUpdateCondition(
    productIds: string[],
    condition?: string,
    listingType?: string,
    userId?: string
  ) {
    const data: Record<string, string> = {};
    if (condition) data.condition = condition;
    if (listingType) data.listingType = listingType;
    if (Object.keys(data).length === 0) return { updated: 0 };

    const result = await prisma.product.updateMany({
      where: { id: { in: productIds }, ...(userId ? { userId } : {}) },
      data,
    });
    return { updated: result.count };
  },

  // Toplu KDV oranı
  async bulkUpdateVat(productIds: string[], vatRate: number, userId?: string) {
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds }, ...(userId ? { userId } : {}) },
      data: { vatRate },
    });
    return { updated: result.count };
  },

  async bulkDelete(productIds: string[], userId?: string) {
    const result = await prisma.product.deleteMany({
      where: { id: { in: productIds }, ...(userId ? { userId } : {}) },
    });
    return { deleted: result.count };
  },
};
