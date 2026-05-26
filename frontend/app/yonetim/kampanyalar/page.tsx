"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Megaphone, Plus, Tag, CheckSquare, Square } from "lucide-react";
import Image from "next/image";

type Campaign = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  startDate: string;
  endDate: string;
  status: string;
};

type Product = {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  barcode: string;
  brand: string;
  originalPrice: number;
  discountPercent: number;
};

export default function SellerCampaignsPage() {
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState<Campaign | null>(null);
  
  // Join Modal State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [campaignPrices, setCampaignPrices] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const res = await apiClient.get("/products/campaigns/active");
      setActiveCampaigns(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const openJoinModal = async (campaign: Campaign) => {
    setShowJoinModal(campaign);
    setLoadingProducts(true);
    try {
      const res = await apiClient.get("/products?limit=500&includeAll=true");
      setProducts(res.data?.data?.products || []);
      setSelectedProductIds(new Set());
      setCampaignPrices({});
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const toggleProduct = (productId: string) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setSelectedProductIds(newSet);
  };

  const submitJoin = async () => {
    if (selectedProductIds.size === 0) return;
    setSubmitting(true);
    
    const payloadProducts = Array.from(selectedProductIds).map(pid => ({
      productId: pid,
      campaignPrice: parseFloat(campaignPrices[pid] || "0")
    }));

    try {
      await apiClient.post(`/products/campaigns/${showJoinModal!.id}/join`, {
        products: payloadProducts
      });
      alert("Katılım talebiniz başarıyla alındı!");
      setShowJoinModal(null);
    } catch (err) {
      console.error(err);
      alert("Katılım sırasında bir hata oluştu. Lütfen kampanya indirim kurallarına uyduğunuzdan emin olun.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b-[0.5px] border-slate-200 pb-4">
        <h1 className="text-xl font-black tracking-tight text-slate-800">Kampanyalar</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">Trendyol partner kampanyalarına katılarak satışlarınızı artırın.</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-white rounded-xl border border-slate-200" />
          <div className="h-40 bg-white rounded-xl border border-slate-200" />
        </div>
      ) : activeCampaigns.length === 0 ? (
        <div className="py-12 bg-white rounded-xl border border-slate-200 text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
            <Megaphone size={24} />
          </div>
          <p className="text-sm font-bold text-slate-600">Şu anda katılabileceğiniz aktif kampanya bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {activeCampaigns.map((camp) => (
            <div key={camp.id} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm flex flex-col sm:flex-row hover:shadow-md transition-all">
              <div className="w-full sm:w-48 h-48 sm:h-auto bg-slate-100 relative shrink-0">
                {camp.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`http://localhost:3002${camp.imageUrl}`} alt={camp.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Tag size={40} />
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-[#ff6000] text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                  Aktif
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-black text-slate-800 text-lg">{camp.title}</h3>
                <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-2">{camp.description}</p>
                
                <div className="mt-4 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kampanya Kuralı</p>
                  <p className="text-sm font-black text-slate-700">
                    {camp.discountType === "PERCENTAGE" 
                      ? `Minimum %${camp.discountValue} İndirim` 
                      : `Minimum ${camp.discountValue} TL İndirim`}
                  </p>
                </div>

                <div className="mt-auto pt-4 flex justify-end">
                  <button 
                    onClick={() => openJoinModal(camp)}
                    className="px-5 py-2 bg-[#ff6000] text-white font-bold text-xs rounded-lg hover:bg-[#e65a00] transition-colors flex items-center gap-2"
                  >
                    <Plus size={14} strokeWidth={3} />
                    Kampanyaya Katıl
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join Campaign Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-slate-800">{showJoinModal.title} - Katılım</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Ürünlerinizi seçin ve kampanya fiyatlarını belirleyin</p>
              </div>
              <button onClick={() => setShowJoinModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
              {loadingProducts ? (
                <div className="flex items-center justify-center h-32 text-slate-400 text-sm font-bold">
                  Ürünleriniz yükleniyor...
                </div>
              ) : products.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-slate-500 text-sm font-medium">
                  Bu kampanyaya eklenebilecek ürününüz bulunmuyor.
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product) => {
                    const isSelected = selectedProductIds.has(product._id);
                    return (
                      <div key={product._id} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${isSelected ? 'bg-[#ff6000]/5 border-[#ff6000]/30' : 'bg-white border-slate-200'}`}>
                        <button onClick={() => toggleProduct(product._id)} className="shrink-0 text-slate-400 hover:text-[#ff6000] focus:outline-none">
                          {isSelected ? <CheckSquare size={20} className="text-[#ff6000]" /> : <Square size={20} />}
                        </button>
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={product.imageUrl || "/placeholder.png"} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">{product.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Barkod: {product.barcode}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Mevcut Fiyat</p>
                          <p className="text-sm font-black text-slate-700">{product.price} TL</p>
                        </div>
                        <div className="w-32 shrink-0">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kampanya Fiyatı</label>
                          <input 
                            type="number" 
                            disabled={!isSelected}
                            value={campaignPrices[product._id] || ""}
                            onChange={(e) => setCampaignPrices({ ...campaignPrices, [product._id]: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm font-black rounded-lg border border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-[#ff6000]"
                            placeholder="Örn: 99.90"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center rounded-b-2xl">
              <p className="text-xs font-bold text-slate-500">
                Seçilen Ürün: <span className="text-slate-800 font-black">{selectedProductIds.size}</span>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowJoinModal(null)} className="px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  İptal
                </button>
                <button 
                  onClick={submitJoin}
                  disabled={selectedProductIds.size === 0 || submitting}
                  className="px-6 py-2 bg-[#ff6000] text-white font-bold text-xs rounded-lg hover:bg-[#e65a00] disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Gönderiliyor..." : "Seçilenleri Gönder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
