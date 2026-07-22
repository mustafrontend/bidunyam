"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Star, 
  ShoppingCart, 
  Heart, 
  CheckCircle2, 
  MessageSquare, 
  X, 
  ArrowUpDown,
  Truck,
  ShieldCheck
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useFavoriteStore } from "@/stores/favoriteStore";
import { useUiStore } from "@/stores/uiStore";
import { productPath } from "@/lib/productUrl";

interface Question {
  id: string;
  category: string;
  question: string;
  user: string;
  date: string;
  purchased: boolean;
  sellerName: string;
  responseRate?: string;
  answer?: string;
  status: "ANSWERED" | "PENDING";
  createdAt?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  brand: string;
  category: string;
  rating: number;
  reviewCount: number;
  sellerName?: string;
}

export default function ProductQuestionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("tümü");
  const [showOnlySelectedSeller, setShowOnlySelectedSeller] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [allowNameDisplay, setAllowNameDisplay] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const token = useAuthStore((s) => s.token);
  const { productIds: favs, toggleFavorite } = useFavoriteStore();
  const setLoginModalOpen = useUiStore((s) => s.setLoginModalOpen);
  const isFav = useMemo(() => favs.includes(id as string), [favs, id]);

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (!id) return;
    apiClient
      .get(`/products/${id}/questions`)
      .then((res) => setQuestions(res.data.data))
      .catch(() => setQuestions([]));
  }, [id]);

  // Sidebar filters
  const categories = [
    "tümü",
    "Kullanım Talimatları",
    "Emziren Anneler İçin Uygun Mu?",
    "Son Kullanma Tarihi",
    "Kullanım Alanları",
    "Yaş Uygunluğu",
    "Ürün İçeriği",
    "Cilde Etkisi",
    "Helal Sertifikası Var Mı?",
    "Cinsiyet",
  ];

  // Fetch product info
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get(`/products/${id}`)
      .then((res) => {
        const prod = res.data.data;
        setProduct({
          _id: prod.id || prod._id,
          name: prod.name,
          price: prod.price,
          imageUrl: prod.imageUrl,
          brand: prod.brand || "iCollagen",
          category: prod.category || "Kolajen Ve Prebiyotik",
          rating: prod.rating || 4.8,
          reviewCount: prod.reviewCount || 141,
        });
      })
      .catch(() => {
        // High fidelity fallback
        setProduct({
          _id: String(id),
          name: "iCollagen Kolajen Ve Prebiyotik Tablet",
          price: 350,
          imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d304b3b44?q=80&w=400&auto=format&fit=crop",
          brand: "iCollagen",
          category: "Kolajen Ve Prebiyotik",
          rating: 4.8,
          reviewCount: 47266,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Handle Dynamic Question Submitting
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !acceptTerms) return;

    try {
      const res = await apiClient.post(`/products/${id}/questions`, {
        question: questionText,
        user: allowNameDisplay ? "Mustafa Ö." : "M** Ö**",
        purchased: true,
        sellerName: product?.sellerName || product?.brand || "Satıcı Bilinmiyor",
        category: selectedCategory === "tümü" ? "Kullanım Talimatları" : selectedCategory,
      });

      const savedQuestion = res.data.data;
      setQuestions((prev) => [savedQuestion, ...prev]);
      
      setIsModalOpen(false);
      setQuestionText("");
      setAllowNameDisplay(false);
      setAcceptTerms(false);

      // Simulate realistic seller response update after 4 seconds
      setTimeout(() => {
        apiClient
          .get(`/products/${id}/questions`)
          .then((res) => setQuestions(res.data.data))
          .catch(() => {});
      }, 4000);
    } catch (err) {
      console.error("Failed to submit question:", err);
    }
  };

  // Real-time filtering logic
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (q.answer && q.answer.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const normalizedCat = selectedCategory.toLowerCase();
      const matchesCategory = normalizedCat === "tümü" || normalizedCat.includes("tümü") ||
                             q.category.toLowerCase().includes(normalizedCat) ||
                             normalizedCat.includes(q.category.toLowerCase());

      const matchesSeller = !showOnlySelectedSeller || q.sellerName === (product?.sellerName || "Satıcı Bilinmiyor");

      return matchesSearch && matchesCategory && matchesSeller;
    });
  }, [questions, searchQuery, selectedCategory, showOnlySelectedSeller]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-16 space-y-8">
        <div className="h-6 w-1/4 rounded bg-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 h-100 rounded bg-slate-100" />
          <div className="lg:col-span-8 h-150 rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-6 select-none">
      <main className="mx-auto max-w-7xl px-4 md:px-8 space-y-6">
        
        {/* Breadcrumb row */}
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
          <span className="hover:text-[#ff5000] cursor-pointer" onClick={() => router.push("/")}>Ana Sayfa</span>
          <ChevronRight size={10} strokeWidth={3} />
          <span className="hover:text-[#ff5000] cursor-pointer" onClick={() => router.push(productPath(product))}>{product.name}</span>
          <ChevronRight size={10} strokeWidth={3} />
          <span className="text-slate-800">Soru & Cevaplar</span>
        </nav>

        {/* 2-Column responsive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Product Snippet Card & Filters */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Product Summary mini card */}
            <div className="bg-white border-[0.5px] border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden p-1 flex items-center justify-center shrink-0">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">{product.brand}</span>
                  <h3 className="text-xs font-black text-slate-800 line-clamp-2 leading-tight">{product.name}</h3>
                  <div className="flex items-center gap-1.5 text-[9px] font-black bg-orange-50 text-[#ff5000] border border-orange-200/40 px-2 py-0.5 rounded w-fit uppercase">
                    🛒 104,5B kişinin sepetinde, kaçırma!
                  </div>
                  <div className="flex gap-1.5">
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase">
                      <Truck size={10} /> Kargo Bedava
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-lg font-black text-slate-900">{product.price.toLocaleString("tr-TR")} TL</span>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => product && addItem({
                      _id: product._id,
                      name: product.name,
                      price: product.price,
                      imageUrl: product.imageUrl,
                      brand: product.brand,
                      category: product.category,
                    }, token)}
                    className="bg-[#ff5000] hover:bg-[#ff5000]/90 text-white font-black text-xs px-5 py-2.5 rounded-full flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
                  >
                    <ShoppingCart size={13} strokeWidth={2.5} /> Sepete Ekle
                  </button>
                  <button 
                    onClick={() => {
                      if (token) toggleFavorite(product._id, token);
                      else setLoginModalOpen(true);
                    }}
                    className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all hover:scale-105 active:scale-95 shadow-sm"
                  >
                    <Heart size={15} className={isFav ? "fill-red-500 text-red-500" : ""} />
                  </button>
                </div>
              </div>
            </div>

            {/* Seller Rating Box */}
            <div className="bg-white border-[0.5px] border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-600 text-xs shadow-inner uppercase">
                    {product.sellerName ? product.sellerName.substring(0, 2) : "SB"}
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">{product.sellerName || "Satıcı Bilinmiyor"}</span>
                    <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded mt-0.5">
                      9.3
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#eaf3ff] hover:bg-[#d8e8ff] text-[#0060df] text-xs font-black px-5 py-2.5 rounded-full transition-all active:scale-95 cursor-pointer uppercase tracking-wider border border-[#0060df]/10"
                >
                  Soru Sor
                </button>
              </div>

              {/* Checkbox filter for selected seller */}
              <label className="flex items-center gap-2.5 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={showOnlySelectedSeller}
                  onChange={(e) => setShowOnlySelectedSeller(e.target.checked)}
                  className="accent-[#ff5000] w-4 h-4 cursor-pointer"
                />
                <span className="text-[11px] font-black text-slate-600 uppercase tracking-wide">
                  Seçili satıcının sorularını göster
                </span>
              </label>
            </div>

            {/* Left sidebar category filters */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Konuya Göre Filtrele</span>
              <div className="flex flex-col gap-2">
                {categories.map((cat) => {
                  const isSelected = selectedCategory.toLowerCase() === cat.split(" (")[0].toLowerCase();
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat.split(" (")[0])}
                      className={`text-left px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wide transition-all border ${
                        isSelected
                          ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Q&A Header, Search and Content List */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header section */}
            <div className="bg-white border-[0.5px] border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  Tüm Ürün Soru ve Cevapları ({filteredQuestions.length})
                </h1>
                <span className="text-[10px] font-black text-slate-400 hover:text-slate-600 cursor-pointer underline flex items-center gap-1">
                  📋 Sağlık Beyanı & Soru Yayınlama Kriterleri
                </span>
              </div>

              {/* Search & Sort Controls bar */}
              <div className="flex gap-3 flex-wrap">
                
                {/* Search Bar */}
                <div className="relative flex-1 min-w-65">
                  <input
                    type="text"
                    placeholder="Satıcı Sorularında Ara"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-300 transition-all placeholder-slate-400"
                  />
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-10 py-3 text-xs font-black text-slate-700 focus:outline-none cursor-pointer uppercase tracking-wider"
                  >
                    <option value="recommended">Önerilen Sıralama</option>
                    <option value="newest">En Yeni Sorular</option>
                  </select>
                  <ArrowUpDown size={13} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>

              </div>
            </div>

            {/* Q&A Vertical list */}
            <div className="space-y-4">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((q) => (
                  <div 
                    key={q.id} 
                    className="bg-white border-[0.5px] border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all"
                  >
                    
                    {/* Question Section */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-black text-slate-800 leading-snug">
                          {q.question}
                        </h4>
                        <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          <span>{q.user}</span>
                          <span>•</span>
                          <span>{q.date || (q.createdAt ? new Date(q.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Bugün')}</span>
                          {q.purchased && (
                            <span className="text-emerald-600 font-extrabold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              <CheckCircle2 size={11} strokeWidth={2.5} /> Ürünü satın aldı
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Speech bubble report flag button */}
                      <button className="text-slate-400 hover:text-[#ff5000] p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer">
                        <MessageSquare size={14} />
                      </button>
                    </div>

                    {/* Answer Section */}
                    {q.status === "PENDING" ? (
                      <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 flex items-center gap-2">
                        <span className="text-[10px] font-black text-amber-700 animate-pulse uppercase tracking-wider">
                          ⏳ Soru satıcıya iletildi, cevap bekleniyor...
                        </span>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border-[0.5px] border-slate-200/50 rounded-2xl p-5 space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#ff5000] flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-sm uppercase select-none">
                            {q.sellerName[0]}
                          </div>
                          <div>
                            <span className="text-[11px] font-black text-slate-800 block uppercase tracking-wide">
                              {q.sellerName} satıcısının cevabı
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
                              {q.responseRate}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 font-bold leading-relaxed">
                          {q.answer}
                        </p>
                      </div>
                    )}

                  </div>
                ))
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-xs font-black text-slate-400 select-none">
                  Aramanıza veya seçtiğiniz kategoriye uygun soru bulunamadı.
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      {/* Soru Sor Premium Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          {/* Modal Container */}
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-135 overflow-hidden border border-slate-200/80 transform scale-100 transition-all duration-300">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center select-none">
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Satıcıya Soru Sor</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            {/* Form */}
            <form onSubmit={handleSubmitQuestion} className="p-6 space-y-6">
              {/* Seller details badge */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl">
                <span className="text-xs font-black text-[#0060df] uppercase tracking-wider">{product.sellerName || "Satıcı Bilinmiyor"}</span>
                <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">9.3</span>
              </div>
              {/* Informational notice */}
              <p className="text-[11px] text-slate-500 font-bold leading-normal select-none">Ürün özellikleriyle ilgili sorularınızı buradan satıcıya sorabilirsiniz.</p>
              {/* Textarea under title "Soru Sor" */}
              <div className="space-y-2 select-none">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider">Soru Sor</label>
                  <span className="text-[10px] font-black text-[#0060df] hover:underline cursor-pointer">Soru Yayınlama Kriterlerimiz</span>
                </div>
                <div className="relative">
                  <textarea
                    rows={4}
                    maxLength={2000}
                    placeholder="Soru detaylarını buraya giriniz..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-300 transition-all placeholder-slate-400 resize-none"
                  />
                  <span className="absolute bottom-3 right-4 text-[9px] font-black text-slate-400">{2000 - questionText.length}</span>
                </div>
              </div>
              {/* Checkbox 1 */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowNameDisplay}
                  onChange={(e) => setAllowNameDisplay(e.target.checked)}
                  className="accent-[#ff5000] w-4 h-4 mt-0.5 cursor-pointer shrink-0"
                />
                <span className="text-[10px] font-bold text-slate-500 leading-normal">Sorularda ad soyad bilgimin gözükmesine izin veriyorum. Aydınlatma metnine ulaşmak için <span className="text-[#0060df] underline font-extrabold">tıklayınız.</span></span>
              </label>
              {/* Checkbox 2 */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="accent-[#ff5000] w-4 h-4 mt-0.5 cursor-pointer shrink-0"
                />
                <span className="text-[10px] font-bold text-slate-500 leading-normal">Soru eklemek için <span className="text-[#0060df] underline font-extrabold">Kullanıcı Sözleşmesi</span>'ni kabul ediyorum.</span>
              </label>
              {/* Submit Button */}
              <button
                type="submit"
                disabled={!questionText.trim() || !acceptTerms}
                className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md ${
                  questionText.trim() && acceptTerms
                    ? "bg-[#ff5000] hover:bg-[#ff5000]/90 text-white cursor-pointer active:scale-[0.98]"
                    : "bg-slate-300 text-slate-400 cursor-not-allowed shadow-none"
                }`}
              >
                Gönder
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}