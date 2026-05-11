import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/organisms/Navbar";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  weight: ['400', '500', '600', '700', '900'] 
});

export const metadata = {
  title: "Bidunyam | Türkiye'nin Yeni Pazarı",
  description: "Kaliteli ürünler, uygun fiyatlar. Türkiye'nin en hızlı teslim ağı ile hizmetinizdeyiz.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="bg-slate-50 min-h-screen text-slate-900 font-sans antialiased selection:bg-brand-orange selection:text-white">
        <Navbar />
        <main className="min-h-[calc(100-80px)]">
          {children}
        </main>
      </body>
    </html>
  );
}
