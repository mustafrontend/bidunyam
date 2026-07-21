import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/organisms/Navbar";
import { Footer } from "@/components/organisms/Footer";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  weight: ['400', '500', '600', '700', '900'] 
});

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bidunyam.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "biDünyam — Türkiye'nin Yeni Pazarı | Güvenli Alışveriş",
    template: "%s | biDünyam",
  },
  description:
    "Elektronik, moda, ev & yaşam ve daha fazlası. Binlerce üründe kapıda ödeme, taksit imkânı, hızlı kargo ve 14 gün ücretsiz iade. Türkiye'nin yeni pazarı biDünyam'da.",
  keywords: [
    "biDünyam", "online alışveriş", "pazaryeri", "e-ticaret", "ikinci el",
    "elektronik", "moda", "ev yaşam", "kozmetik", "hızlı kargo", "taksitli alışveriş",
  ],
  applicationName: "biDünyam",
  authors: [{ name: "biDünyam" }],
  creator: "biDünyam",
  publisher: "biDünyam",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: SITE_URL,
    siteName: "biDünyam",
    title: "biDünyam — Türkiye'nin Yeni Pazarı",
    description:
      "Binlerce üründe uygun fiyat, taksit imkânı, hızlı kargo ve kolay iade. Hemen keşfet.",
    images: [{ url: "/logo.jpeg", width: 1200, height: 630, alt: "biDünyam" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "biDünyam — Türkiye'nin Yeni Pazarı",
    description: "Binlerce üründe uygun fiyat, taksit imkânı, hızlı kargo ve kolay iade.",
    images: ["/logo.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "shopping",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="bg-slate-50 min-h-screen text-slate-900 font-sans antialiased selection:bg-brand-orange selection:text-white">
        {/* Arama motorları için kurum + site arama yapısal verisi */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "biDünyam",
                url: SITE_URL,
                logo: `${SITE_URL}/logo.jpeg`,
                description: "Türkiye'nin yeni pazarı. Elektronik, moda, ev & yaşam ve ikinci el ürünler.",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "biDünyam",
                url: SITE_URL,
                potentialAction: {
                  "@type": "SearchAction",
                  target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/arama?search={search_term_string}` },
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
        <Navbar />
        <main className="min-h-[calc(100vh-80px)]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
