import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bidunyam.com";
const API_URL =
  process.env.GATEWAY_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8080" : "http://gateway:8080");

async function fetchProduct(id: string) {
  try {
    const res = await fetch(`${API_URL}/products/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

const CONDITION_TR: Record<string, string> = {
  SIFIR: "Sıfır",
  AZ_KULLANILMIS: "Az Kullanılmış",
  IKINCI_EL: "İkinci El",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await fetchProduct(id);

  if (!p) {
    return { title: "Ürün bulunamadı", robots: { index: false, follow: false } };
  }

  const brand = p.brandName || p.brand?.name || "biDünyam";
  const price = Number(p.price || 0).toLocaleString("tr-TR");
  const title = `${p.name} — ${brand}`;
  const desc =
    p.shortDescription ||
    `${p.name} ${price} TL. ${brand} güvencesiyle hızlı kargo, taksit imkânı ve 14 gün ücretsiz iade.`;
  const url = `${SITE_URL}/product/${id}`;

  return {
    title,
    description: desc.slice(0, 300),
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url,
      siteName: "biDünyam",
      title,
      description: desc.slice(0, 300),
      images: p.imageUrl ? [{ url: p.imageUrl, width: 1200, height: 630, alt: p.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc.slice(0, 200),
      images: p.imageUrl ? [p.imageUrl] : undefined,
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await fetchProduct(id);

  // Google zengin sonuçları için Product yapısal verisi
  const jsonLd = p
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.name,
        image: p.imageUrls?.length ? p.imageUrls : p.imageUrl ? [p.imageUrl] : undefined,
        description: p.shortDescription || p.description?.slice(0, 500),
        sku: p.sku || undefined,
        gtin13: p.barcode || undefined,
        brand: { "@type": "Brand", name: p.brandName || "biDünyam" },
        itemCondition:
          p.condition === "SIFIR" || !p.condition
            ? "https://schema.org/NewCondition"
            : "https://schema.org/UsedCondition",
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/product/${id}`,
          priceCurrency: "TRY",
          price: Number(p.price || 0),
          availability:
            Number(p.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: p.sellerName || "biDünyam" },
        },
        ...(Number(p.reviewCount || 0) > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: Number(p.rating || 0),
                reviewCount: Number(p.reviewCount || 0),
              },
            }
          : {}),
        ...(p.condition && CONDITION_TR[p.condition]
          ? {
              additionalProperty: [
                { "@type": "PropertyValue", name: "Ürün Durumu", value: CONDITION_TR[p.condition] },
              ],
            }
          : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
