import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bidunyam.com";
const API_URL =
  process.env.GATEWAY_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8080" : "http://gateway:8080");

async function fetchStore(slug: string) {
  try {
    const res = await fetch(`${API_URL}/auth/seller/store/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

// Link paylaşıldığında mağazanın kendi kimliğiyle zengin önizleme çıkar
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const store = await fetchStore(slug);

  if (!store) {
    return { title: "Mağaza bulunamadı", robots: { index: false, follow: false } };
  }

  const name = store.storeName || store.fullName || store.companyName || "Mağaza";
  const desc = store.storeBio || `${name} — biDünyam güvencesiyle ürünleri keşfedin.`;
  const url = `${SITE_URL}/magaza/${slug}`;
  const image = store.storeBanner || store.storeLogo || "/logo.jpeg";

  return {
    title: name,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      locale: "tr_TR",
      url,
      siteName: name,          // Marketplace değil, satıcının kendi adı öne çıkar
      title: name,
      description: desc,
      images: [{ url: image, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description: desc,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await fetchStore(slug);
  const name = store?.storeName || store?.fullName || store?.companyName || "Mağaza";

  // Arama motorları için mağaza yapısal verisi
  const jsonLd = store
    ? {
        "@context": "https://schema.org",
        "@type": "Store",
        name,
        description: store.storeBio || undefined,
        url: `${SITE_URL}/magaza/${slug}`,
        image: store.storeLogo || undefined,
        parentOrganization: { "@type": "Organization", name: "biDünyam", url: SITE_URL },
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
