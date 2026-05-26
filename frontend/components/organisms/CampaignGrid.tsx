"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api";
import type { Campaign } from "./CampaignCarousel";

const EMPTY_PLACEHOLDERS = [
  { id: "empty-1", gradient: "from-slate-100 to-slate-200", icon: "✨", text: "Yeni Kampanya Çok Yakında" },
  { id: "empty-2", gradient: "from-gray-50 to-gray-200", icon: "🚀", text: "Sürpriz Fırsatlar Yolda" },
  { id: "empty-3", gradient: "from-zinc-100 to-zinc-200", icon: "🎁", text: "Harika İndirimler Hazırlanıyor" },
];

interface CampaignGridProps {
  startIndex?: number;
  count?: number;
}

export const CampaignGrid: React.FC<CampaignGridProps> = ({ startIndex = 0, count = 3 }) => {
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await apiClient.get("/products/campaigns/active");
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setAllCampaigns(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load active campaigns", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-[180px]">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white border border-slate-100 animate-pulse flex items-center justify-center">
            <Sparkles className="text-slate-200" size={24} />
          </div>
        ))}
      </div>
    );
  }

  // Slice campaigns for this specific grid instance
  const campaigns = allCampaigns.slice(startIndex, startIndex + count);

  // Calculate how many slots to show (minimum 3, and always a multiple of 3)
  const gridColumns = 3;
  // If we have items in this slice, we show exactly `count` slots (or multiple of 3)
  const totalSlots = Math.max(3, Math.ceil(campaigns.length / gridColumns) * gridColumns);
  const emptySlotsCount = totalSlots - campaigns.length;
  
  const displayItems = [
    ...campaigns,
    ...Array.from({ length: emptySlotsCount }).map((_, i) => EMPTY_PLACEHOLDERS[i % EMPTY_PLACEHOLDERS.length])
  ];
  
  const getDbImageUrl = (img: string | null) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `/api/products${img}`;
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {displayItems.map((item: any, idx) => {
        const isDb = "discountType" in item;
        const dbCamp = isDb ? (item as Campaign) : null;
        const emptyCamp = !isDb ? item : null;

        const imageUrl = dbCamp ? getDbImageUrl(dbCamp.imageUrl) : null;
        const title = dbCamp ? dbCamp.title : "";
        const description = dbCamp ? dbCamp.description : "";
        
        return (
          <motion.div
            key={dbCamp ? dbCamp.id : `${emptyCamp.id}-${idx}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            className={`group relative h-[180px] rounded-2xl overflow-hidden shadow-sm border border-slate-200/50 transition-all ${isDb ? "cursor-pointer hover:shadow-md" : ""}`}
          >
            {isDb ? (
              <>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title || "Kampanya"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800" />
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent p-5 flex flex-col justify-center text-white pointer-events-none">
                  <h3 className="text-lg md:text-xl font-black uppercase tracking-tight leading-tight max-w-[70%]">
                    {title}
                  </h3>
                  {description && (
                    <p className="text-xs font-bold text-white/90 mt-2 max-w-[65%] line-clamp-2">
                      {description}
                    </p>
                  )}
                  {dbCamp && (
                    <div className="mt-3 inline-flex bg-[#ff5000] text-white text-[10px] font-black px-2.5 py-1 rounded w-fit shadow-sm">
                      {dbCamp.discountType === "PERCENTAGE" ? `%${dbCamp.discountValue} İNDİRİM` : `${dbCamp.discountValue} TL İNDİRİM`}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${emptyCamp.gradient} flex flex-col items-center justify-center p-4 text-center opacity-70`}>
                <span className="text-4xl mb-2">{emptyCamp.icon}</span>
                <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">{emptyCamp.text}</p>
              </div>
            )}
          </motion.div>
        );
      })}
    </section>
  );
};
