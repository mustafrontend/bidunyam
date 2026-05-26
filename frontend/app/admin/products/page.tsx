"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Eye, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiClient.get("/products/admin/products/all")
      .then(res => setProducts(res.data?.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ürün Kataloğu & Analitik</h1>
        <p className="text-sm font-semibold text-slate-500">Tüm ürünlerin görüntülenme (tıklama) ve sipariş istatistikleri.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-semibold text-sm animate-pulse">Yükleniyor...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Ürün</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Satıcı</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Görüntülenme</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Satışlar</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Fiyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr 
                    key={p.id} 
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/product/${p.id}`)}
                  >
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 line-clamp-1 max-w-[200px]">{p.name}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{p.category}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{p.sellerName}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black">
                        <Eye size={12} strokeWidth={3} />
                        {p.views || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black">
                        <ShoppingCart size={12} strokeWidth={3} />
                        {p.sales || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900">
                      {p.price?.toLocaleString()} TL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
