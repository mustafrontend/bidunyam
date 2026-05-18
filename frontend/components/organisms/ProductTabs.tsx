"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface ProductTabsProps {
  description: string;
  bulletPoints?: string[];
}

const TABS = [
  { id: "details", label: "Ürün Detayları" },
  { id: "specs", label: "Teknik Özellikler" },
  { id: "shipping", label: "Kargo ve İade" },
];

export const ProductTabs: React.FC<ProductTabsProps> = ({ description, bulletPoints = [] }) => {
  const [activeTab, setActiveTab] = useState("details");

  // Fallback specs matching the Visco Seat Cushion HTML
  const fallbackBullets = [
    "Malzeme: Vücut şeklinize mükemmel uyum sağlayan yüksek yoğunluklu medikal sınıf Visko hafızalı sünger.",
    "Boyutlar: 45cm x 35cm x 7cm — Çoğu ofis sandalyesi ve araba koltuğuna mükemmel uyum sağlar.",
    "Kaymaz Taban: Dayanıklı kauçuk taban, deri veya kumaş yüzeylerde kaymayı tamamen engeller.",
    "Nefes Alabilir Kılıf: Maksimum hava sirkülasyonu sağlayan çıkarılabilir ve makinede yıkanabilir 3D mesh kılıf."
  ];

  const specsList = bulletPoints.length > 0 ? bulletPoints : fallbackBullets;

  return (
    <div className="space-y-6 select-none">
      {/* Tabs Header Row */}
      <div className="border-b border-slate-200 flex gap-8">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-black transition-all duration-150 cursor-pointer ${
                isActive
                  ? "border-b-2 border-[#ff5000] text-[#ff5000]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tabs Contents */}
      <div className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">
        {activeTab === "details" && (
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Mükemmel Ergonomik Destek</h4>
            <p>{description || "Premium Visko Ortopedik Minderimizle destek ve konforun mükemmel dengesini yaşayın. Kuyruk sokumu basıncını azaltmak ve uzun oturma seanslarında sağlıklı duruşu desteklemek için özel olarak tasarlanmıştır."}</p>
            <ul className="space-y-3 mt-4">
              {specsList.map((point, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <CheckCircle2 size={16} className="text-[#ff5000] mt-0.5 shrink-0" strokeWidth={2.5} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "specs" && (
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Teknik Özellikler</h4>
            <ul className="space-y-3">
              {specsList.map((point, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <CheckCircle2 size={16} className="text-[#ff5000] mt-0.5 shrink-0" strokeWidth={2.5} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "shipping" && (
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Teslimat & İade Politikaları</h4>
            <p>Siparişleriniz en geç 24 saat içerisinde özenle hazırlanarak kargoya teslim edilmektedir.</p>
            <p>30 gün boyunca kullanılmamış ve hasar görmemiş tüm ürünlerimizi koşulsuz şartsız ücretsiz iade edebilirsiniz.</p>
          </div>
        )}
      </div>
    </div>
  );
};
