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
            <Link href="#" className="hover:text-slate-900 transition-colors">Hakkımızda</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Bizimle Çalışın (Kariyer)</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">İletişim & Destek</Link>
            <div className="w-full border-t border-slate-100/70 my-1" />
            {/* İstediğiniz Yönetici Girişi Buraya Eklendi */}
            <Link href="/yonetim" className="text-slate-800 hover:text-[#ff5000] font-semibold flex items-center gap-1 transition-colors group">
              <span>Yönetici Girişi</span>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded group-hover:bg-[#ff5000]/10 group-hover:text-[#ff5000] transition-colors">Panel</span>
            </Link>
          </div>
        </div>

        {/* Kolon 2: Yasal Sözleşmeler (E-ticaret İçin Şart Olanlar) */}
        <div className="flex flex-col gap-3.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Sözleşmeler & Yasal</h3>
          <div className="flex flex-col gap-2.5 text-xs font-medium text-slate-500">
            <Link href="#" className="hover:text-slate-900 transition-colors">Gizlilik Politikası</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Kullanım Koşulları</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">KVKK Aydınlatma Metni</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Çerez (Cookie) Politikası</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Mesafeli Satış Sözleşmesi</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Ön Bilgilendirme Formu</Link>
          </div>
        </div>

        {/* Kolon 3: Müşteri Deneyimi */}
        <div className="flex flex-col gap-3.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Müşteri İlişkileri</h3>
          <div className="flex flex-col gap-2.5 text-xs font-medium text-slate-500">
            <Link href="#" className="hover:text-slate-900 transition-colors">Sıkça Sorulan Sorular</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Güvenlik Merkezi</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">İptal & İade Şartları</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Kargo ve Teslimat Süreçleri</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Site Haritası</Link>
          </div>
        </div>

        {/* Kolon 4: Popüler Kategoriler (SEO Açısından Faydalı) */}
        <div className="flex flex-col gap-3.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Popüler Reyonlar</h3>
          <div className="flex flex-col gap-2.5 text-xs font-medium text-slate-500">
            <Link href="#" className="hover:text-slate-900 transition-colors">Flaş Fırsat Ürünleri</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Trend Giyim Kombinleri</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Akıllı Telefon & Elektronik</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Ev & Dekorasyon Tasarımları</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Kozmetik & Kişisel Bakım</Link>
          </div>
        </div>

      </div>

      {/* 3. Telif Hakları & Arka Plan Dev Logo Alanı (Brand Footprint) */}
      <div className="w-full max-w-full px-4 sm:px-6 md:px-10 xl:px-14 mx-auto pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
        <p className="text-xs font-medium text-slate-400 opacity-80 text-center sm:text-left leading-relaxed">
          © {new Date().getFullYear()} biDunyam Marketplace. Tüm hakları saklıdır.
        </p>

        {/* Güven Veren Ödeme Çözümleri Maskot Alanı */}
        <div className="flex items-center gap-2 opacity-40 grayscale hover:opacity-70 hover:grayscale-0 transition-all duration-300">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider mr-1 uppercase">Güvenli Ödeme:</span>
          <div className="px-2 py-1 bg-slate-50 text-[10px] font-bold text-slate-600 rounded border border-slate-200">troy</div>
          <div className="px-2 py-1 bg-slate-50 text-[10px] font-bold text-slate-600 rounded border border-slate-200">visa</div>
          <div className="px-2 py-1 bg-slate-50 text-[10px] font-bold text-slate-600 rounded border border-slate-200">mastercard</div>
        </div>
      </div>
      
      {/* Dev Estetik Alt Marka Damgası */}
      <div className="w-full text-center text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 opacity-[0.03] select-none font-sans tracking-[0.3em] mt-10 md:mt-14">
        BİDÜNYAM
      </div>
    </footer>
  );
};