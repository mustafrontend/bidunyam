"use client";

import React, { useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { ChevronRight, ChevronLeft, CheckCircle2, MessageSquare } from "lucide-react";
import { extractProductId } from "@/lib/productUrl";

interface Question {
  id: string;
  category: string;
  question: string;
  user: string;
  createdAt: string;
  purchased: boolean;
  sellerName: string;
  responseRate?: string;
  answer?: string;
  status?: string;
  date?: string;
}

export const ProductQuestions: React.FC = () => {
  const router = useRouter();
  const { id: rawId } = useParams();
  const id = extractProductId(String(rawId ?? ""));
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>("tümü");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get(`/products/${id}/questions`)
      .then((res) => setQuestions(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => setError("Sorular yüklenemedi"))
      .finally(() => setLoading(false));
  }, [id]);

  // Filtre chip'leri gerçek sorulardan üretilir (sahte sayı yok)
  const catCounts = new Map<string, number>();
  for (const q of questions) {
    const c = (q.category || "tümü").trim();
    if (c && c !== "tümü") catCounts.set(c, (catCounts.get(c) || 0) + 1);
  }
  const filterChips = [
    { id: "tümü", label: `Tümü (${questions.length})` },
    ...[...catCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat, n]) => ({ id: cat, label: `${cat} (${n})` })),
  ];

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = 320;
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const filteredQuestions = activeTab === "tümü" 
    ? questions 
    : questions.filter(q => q.category === activeTab || q.category === "tümü");

  return (
    <div className="space-y-6 select-none bg-white border-[0.5px] border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm">
      <h3 className="text-base font-black text-slate-800 tracking-tight uppercase">Ürün Soru ve Cevapları</h3>

      {/* Soru yoksa boş durum */}
      {!loading && questions.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
          <MessageSquare size={26} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-black text-slate-600">Henüz soru sorulmamış</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">Merak ettiğinizi satıcıya ilk soran siz olun.</p>
        </div>
      )}

      {/* Kategori filtreleri — yalnızca birden fazla kategori varsa */}
      {filterChips.length > 1 && (
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {filterChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setActiveTab(chip.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 shrink-0 cursor-pointer active:scale-95 border ${
              activeTab === chip.id
                ? "bg-slate-900 border-slate-900 text-white"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {chip.label} &gt;
          </button>
        ))}
      </div>
      )}

      {/* Carousel Container — yalnızca soru varsa */}
      {questions.length > 0 && (
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

        {/* Horizontal Q&As */}
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="min-w-[290px] md:min-w-[340px] max-w-[340px] bg-white border-[0.5px] border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm scroll-snap-align-start hover:border-slate-300 transition-all gap-4"
            >
              <div className="space-y-3">
                {/* Question title */}
                <h4 className="text-xs font-black text-slate-800 leading-snug">
                  {q.question}
                </h4>

                {/* User info and verified purchase indicator */}
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <span>{q.user} - {q.date || (q.createdAt ? new Date(q.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Bugün')}</span>
                  {q.purchased && (
                    <span className="text-emerald-600 font-extrabold flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 size={12} strokeWidth={2.5} />
                      Ürünü satın aldı
                    </span>
                  )}
                </div>

                {/* Answer box styled exactly like screenshot 2 */}
                <div className="bg-slate-50 border-[0.5px] border-slate-200/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {/* Orange circle seller avatar */}
                    <div className="w-6 h-6 rounded-full bg-[#ff5000] flex items-center justify-center text-white text-[9px] font-black shrink-0 shadow-sm uppercase">
                      {q.sellerName[0]}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-slate-800 block">
                        {q.sellerName} satıcısının cevabı
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 block">
                        {q.responseRate}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                    {q.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Tüm soruları göster — yalnızca 3'ten fazla soru varsa */}
      {questions.length > 3 && (
        <div className="pt-2">
          <button
            onClick={() => router.push(`/product/${id}/questions`)}
            className="w-full max-w-[280px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black py-3 rounded-full flex items-center justify-center gap-1 mx-auto cursor-pointer transition-all active:scale-95 shadow-sm border border-slate-200/60 uppercase tracking-widest"
          >
            TÜM SORULARI GÖSTER &gt;
          </button>
        </div>
      )}
    </div>
  );
};
