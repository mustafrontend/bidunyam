"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface ProductTabsProps {
  productName?: string;
  description: string;
  bulletPoints?: string[];
  /** Kategoriye özel özellikler (Renk, Beden, Materyal ...) — ürüne özgü */
  categoryAttributes?: Record<string, string>;
  brand?: string;
  condition?: string;
  preparationDays?: number;
}

const TABS = [
  { id: "details", label: "Ürün Detayları" },
  { id: "specs", label: "Teknik Özellikler" },
  { id: "shipping", label: "Kargo ve İade" },
];

const CONDITION_TR: Record<string, string> = {
  SIFIR: "Sıfır",
  AZ_KULLANILMIS: "Az Kullanılmış",
  IKINCI_EL: "İkinci El",
};

export const ProductTabs: React.FC<ProductTabsProps> = ({
  productName,
  description,
  bulletPoints = [],
  categoryAttributes = {},
  brand,
  condition,
  preparationDays,
}) => {
  const [activeTab, setActiveTab] = useState("details");

  // Teknik özellikler tablosu: yalnızca gerçek, ürüne özgü değerler
  const specRows: Array<[string, string]> = [];
  if (brand) specRows.push(["Marka", brand]);
  if (condition && CONDITION_TR[condition]) specRows.push(["Ürün Durumu", CONDITION_TR[condition]]);
  for (const [key, value] of Object.entries(categoryAttributes)) {
    if (key && value && String(value).trim()) specRows.push([key, String(value)]);
  }

  return (
    <div className="space-y-6 select-none">
      {/* Sekme başlıkları */}
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

      {/* Sekme içerikleri — hepsi ürüne özgü gerçek veri */}
      <div className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
        {/* ── Ürün Detayları ── */}
        {activeTab === "details" && (
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              {productName || "Ürün Açıklaması"}
            </h4>
            {description ? (
              <p className="whitespace-pre-line">{description}</p>
            ) : (
              <p className="text-slate-400">Bu ürün için henüz açıklama girilmemiş.</p>
            )}
            {bulletPoints.length > 0 && (
              <ul className="space-y-3 mt-4">
                {bulletPoints.map((point, idx) => (
                  <li key={idx} className="flex gap-3 items-start">
                    <CheckCircle2 size={16} className="text-[#ff5000] mt-0.5 shrink-0" strokeWidth={2.5} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Teknik Özellikler ── */}
        {activeTab === "specs" && (
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Teknik Özellikler</h4>
            {specRows.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-100">
                    {specRows.map(([key, value]) => (
                      <tr key={key} className="even:bg-slate-50/60">
                        <td className="w-1/3 px-4 py-2.5 text-xs font-bold text-slate-500">{key}</td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400">Bu ürün için teknik özellik girilmemiş.</p>
            )}
          </div>
        )}

        {/* ── Kargo ve İade ── (platform politikası; tüm ürünler için geçerli) */}
        {activeTab === "shipping" && (
          <div className="space-y-3">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Teslimat & İade</h4>
            <ul className="space-y-2.5">
              {[
                typeof preparationDays === "number" && preparationDays > 0
                  ? `Siparişiniz ${preparationDays} iş günü içinde hazırlanıp anlaşmalı kargoya teslim edilir.`
                  : "Siparişiniz en geç 24 saat içinde hazırlanıp anlaşmalı kargoya teslim edilir.",
                "Kargo takip numarası, gönderi oluşturulduğunda hesabınıza iletilir.",
                "Teslim tarihinden itibaren 14 gün içinde gerekçe göstermeksizin ücretsiz iade hakkınız vardır.",
                "İade edilen ürün kullanılmamış ve orijinal ambalajında olmalıdır.",
              ].map((line, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <CheckCircle2 size={16} className="text-[#ff5000] mt-0.5 shrink-0" strokeWidth={2.5} />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
