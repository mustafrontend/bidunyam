"use client";

import React, { useState, useMemo } from "react";
import { Heart } from "lucide-react";

interface ProductGalleryProps {
  gallery: string[];
  name: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  gallery = [],
  name,
  isFavorite,
  onToggleFavorite,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  // If the product in DB only has 1 image, generate the 4 dynamic thumbnails matching your HTML
  const displayImages = useMemo(() => {
    if (gallery.length === 0) return [];
    if (gallery.length === 1) {
      const single = gallery[0];
      return [
        { url: single, style: "" },
        { url: single, style: "grayscale opacity-50" },
        { url: single, style: "rotate-90" },
        { url: single, style: "blur-[1px]", showOverlay: true, count: "+2" },
      ];
    }
    return gallery.slice(0, 4).map((img, idx) => ({
      url: img,
      style: "",
      showOverlay: idx === 3 && gallery.length > 4,
      count: `+${gallery.length - 3}`,
    }));
  }, [gallery]);

  const activeItem = displayImages[selectedIdx];

  return (
    <div className="w-full space-y-4 select-none">
      {/* Main Image Stage */}
      <div className="aspect-[1.83] bg-white border border-slate-200 rounded-xl overflow-hidden group relative flex items-center justify-center p-8 transition-all duration-300">
        {activeItem ? (
          <img
            src={activeItem.url}
            alt={name}
            className={`max-h-[85%] max-w-[85%] object-contain transition-all duration-300 group-hover:scale-105 ${activeItem.style}`}
          />
        ) : (
          <span className="text-3xl">📦</span>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite();
          }}
          className={`absolute top-4 right-4 backdrop-blur p-2.5 rounded-full border transition-all duration-200 cursor-pointer active:scale-[0.95] ${
            isFavorite
              ? "bg-[#ff5000]/10 border-[#ff5000]/20 text-[#ff5000]"
              : "bg-white/80 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white"
          }`}
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} strokeWidth={isFavorite ? 0 : 2.5} />
        </button>
      </div>

      {/* Thumbnails grid */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {displayImages.map((item, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`relative aspect-square overflow-hidden bg-white border rounded-xl p-2 transition-all duration-200 hover:scale-[1.02] cursor-pointer flex items-center justify-center ${
                  isSelected ? "border-2 border-[#ff5000]" : "border-slate-200 hover:border-[#ff5000]/60"
                }`}
              >
                <img src={item.url} className={`h-full w-full object-contain ${item.style}`} alt="" />
                {item.showOverlay && (
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center rounded-xl text-slate-800 font-black text-sm">
                    {item.count}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
