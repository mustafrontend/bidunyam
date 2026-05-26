"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

export default function AdminCartsPage() {
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/cart/admin/all")
      .then(res => setCarts(res.data?.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Aktif Sepetler</h1>
        <p className="text-sm font-semibold text-slate-500">Müşterilerin anlık sepet içeriklerini izleyin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-slate-400 font-semibold text-sm animate-pulse">Yükleniyor...</div>
        ) : carts.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-400 font-semibold text-sm">Şu an aktif sepet bulunmuyor.</div>
        ) : (
          carts.map((cart, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Kullanıcı ID</span>
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]" title={cart.userId}>{cart.userId}</p>
                </div>
                <div className="bg-[#ff5000]/10 text-[#ff5000] px-3 py-1 rounded-lg text-xs font-black text-center">
                  {cart.totalItems} Ürün
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-50">
                {cart.items.slice(0, 3).map((item: any, i: number) => (
                  <div key={i} className="flex gap-3 items-center">
                    <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100 bg-slate-50" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-500">{item.quantity} Adet • {item.price.toLocaleString()} TL</p>
                    </div>
                  </div>
                ))}
                {cart.items.length > 3 && (
                  <p className="text-[10px] font-bold text-slate-400 text-center pt-2">+{cart.items.length - 3} ürün daha</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Sepet Tutarı</span>
                <span className="text-lg font-black text-slate-900">{cart.totalPrice.toLocaleString()} TL</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
