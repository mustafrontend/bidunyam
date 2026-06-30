"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, CreditCard, Truck, RefreshCw } from "lucide-react";

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // Yönetim ve Admin sayfalarında storefront footer'ını göstermiyoruz
  if (pathname?.startsWith("/yonetim") || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="w-full bg-white border-t border-slate-100 select-none mt-20 pt-16 pb-24 md:pb-12">
      {/* 1. Hızlı Güven & Değer Ögeleri (Trust Badges) */}
      <div className="w-full max-w-full px-4 sm:px-6 md:px-10 xl:px-14 mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-slate-100/80">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-100">
            <ShieldCheck size={18} strokeWidth={2} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Güvenli Alışveriş</h4>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">256-Bit SSL Koruma Altyapısı</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-100">
            <Truck size={18} strokeWidth={2} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Hızlı Teslimat</h4>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Aynı Gün Kargo Avantajı</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-100">
            <RefreshCw size={18} strokeWidth={2} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Kolay İade</h4>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">14 Gün İçinde Koşulsuz İade</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl border border-slate-100">
            <CreditCard size={18} strokeWidth={2} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Ödeme Çeşitliliği</h4>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Kartla veya Taksit Seçenekleriyle</p>
          </div>
        </div>
      </div>

      {/* 2. Çok Kolonlu Bilgi Navigasyonu (Multi-Column Architecture) */}
      <div className="w-full max-w-full px-4 sm:px-6 md:px-10 xl:px-14 mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 py-14 text-slate-600">
        
        {/* Kolon 1: Kurumsal */}
        <div className="flex flex-col gap-3.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Kurumsal</h3>
          <div className="flex flex-col gap-2.5 text-xs font-medium text-slate-500">
            <Link href="/sozlesmeler/hakkimizda" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">Hakkımızda</Link>
            <Link href="/sozlesmeler/kariyer" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">Bizimle Çalışın (Kariyer)</Link>
            <Link href="/sozlesmeler/iletisim" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">İletişim &amp; Destek</Link>
            <div className="w-full border-t border-slate-100/70 my-1" />
            <Link href="/yonetim" className="text-slate-800 hover:text-[#ff5000] font-semibold flex items-center gap-1 transition-colors group">
              <span>Yönetici Girişi</span>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded group-hover:bg-[#ff5000]/10 group-hover:text-[#ff5000] transition-colors">Panel</span>
            </Link>
          </div>
        </div>

        {/* Kolon 2: Yasal Sözleşmeler (E-ticaret İçin Şart Olanlar) */}
        <div className="flex flex-col gap-3.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Sözleşmeler &amp; Yasal</h3>
          <div className="flex flex-col gap-2.5 text-xs font-medium text-slate-500">
            <Link href="/sozlesmeler/gizlilik-politikasi" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">Gizlilik Politikası</Link>
            <Link href="/sozlesmeler/kullanim-kosullari" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">Kullanım Koşulları</Link>
            <Link href="/sozlesmeler/kvkk" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">KVKK Aydınlatma Metni</Link>
            <Link href="/sozlesmeler/cerez-politikasi" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">Çerez (Cookie) Politikası</Link>
            <Link href="/sozlesmeler/mesafeli-satis-sozlesmesi" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">Mesafeli Satış Sözleşmesi</Link>
            <Link href="/sozlesmeler/on-bilgilendirme-formu" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">Ön Bilgilendirme Formu</Link>
          </div>
        </div>

        {/* Kolon 3: Müşteri Deneyimi */}
        <div className="flex flex-col gap-3.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Müşteri İlişkileri</h3>
          <div className="flex flex-col gap-2.5 text-xs font-medium text-slate-500">
            <Link href="/sozlesmeler/sikca-sorulan-sorular" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">Sıkça Sorulan Sorular</Link>
            <Link href="/sozlesmeler/guvenlik-merkezi" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">Güvenlik Merkezi</Link>
            <Link href="/sozlesmeler/iptal-iade-kosullari" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">İptal &amp; İade Şartları</Link>
            <Link href="/sozlesmeler/teslimat-sartlari" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">Kargo ve Teslimat Süreçleri</Link>
            <Link href="/sozlesmeler/site-haritasi" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">Site Haritası</Link>
          </div>
        </div>

        {/* Kolon 4: İletişim ve Firma Bilgileri */}
        <div className="flex flex-col gap-3.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">İletişim & Firma</h3>
          <div className="flex flex-col gap-2.5 text-xs font-medium text-slate-500 leading-relaxed">
            <p className="font-semibold text-slate-700">ART RUE</p>
            <p><strong>Vergi Dairesi:</strong> BAKIRKÖY</p>
            <p><strong>Vergi No:</strong> 4910110358</p>
            <p className="mt-1 border-t border-slate-100 pt-2">
              Yeşilköy Mah. Atatürk Cad.<br/>Egs Business Park B2 Blok<br/>Bakırköy, İstanbul / Türkiye
            </p>
          </div>
        </div>

      </div>

      {/* 3. Telif Hakları & Arka Plan Dev Logo Alanı (Brand Footprint) */}
      <div className="w-full max-w-full px-4 sm:px-6 md:px-10 xl:px-14 mx-auto pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
        <p className="text-xs font-medium text-slate-400 opacity-80 text-center sm:text-left leading-relaxed">
          © {new Date().getFullYear()} ART RUE kuruluşudur. Tüm hakları saklıdır.
        </p>

        {/* Güven Veren Ödeme Çözümleri Maskot Alanı */}
        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-all duration-300">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider mr-1 uppercase">Güvenli Ödeme:</span>
          {/* TROY Badge */}
          <div className="h-5 flex items-center justify-center px-2 bg-[#00a1cb] rounded-sm shadow-sm grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
            <span className="text-[11px] font-black text-white tracking-tighter italic">troy</span>
          </div>
          {/* VISA Badge */}
          <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzOCAxMiI+PHBhdGggZD0iTTE0LjYxMyAxMS42NjZMMTYuOTI0LjM2NGgyLjQ2NEwxNy4wNzYgMTEuNjY2aC0yLjQ2M3ptMTMuMTExLTExLjNjLTEuMTI3LS4zLTIuMzE2LS40OC0zLjUyOC0uNDgtMy44NyAwLTYuNTk4IDItNi42MjEgNC44NjgtLjAyNCAyLjEyNiAxLjk1IDMuMzE1IDMuNDI1IDQuMDI1IDEuNTEuNzIyIDIuMDE1IDEuMTg5IDIuMDEwIDEuODM0LS4wMDcuOTg2LTEuMjE4IDEuNDMzLTIuMzQ1IDEuNDMzLTEuNTYgMC0yLjM5OC0uMjQtMy42NjYtLjhsLS41MTMtLjIzOC0uMzQ0IDIuMDcyYy45MDkuNDEgMi41ODMuNzYzIDQuMzE2Ljc4MiA0LjEwMyAwIDYuNzktMS45NyA2LjgxOS01LjAyNS4wMTMtMS42ODgtLjk5LTIuOTU1LTMuMjY3LTQuMDA0LTEuMzUzLS42NjgtMi4xODQtMS4xMTEtMi4xODAtMS43ODUuMDA0LS42My43Mi0xLjMwNiAyLjIyLTEuMzA2IDEuMjU4LS4wMiAyLjE5LjI2MyAyLjk0Ni41OTRsLjM1NC4xNi40MjUtMi4xM3ptNi42NTcgOC4zNThjLjI1Ny0yLjYxNiAyLjQ3LTUuMDQyIDQuNTQyLTYuMTk2LS40NDQtMi4xNDgtMi40MDQtMy43OS00LjcwNC0zLjkyMS0yLjAwMy0uMTEyLTMuOTA1IDEuMjIyLTQuOTMxIDEuMjIyLTEuMDEwIDAtMi41OC0xLjE5Ni00LjI0LTEuMTYzLTIuMTMuMDMzLTQuMDk1IDEuMjA2LTUuMTg1IDMuMDM3LTIuMjIgMy43MzEtLjU2OCA5LjI1IDEuNTk3IDEyLjI4IDEuMDU0IDEuNDgxIDIuMzAyIDMuMTY3IDMuOTE2IDMuMSAxLjU1NC0uMDcgMi4xNDQtMS4wMTEgNC4wMjEtMS4wMTEgMS44NjcgMCAyLjQwNSAxLjAxMSA0LjAzMi45NzcgMS42NjYtLjAzMiAyLjc0OC0xLjUzNiAzLjc5My0zLjAwNiAxLjIwOC0xLjcwNSAxLjcwNC0zLjM2IDEuNzMzLTMuNDQ3LS4wMzctLjAxNS0zLjMyNy0xLjIzOC0zLjU4NS0zLjg3ek0yOC4wMjYuNDRjLS42MyAyLjkyLTMuMTMgNS40OC01Ljc0OCA1Ljc1LS4xMjUuMDEyLS4yNS4wMTgtLjM3Mi4wMTgtLjQ2NSAwLS45MTYtLjEtMS4zMzItLjI3Ni41NC0zLjAyIDMuMTc1LTUuNTQ1IDUuOTIyLTUuNzYuMDgyLS4wMDYuMTY0LS4wMS4yNDYtLjAxLjQ0MiAwIC44NjYuMDg4IDEuMjYyLjI0N0wyOC4wMjYuNDR6TTYuOTI0IDExLjY2NmgzLjkxNGw2LjEwMy0xMS4zSDEzLjIzTDkuNjEgOC41MjggNy45NzMuMzY0SDMuMDE4bC0uMDQzLjE5NWMtLjcxNCAzLjQyLTMuMzUgOC4xNjctNS45MTggMTAuMzdMLjY3OCAxMS4yM2wzLjY5Mi0uMDAyTDYuOTI0IDExLjY2NnoiIGZpbGw9IiMxNDM0Q0IiLz48L3N2Zz4=" alt="Visa" className="h-4 object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all cursor-default" />
          {/* MASTERCARD Badge */}
          <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAxNSI+PGNpcmNsZSBjeD0iNy41IiBjeT0iNy41IiByPSI3LjUiIGZpbGw9IiNlYjAwMWIiLz48Y2lyY2xlIGN4PSIxNi41IiBjeT0iNy41IiByPSI3LjUiIGZpbGw9IiNmNzkzMWUiLz48cGF0aCBkPSJNMTIgMTEuOTdBNy40NiA3LjQ2IDAgMCAwIDE0LjM0IDcuNSA3LjQ2IDcuNDYgMCAwIDAgMTIgMy4wM2E3LjQ2IDcuNDYgMCAwIDAgLTIuMzQgNC40N0E3LjQ2IDcuNDYgMCAwIDAgMTIgMTEuOTd6IiBmaWxsPSIjZmY1YjAwIi8+PC9zdmc+" alt="Mastercard" className="h-5 object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all cursor-default" />
        </div>
      </div>
      
      {/* Dev Estetik Alt Marka Damgası */}
      <div className="w-full text-center text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 opacity-[0.03] select-none font-sans tracking-[0.3em] mt-10 md:mt-14">
        BİDÜNYAM
      </div>
    </footer>
  );
};