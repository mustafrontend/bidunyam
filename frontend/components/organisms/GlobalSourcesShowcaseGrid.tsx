"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Award, Truck, ShieldCheck, Play } from "lucide-react";
import { Product } from "@/components/molecules/ProductCard";

interface GlobalSourcesShowcaseGridProps {
  products?: Product[];
}

export const GlobalSourcesShowcaseGrid: React.FC<GlobalSourcesShowcaseGridProps> = ({ products = [] }) => {
  // Sample card datasets if products array is empty or limited
  const defaultItems = [
    {
      title: "Endüstriyel Alüminyum Parça",
      img: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80",
      hasVideo: true,
      price: "120,00 TL",
    },
    {
      title: "Evcil Hayvan Ayarlanabilir Yelek",
      img: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=300&q=80",
      hasVideo: true,
      price: "185,00 TL",
    },
    {
      title: "Hipotetik Medikal Hijyen Paketi",
      img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80",
      hasVideo: false,
      price: "65,00 TL",
    },
    {
      title: "Kablosuz Şarj Destekli Aksesuar",
      img: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=300&q=80",
      hasVideo: true,
      price: "340,00 TL",
    },
  ];

  const lowMoqItems = [
    {
      title: "Akıllı Takip Modülü & Sensör",
      img: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80",
      price: "45,00 TL",
    },
    {
      title: "Özel Dokuma Püsküllü Yelek",
      img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80",
      price: "290,00 TL",
    },
    {
      title: "Sanayi Tipi Güç Adaptörü",
      img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80",
      price: "510,00 TL",
    },
    {
      title: "Min. 1 Adet Siparişli Kulaklık",
      img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80",
      price: "199,00 TL",
    },
  ];

  const oemItems = [
    {
      title: "Şık Topuklu Ayakkabı & Aksesuar",
      img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=300&q=80",
      price: "420,00 TL",
    },
    {
      title: "Orijinal Üretici Hediye Kutusu",
      img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=300&q=80",
      price: "75,00 TL",
    },
    {
      title: "Toptan Ahşap Elbise Askısı",
      img: "https://images.unsplash.com/photo-1520006403909-838d6b92c22e?auto=format&fit=crop&w=300&q=80",
      price: "15,00 TL",
    },
    {
      title: "Özel Tasarım Deri Çanta",
      img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=300&q=80",
      price: "680,00 TL",
    },
  ];

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 1. Card: Editörün Seçimi (Analyst's Choice) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 font-black text-lg text-slate-900 tracking-tight">
                <Award size={18} className="text-[#ff5000]" />
                <span>Editörün Seçimi</span>
              </div>
              <Link href="/arama?onayli=true" className="text-xs font-bold text-slate-400 hover:text-[#ff5000] flex items-center gap-0.5">
                Tümünü Gör <ChevronRight size={14} />
              </Link>
            </div>
            <p className="text-xs text-slate-400 font-medium mb-4">
              Uzmanlarımız tarafından seçilmiş B2B ve perakende ürün seçkileri
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
            {defaultItems.slice(0, 3).map((item, idx) => (
              <Link
                key={idx}
                href="/arama?onayli=true"
                className="group relative flex flex-col items-center bg-slate-50 rounded-xl p-2 border border-slate-100 hover:border-[#ff5000]/30 transition-all duration-200"
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-1.5 bg-white">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.hasVideo && (
                    <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs">
                      <Play size={10} className="fill-white translate-x-0.2" />
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-bold text-slate-800 tracking-tight line-clamp-1 w-full text-center group-hover:text-[#ff5000]">
                  {item.price}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 2. Card: Düşük Min. Sipariş (Low MOQ) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 font-black text-lg text-slate-900 tracking-tight">
                <Truck size={18} className="text-[#ff5000]" />
                <span>Hızlı & Kolay Teslimat</span>
              </div>
              <Link href="/arama?hizli=true" className="text-xs font-bold text-slate-400 hover:text-[#ff5000] flex items-center gap-0.5">
                Tümünü Gör <ChevronRight size={14} />
              </Link>
            </div>
            <p className="text-xs text-slate-400 font-medium mb-4">
              Doğrulanmış tedarikçilerden uygun minimum siparişli stoklu ürünler
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
            {lowMoqItems.slice(0, 3).map((item, idx) => (
              <Link
                key={idx}
                href="/arama?hizli=true"
                className="group relative flex flex-col items-center bg-slate-50 rounded-xl p-2 border border-slate-100 hover:border-[#ff5000]/30 transition-all duration-200"
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-1.5 bg-white">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-800 tracking-tight line-clamp-1 w-full text-center group-hover:text-[#ff5000]">
                  {item.price}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Card: Orijinal Markalar (OEM Products) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 font-black text-lg text-slate-900 tracking-tight">
                <ShieldCheck size={18} className="text-[#ff5000]" />
                <span>Orijinal & Sertifikalı</span>
              </div>
              <Link href="/arama?onayli=true" className="text-xs font-bold text-slate-400 hover:text-[#ff5000] flex items-center gap-0.5">
                Tümünü Gör <ChevronRight size={14} />
              </Link>
            </div>
            <p className="text-xs text-slate-400 font-medium mb-4">
              Güvenilir üreticiler ve binlerce popüler orijinal parça & ürünler
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
            {oemItems.slice(0, 3).map((item, idx) => (
              <Link
                key={idx}
                href="/arama?onayli=true"
                className="group relative flex flex-col items-center bg-slate-50 rounded-xl p-2 border border-slate-100 hover:border-[#ff5000]/30 transition-all duration-200"
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-1.5 bg-white">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-800 tracking-tight line-clamp-1 w-full text-center group-hover:text-[#ff5000]">
                  {item.price}
                </span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
