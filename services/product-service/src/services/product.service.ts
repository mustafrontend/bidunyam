import { ProductRepository, ProductFilters } from '../repositories/product.repository';
import { indexProduct } from '../repositories/elasticsearch.client';

const SEED_PRODUCTS = [
  {
    name: 'iPhone 15 Pro Max 256GB Natural Titanium',
    description: 'Apple A17 Pro çip, titanium tasarım, 48MP kamera sistemi ile profesyonel fotoğrafçılık.',
    price: 52999,
    originalPrice: 59999,
    discountPercent: 12,
    category: 'Elektronik',
    brand: 'Apple',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
    stock: 45,
    rating: 4.8,
    reviewCount: 1243,
  },
  {
    name: 'Samsung Galaxy S24 Ultra 512GB Titanium Black',
    description: 'Galaxy AI destekli, S Pen dahil, 200MP kamera ile sınırları zorlayan akıllı telefon.',
    price: 47999,
    originalPrice: 52999,
    discountPercent: 9,
    category: 'Elektronik',
    brand: 'Samsung',
    imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800',
    stock: 32,
    rating: 4.7,
    reviewCount: 987,
  },
  {
    name: 'MacBook Pro 14" M3 Pro 18GB RAM',
    description: 'M3 Pro çip, ProMotion ekran, 18 saat pil ömrü ile profesyonel kullanıcılar için.',
    price: 89999,
    originalPrice: 99999,
    discountPercent: 10,
    category: 'Bilgisayar',
    brand: 'Apple',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
    stock: 18,
    rating: 4.9,
    reviewCount: 562,
  },
  {
    name: 'Sony WH-1000XM5 Noise Cancelling Kulaklık',
    description: 'Endüstri lideri gürültü engelleme, 30 saat pil, premium ses kalitesi.',
    price: 8999,
    originalPrice: 11999,
    discountPercent: 25,
    category: 'Ses Sistemleri',
    brand: 'Sony',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    stock: 67,
    rating: 4.6,
    reviewCount: 2341,
  },
  {
    name: 'Nike Air Jordan 1 Retro High OG',
    description: 'İkonik basketbol ayakkabısı, premium deri üst, Air-Sole yastıklama teknolojisi.',
    price: 4299,
    originalPrice: 5499,
    discountPercent: 22,
    category: 'Ayakkabı',
    brand: 'Nike',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    stock: 23,
    rating: 4.5,
    reviewCount: 445,
  },
  {
    name: 'Dyson V15 Detect Absolute',
    description: 'Lazer toz tespiti, HEPA filtrasyonu, 60 dakika pil ömrüyle güçlü temizlik.',
    price: 19999,
    originalPrice: 24999,
    discountPercent: 20,
    category: 'Ev Aletleri',
    brand: 'Dyson',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    stock: 12,
    rating: 4.7,
    reviewCount: 328,
  },
  {
    name: 'LG OLED evo C3 65" 4K Smart TV',
    description: 'α9 AI İşlemci 4K Gen6, Dolby Vision IQ, webOS 23 akıllı TV platformu.',
    price: 34999,
    originalPrice: 44999,
    discountPercent: 22,
    category: 'Televizyon',
    brand: 'LG',
    imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800',
    stock: 8,
    rating: 4.8,
    reviewCount: 789,
  },
  {
    name: 'Adidas Ultraboost 23 Koşu Ayakkabısı',
    description: 'Continental™ lastik taban, BOOST ara taban, yüksek enerji geri dönüşümü.',
    price: 3499,
    originalPrice: 4299,
    discountPercent: 19,
    category: 'Ayakkabı',
    brand: 'Adidas',
    imageUrl: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
    stock: 54,
    rating: 4.4,
    reviewCount: 1876,
  },
];

export const ProductService = {
  async getProducts(filters: ProductFilters, page: number, limit: number) {
    const { products, total } = await ProductRepository.findAll(filters, { page, limit });

    return {
      products,
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
    return product;
  },

  async seedIfEmpty(): Promise<void> {
    const { total } = await ProductRepository.findAll({}, { page: 1, limit: 1 });
    if (total === 0) {
      await ProductRepository.seed(SEED_PRODUCTS);
      console.log(`[Product] ✅ Seeded ${SEED_PRODUCTS.length} demo products`);
    }

    // 🚀 Sync all products to Elasticsearch on startup (with a small delay for ES to be ready)
    setTimeout(async () => {
      try {
        console.log('[Product] 🔄 Starting Elasticsearch sync...');
        const { products } = await ProductRepository.findAll({}, { page: 1, limit: 1000 });
        for (const product of products) {
          await indexProduct(product);
        }
        console.log('[Product] ✅ Elasticsearch sync completed.');
      } catch (err) {
        console.error('[Product] ❌ Elasticsearch sync failed:', err);
      }
    }, 15000); // 15 saniye bekle
  },
};
