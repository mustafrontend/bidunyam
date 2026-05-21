"use client";

import React, { useRef, useState, useEffect } from "react";
import { Star, ChevronRight, ChevronLeft, ThumbsUp, MessageSquare, Camera } from "lucide-react";

interface ProductReviewsProps {
  rating: number;
  reviewCount: number;
  productImageUrl?: string;
}

interface Review {
  id: string;
  user: string;
  dateString: string;
  rating: number;
  comment: string;
  sellerName: string;
  likes: number;
  hasLiked?: boolean;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  rating = 4.3,
  reviewCount = 47266,
  productImageUrl = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { id } = (typeof window !== 'undefined' ? require('next/navigation') : { useParams: () => ({}) }).useParams?.() || {};

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    import("@/lib/api").then(({ apiClient }) => {
      apiClient
        .get(`/products/${id}/reviews`)
        .then((res) => setReviews(res.data.data))
        .catch(() => setError("Yorumlar yüklenemedi"))
        .finally(() => setLoading(false));
    });
  }, [id]);

  const handleLike = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            likes: r.hasLiked ? r.likes - 1 : r.likes + 1,
            hasLiked: !r.hasLiked,
          };
        }
        return r;
      })
    );
  };

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = 320;
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="space-y-6 select-none bg-white border-[0.5px] border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm">
      <h3 className="text-base font-black text-slate-800 tracking-tight uppercase">Ürün Değerlendirmeleri</h3>

      {/* Ratings summary bar styled exactly like the screenshot */}
      <div className="bg-[#fff9e6] border-[0.5px] border-[#fbe9b7]/40 rounded-xl p-3.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5 text-xs font-black text-slate-800">
          <div className="flex text-amber-500 gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={15} fill="currentColor" className="stroke-none text-amber-500" />
            ))}
          </div>
          <span className="text-sm font-black text-slate-900 flex items-center gap-0.5">
            {rating.toFixed(1)}
            <ChevronRight size={14} className="rotate-90 text-slate-600 shrink-0" strokeWidth={2.5} />
          </span>
          <span className="text-slate-300 font-normal">•</span>
          <span className="text-slate-600 font-bold">{reviewCount.toLocaleString("tr-TR")} Değerlendirme</span>
          <span className="text-slate-300 font-normal">•</span>
          <span className="text-slate-600 font-bold flex items-center gap-1">
            23708 Yorum
            <Camera size={13} className="text-slate-600" />
          </span>
        </div>
      </div>

      {/* Review Cards Carousel container */}
      <div className="relative group">
        {/* Left Arrow Button */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-8 h-8 rounded-full bg-white border border-slate-200/80 shadow-md flex items-center justify-center z-10 hover:scale-105 active:scale-95 transition-all text-slate-700 cursor-pointer hidden md:flex"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-8 h-8 rounded-full bg-white border border-slate-200/80 shadow-md flex items-center justify-center z-10 hover:scale-105 active:scale-95 transition-all text-slate-700 cursor-pointer hidden md:flex"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>

        {/* Horizontal scroll reviews */}
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="min-w-[280px] md:min-w-[320px] max-w-[320px] bg-white border-[0.5px] border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm scroll-snap-align-start hover:border-slate-300 transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <div className="flex text-amber-500 gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={11} fill={i < rev.rating ? "currentColor" : "none"} className="stroke-none" />
                    ))}
                  </div>
                </div>

                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {rev.user} <span className="text-slate-300 mx-1">•</span> {rev.dateString || "Yeni Değerlendirme"}
                </div>

                <p className="text-xs text-slate-600 font-bold leading-relaxed line-clamp-4">
                  {rev.comment}
                </p>

                <button className="text-[10px] font-black text-slate-800 hover:text-[#ff5000] uppercase tracking-wider block mt-1">
                  Devamını Oku &gt;
                </button>

                <span className="text-[10px] font-black text-[#ff5000]/90 block mt-2 hover:underline cursor-pointer">
                  {rev.sellerName} satıcısından alındı
                </span>
              </div>

              {/* Action Bar (ThumbsUp and Message / Report) */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3 text-slate-400 text-xs font-black">
                <button
                  onClick={() => handleLike(rev.id)}
                  className={`flex items-center gap-1.5 hover:text-[#ff5000] active:scale-95 transition-all cursor-pointer ${
                    rev.hasLiked ? "text-[#ff5000]" : "text-slate-500"
                  }`}
                >
                  <ThumbsUp size={12} strokeWidth={2.5} />
                  <span>({rev.likes})</span>
                </button>
                <span className="text-slate-200">•</span>
                <button className="hover:text-slate-600 cursor-pointer active:scale-95">
                  <MessageSquare size={12} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Show all reviews button in center */}
      <div className="pt-2">
        <button className="w-full max-w-[280px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black py-3 rounded-full flex items-center justify-center gap-1 mx-auto cursor-pointer transition-all active:scale-95 shadow-sm border border-slate-200/60 uppercase tracking-widest">
          TÜM YORUMLARI GÖSTER &gt;
        </button>
      </div>
    </div>
  );
};
