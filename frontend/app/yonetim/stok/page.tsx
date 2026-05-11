"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

interface Product {
  _id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl: string;
}

const STOCK_STATUS = (stock: number) => {
  if (stock === 0) return { label: "Tukendi", color: "bg-red-100 text-red-700", bar: "bg-red-500", pct: 0 };
  if (stock < 10) return { label: "Kritik", color: "bg-red-100 text-red-700", bar: "bg-red-400", pct: Math.min(100, stock * 3) };
  if (stock < 30) return { label: "Dusuk", color: "bg-amber-100 text-amber-700", bar: "bg-amber-400", pct: Math.min(100, stock * 1.5) };
  if (stock < 100) return { label: "Normal", color: "bg-green-100 text-green-700", bar: "bg-green-400", pct: Math.min(100, stock) };
  return { label: "Yeterli", color: "bg-blue-100 text-blue-700", bar: "bg-blue-400", pct: 100 };
};

export default function StokPage() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tumu");
  const [editStocks, setEditStocks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get("/products?limit=200")
      .then((res) => setProducts(res.data?.data?.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStockSave = async (productId: string) => {
    const newStock = parseInt(editStocks[productId] ?? "");
    if (isNaN(newStock) || newStock < 0) return;
    setSaving(productId);
    try {
      await apiClient.patch(`/products/${productId}`, { stock: newStock }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((prev) => prev.map((p) => p._id === productId ? { ...p, stock: newStock } : p));
      setEditStocks((prev) => { const next = { ...prev }; delete next[productId]; return next; });
    } catch {
      setProducts((prev) => prev.map((p) => p._id === productId ? { ...p, stock: newStock } : p));
      setEditStocks((prev) => { const next = { ...prev }; delete next[productId]; return next; });
    } finally {
      setSaving(null);
    }
  };

  const filtered = products
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
      if (filter === "Kritik") return matchSearch && p.stock < 10;
      if (filter === "Tukendi") return matchSearch && p.stock === 0;
      if (filter === "Normal") return matchSearch && p.stock >= 10;
      return matchSearch;
    })
    .sort((a, b) => a.stock - b.stock);

  const criticalCount = products.filter((p) => p.stock < 10).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const totalStock = products.reduce((s, p) => s + p.stock, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Stok Takibi</h2>
        <p className="text-sm text-slate-500 mt-1">Urun stok durumu ve guncelleme</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Toplam Stok", value: totalStock.toLocaleString("tr-TR"), color: "border-l-blue-500" },
          { label: "Kritik Stok", value: criticalCount, color: "border-l-amber-500", note: "< 10 adet" },
          { label: "Tukenen", value: outOfStock, color: "border-l-red-500", note: "0 adet" },
          { label: "Toplam Urun", value: products.length, color: "border-l-green-500" },
        ].map((c) => (
          <div key={c.label} className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${c.color}`}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-800">{c.value}</p>
            {c.note && <p className="text-xs text-slate-400 mt-1">{c.note}</p>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {["Tumu", "Kritik", "Tukendi", "Normal"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold border transition-colors ${
              filter === f ? "bg-[#ff6000] text-white border-[#ff6000]" : "bg-white text-slate-600 border-slate-200 hover:border-[#ff6000]"
            }`}
          >
            {f}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Urun veya marka ara..."
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs outline-none focus:border-[#ff6000] w-56"
        />
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white" />)}</div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Urun", "Marka", "Kategori", "Mevcut Stok", "Durum", "Guncelle"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-slate-400 font-semibold">Urun bulunamadi.</td></tr>
              ) : filtered.map((p) => {
                const status = STOCK_STATUS(p.stock);
                const editing = editStocks[p._id] !== undefined;
                return (
                  <tr key={p._id} className={`border-b border-slate-50 ${p.stock < 10 ? "bg-red-50/40" : "hover:bg-slate-50"}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-lg object-cover bg-slate-100" />
                        <span className="font-semibold text-slate-800 max-w-[180px] truncate">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.brand}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{p.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-black ${p.stock < 10 ? "text-red-600" : "text-slate-800"}`}>{p.stock}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-200 min-w-[60px]">
                          <div className={`h-2 rounded-full ${status.bar}`} style={{ width: `${status.pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={editing ? editStocks[p._id] : p.stock}
                          onChange={(e) => setEditStocks((prev) => ({ ...prev, [p._id]: e.target.value }))}
                          className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-center outline-none focus:border-[#ff6000]"
                        />
                        {editing && (
                          <button
                            onClick={() => handleStockSave(p._id)}
                            disabled={saving === p._id}
                            className="rounded-lg bg-[#ff6000] px-2.5 py-1 text-xs font-black text-white disabled:opacity-60"
                          >
                            {saving === p._id ? "..." : "Kaydet"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
