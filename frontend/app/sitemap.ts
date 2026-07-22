import type { MetadataRoute } from "next";
import { CATEGORY_TREE } from "@/lib/categories";
import { productPathFrom } from "@/lib/productUrl";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bidunyam.com";
const API_URL =
  process.env.GATEWAY_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8080" : "http://gateway:8080");

// Statik sayfalar + kategoriler + ürünler + bireysel mağazalar
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/dolap`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/arama`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];

  const legalSlugs = [
    "mesafeli-satis-sozlesmesi", "iptal-iade-kosullari", "gizlilik-politikasi",
    "kullanim-kosullari", "teslimat-sartlari", "kvkk", "cerez-politikasi",
    "on-bilgilendirme-formu", "hakkimizda", "iletisim", "sikca-sorulan-sorular",
  ];
  const legalRoutes: MetadataRoute.Sitemap = legalSlugs.map((s) => ({
    url: `${SITE_URL}/sozlesmeler/${s}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  // Kategori ve alt kategori sayfaları
  const categoryRoutes: MetadataRoute.Sitemap = [];
  for (const cat of CATEGORY_TREE) {
    categoryRoutes.push({
      url: `${SITE_URL}/arama?kategori=${encodeURIComponent(cat.name)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (const sub of cat.subCategories) {
      categoryRoutes.push({
        url: `${SITE_URL}/arama?kategori=${encodeURIComponent(cat.name)}&altkategori=${encodeURIComponent(sub)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  // Ürünler (API'den)
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/products?limit=1000`, { next: { revalidate: 3600 } });
    const json = await res.json();
    const products = json?.data?.products || [];
    productRoutes = products.map((p: { id: string; name?: string; updatedAt?: string }) => ({
      // Sitemap yalnızca kanonik (slug'lı) adresleri içerir
      url: `${SITE_URL}${productPathFrom(p.id, p.name)}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // API erişilemezse sitemap yine de statik kısımlarla üretilsin
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...legalRoutes];
}
