"use client";

import { Timer, Star, Sparkles, Plus, Percent, Briefcase, ShieldCheck, Cpu } from "lucide-react";

const CAMPAIGN_BADGES = [
  { label: "Bugün Fiyatı Düşenler", color: "bg-purple-100", icon: <Timer className="text-purple-500" size={22} /> },
  { label: "Web Sitesi Açıldı", color: "bg-orange-100", icon: <Sparkles className="text-orange-500" size={22} /> },
  { label: "trendyol plus", color: "bg-pink-100", icon: <Star className="text-pink-500" size={22} /> },
  { label: "Kampanya Detayları", color: "bg-yellow-100", icon: <Percent className="text-yellow-500" size={22} /> },
  { label: "Sen De Al!", color: "bg-blue-100", icon: <Plus className="text-blue-500" size={22} /> },
  { label: "Avantajlı Ürünler", color: "bg-green-100", icon: <Briefcase className="text-green-500" size={22} /> },
  { label: "İndirim Kuponlarım", color: "bg-red-100", icon: <ShieldCheck className="text-red-500" size={22} /> },
  { label: "Krediler", color: "bg-slate-100", icon: <Cpu className="text-slate-500" size={22} /> },
];

export function CampaignBadges() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
      {CAMPAIGN_BADGES.map((b, i) => (
        <div
          key={i}
          className={`flex flex-col items-center min-w-[90px] px-2 py-1 rounded-2xl ${b.color} shadow-sm cursor-pointer active:scale-95 transition-transform`}
        >
          {b.icon}
          <span className="text-[11px] font-black text-slate-700 text-center mt-1 whitespace-nowrap">
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}
