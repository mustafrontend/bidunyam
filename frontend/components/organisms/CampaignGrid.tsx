"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Gift, Percent } from "lucide-react";
import { apiClient } from "@/lib/api";
import type { Campaign } from "./CampaignCarousel";

const EMPTY_PLACEHOLDERS = [
  { id: "empty-1", icon: <Sparkles size={20} className="text-amber-500" />, text: "Yeni Kampanya", subtext: "Çok Yakında Sizinle" },
  { id: "empty-2", icon: <Gift size={20} className="text-indigo-500" />, text: "Sürpriz Fırsatlar", subtext: "Hazırlıklar Devam Ediyor" },
  { id: "empty-3", icon: <Percent size={20} className="text-rose-500" />, text: "Büyük İndirimler", subtext: "Yolda, Takipte Kalın" },
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative h-[190px] rounded-2xl bg-slate-50 border border-slate-100/80 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/40 to-transparent -translate-x-full animate-shimmer" style={{ animationDuration: '1.5s' }} />
            <div className="p-6 h-full flex flex-col justify-center space-y-3">
              <div className="h-5 w-2/3 bg-slate-200 rounded-lg" />
              <div className="h-3 w-1/2 bg-slate-200 rounded-md" />
              <div className="h-7 w-24 bg-slate-200 rounded-lg mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const campaigns = allCampaigns.slice(startIndex, startIndex + count);
  const gridColumns = 3;
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
    <section className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.215, 0.610, 0.355, 1] }}
            className={`group relative h-[190px] rounded-2xl overflow-hidden border border-slate-100 transition-all duration-500 ${
              isDb 
                ? "cursor-pointer bg-slate-900 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:border-slate-200/60" 
                : "bg-slate-50/50 border-dashed border-slate-200"
            }`}
          >
            {isDb ? (
              <>
                {/* Campaign Image Asset */}
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title || "Kampanya"}
                    className="w-full h-full object-cover opacity-90 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
                )}

                {/* Glassmorphic Information Shield */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent p-6 flex flex-col justify-end text-white">
                  <div className="space-y-1.5 transform transition-transform duration-500 group-hover:-translate-y-1">
                    
                    {/* Badge Container */}
                    {dbCamp && (
                      <span className="inline-flex items-center bg-white/15 backdrop-blur-md border border-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase mb-1">
                        {dbCamp.discountType === "PERCENTAGE" ? `%${dbCamp.discountValue} İndirim` : `${dbCamp.discountValue} TL Avantaj`}
                      </span>
                    )}

                    <h3 className="text-base md:text-lg font-bold tracking-tight leading-tight max-w-[85%] line-clamp-2">
                      {title}
                    </h3>

                    {description && (
                      <p className="text-[11px] font-medium text-slate-200/90 max-w-[80%] line-clamp-1 opacity-0 group-hover:opacity-100 transition-all duration-300 max-h-0 group-hover:max-h-6 overflow-hidden">
                        {description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-white/90 pt-1">
                      <span>Keşfet</span>
                      <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </div>

                  </div>
                </div>
              </>
            ) : (
              /* Premium Minimal Empty State Design */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 mb-3 transition-transform duration-500 group-hover:scale-110">
                  {emptyCamp.icon}
                </div>
                <h4 className="text-xs font-semibold text-slate-700 tracking-wide">{emptyCamp.text}</h4>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{emptyCamp.subtext}</p>
              </div>
            )}
          </motion.div>
        );
      })}
    </section>
  );
};