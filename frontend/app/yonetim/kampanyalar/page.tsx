"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

interface Product {
  _id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  imageUrl: string;
}

interface Campaign {
  id: string;
  product: Product;
  type: "indirim" | "free-shipping" | "bundle";
  label: string;
  active: boolean;
  createdAt: string;
}

const CAMPAIGN_TYPES = [
  { value: "indirim", label: "Indirim Kampanyasi" },
  { value: "free-shipping", label: "Ucretsiz Kargo" },
  { value: "bundle", label: "Paket Kampanyasi" },
];

export default function KampanyalarPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formProduct, setFormProduct] = useState("");
  const [formType, setFormType] = useState("indirim");
  const [formLabel, setFormLabel] = useState("");

  useEffect(() => {
    apiClient.get("/products?limit=100")
      .then((res) => {
        const prods: Product[] = res.data?.data?.products || [];
        setProducts(prods);
        // Auto-generate campaigns from discounted products
        const auto: Campaign[] = prods
          .filter((p) => p.discountPercent > 0)
          .slice(0, 6)
          .map((p) => ({
            id: p._id,
            product: p,
            type: "indirim",
            label: `%${p.discountPercent} Indirim`,
            active: true,
            createdAt: new Date().toISOString(),
          }));
        setCampaigns(auto);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = () => {
    const product = products.find((p) => p._id === formProduct);
    if (!product || !formLabel) return;
    const newCampaign: Campaign = {
      id: `manual-${Date.now()}`,
      product,
      type: formType as Campaign["type"],
      label: formLabel,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    setShowForm(false);
    setFormProduct("");
    setFormLabel("");
  };

  const toggleCampaign = (id: string) => {
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, active: !c.active } : c));
  };

  const deleteCampaign = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  const activeCampaigns = campaigns.filter((c) => c.active);
  const inactiveCampaigns = campaigns.filter((c) => !c.active);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Kampanya Yonetimi</h2>
          <p className="text-sm text-slate-500 mt-1">{activeCampaigns.length} aktif kampanya</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-[#ff6000] px-5 py-2.5 text-sm font-black text-white hover:bg-[#d85000] transition-colors"
        >
          + Yeni Kampanya
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Aktif Kampanya", value: activeCampaigns.length, color: "border-l-green-500" },
          { label: "Indirimli Urun", value: products.filter((p) => p.discountPercent > 0).length, color: "border-l-[#ff6000]" },
          { label: "Ort. Indirim", value: `%${Math.round(products.filter((p) => p.discountPercent > 0).reduce((s, p) => s + p.discountPercent, 0) / Math.max(1, products.filter((p) => p.discountPercent > 0).length))}`, color: "border-l-purple-500" },
        ].map((c) => (
          <div key={c.label} className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${c.color}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-800">{c.value}</p>
          </div>
        ))}
      </div>

      {/* New Campaign Form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-base font-black text-slate-700">Yeni Kampanya Olustur</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Urun Sec</label>
              <select
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]"
              >
                <option value="">-- Urun --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} ({p.brand})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Kampanya Turu</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]"
              >
                {CAMPAIGN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Etiket / Aciklama</label>
              <input
                type="text"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="%20 Super Indirim!"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]"
              />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={handleCreate} className="rounded-lg bg-[#ff6000] px-5 py-2 text-sm font-black text-white">Olustur</button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Vazgec</button>
          </div>
        </div>
      )}

      {/* Active Campaigns */}
      <div>
        <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-600">Aktif Kampanyalar</h3>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-white" />)}</div>
        ) : activeCampaigns.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center text-slate-400 font-semibold shadow-sm border border-slate-100">Aktif kampanya yok.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeCampaigns.map((c) => (
              <div key={c.id} className="rounded-xl border border-green-100 bg-white p-5 shadow-sm relative">
                <div className="absolute top-3 right-3 flex gap-2">
                  <button onClick={() => toggleCampaign(c.id)} className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 hover:bg-amber-200">Pasif Yap</button>
                  <button onClick={() => deleteCampaign(c.id)} className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 hover:bg-red-200">Sil</button>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <img src={c.product.imageUrl} alt={c.product.name} className="h-12 w-12 rounded-lg object-cover bg-slate-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{c.product.name}</p>
                    <p className="text-xs text-slate-500">{c.product.brand}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#ff6000]/10 px-3 py-1 text-xs font-black text-[#ff6000]">{c.label}</span>
                  <span className="text-xs text-slate-400">{CAMPAIGN_TYPES.find((t) => t.value === c.type)?.label}</span>
                </div>
                {c.product.discountPercent > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-lg font-black text-[#ff6000]">{c.product.price.toLocaleString("tr-TR")} TL</span>
                    <span className="text-sm text-slate-400 line-through">{c.product.originalPrice.toLocaleString("tr-TR")} TL</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inactive Campaigns */}
      {inactiveCampaigns.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-400">Pasif Kampanyalar ({inactiveCampaigns.length})</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {inactiveCampaigns.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 opacity-60">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-600 truncate max-w-[60%]">{c.product.name}</p>
                  <button onClick={() => toggleCampaign(c.id)} className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 hover:bg-green-200">Aktif Yap</button>
                </div>
                <p className="text-xs text-slate-400 mt-1">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
