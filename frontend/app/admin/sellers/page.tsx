"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/auth/admin/sellers")
      .then(res => setSellers(res.data?.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Satıcılar</h1>
        <p className="text-sm font-semibold text-slate-500">Sisteme kayıtlı tüm mağazalar ve satıcı hesapları.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-semibold text-sm animate-pulse">Yükleniyor...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Satıcı Tipi</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">İsim / Şirket</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">E-Posta</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Vergi Bilgileri</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase">
                        {s.accountType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      {s.accountType === "BIREYSEL" ? s.fullName : s.companyName}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{s.email}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {s.taxNo ? `${s.taxNo} (${s.taxOffice})` : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {s.isActive ? (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">Aktif</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-red-50 text-red-600 text-[10px] font-black uppercase">Pasif</span>
                      )}
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
