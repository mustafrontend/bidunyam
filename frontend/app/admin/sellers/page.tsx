"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { Search, Store, User, ExternalLink, FileCode2 } from "lucide-react";

type Seller = {
  id: string;
  email: string;
  accountType: "BIREYSEL" | "TUZEL" | string;
  fullName?: string | null;
  companyName?: string | null;
  displayName?: string | null;
  taxNo?: string | null;
  taxOffice?: string | null;
  isActive: boolean;
  createdAt: string;
  storeName?: string | null;
  storeSlug?: string | null;
  payoutIban?: string | null;
  acceptedSellerAgreement?: boolean;
  contractAcceptedAt?: string | null;
  productCount: number;
  activeProducts: number;
  totalStock: number;
  totalSales: number;
  revenue: number;
  feedCount: number;
  pendingFeeds: number;
  approvedFeeds: number;
};

const money = (n: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n || 0);

const maskIban = (iban?: string | null) =>
  iban ? `${iban.slice(0, 6)}••••${iban.slice(-4)}` : "-";

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "BIREYSEL" | "TUZEL">("ALL");

  useEffect(() => {
    apiClient
      .get("/auth/admin/sellers")
      .then((res) => setSellers(res.data?.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    return {
      total: sellers.length,
      bireysel: sellers.filter((s) => s.accountType === "BIREYSEL").length,
      kurumsal: sellers.filter((s) => s.accountType !== "BIREYSEL").length,
      revenue: sellers.reduce((a, s) => a + (s.revenue || 0), 0),
      pendingFeeds: sellers.reduce((a, s) => a + (s.pendingFeeds || 0), 0),
    };
  }, [sellers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return sellers.filter((s) => {
      if (typeFilter !== "ALL" && s.accountType !== typeFilter) return false;
      if (!q) return true;
      return [s.displayName, s.fullName, s.companyName, s.email, s.storeSlug, s.taxNo]
        .filter(Boolean)
        .some((v) => String(v).toLocaleLowerCase("tr").includes(q));
    });
  }, [sellers, query, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Satıcılar</h1>
          <p className="text-sm font-semibold text-slate-500">
            Bireysel / tüzel ayrımı, satış performansı ve XML feed durumu.
          </p>
        </div>
        {stats.pendingFeeds > 0 && (
          <Link
            href="/admin/xml-feeds"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 text-white text-xs font-black hover:bg-amber-600 transition-colors"
          >
            <FileCode2 className="w-4 h-4" />
            {stats.pendingFeeds} XML feed onay bekliyor
          </Link>
        )}
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Toplam Satıcı", value: stats.total, tone: "text-slate-900" },
          { label: "Bireysel", value: stats.bireysel, tone: "text-orange-600" },
          { label: "Tüzel Kişi", value: stats.kurumsal, tone: "text-indigo-600" },
          { label: "Toplam Ciro", value: money(stats.revenue), tone: "text-emerald-600" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-slate-100 px-5 py-4 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{c.label}</p>
            <p className={`mt-1 text-xl font-black ${c.tone}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Arama + tip filtresi */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="İsim, e-posta, mağaza veya vergi no ara..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
          {(["ALL", "BIREYSEL", "TUZEL"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${
                typeFilter === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "ALL" ? "Tümü" : t === "BIREYSEL" ? "Bireysel" : "Tüzel"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-semibold text-sm animate-pulse">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400 font-semibold text-sm">Kayıt bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {[
                    "Satıcı",
                    "Tip",
                    "Vergi / Sözleşme",
                    "Ürün",
                    "Satış",
                    "Ciro",
                    "XML Feed",
                    "IBAN",
                    "Durum",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => {
                  const isBireysel = s.accountType === "BIREYSEL";
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors align-top">
                      <td className="px-5 py-4">
                        <div className="text-sm font-bold text-slate-800">
                          {s.displayName || (isBireysel ? s.fullName : s.companyName) || "-"}
                        </div>
                        <div className="text-xs font-medium text-slate-500">{s.email}</div>
                        {s.storeSlug && (
                          <Link
                            href={`/magaza/${s.storeSlug}`}
                            target="_blank"
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline"
                          >
                            /magaza/{s.storeSlug} <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                            isBireysel ? "bg-orange-50 text-orange-600" : "bg-indigo-50 text-indigo-600"
                          }`}
                        >
                          {isBireysel ? <User className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                          {isBireysel ? "Bireysel" : "Tüzel"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-500">
                        <div>{s.taxNo ? `${s.taxNo} (${s.taxOffice || "-"})` : "-"}</div>
                        <div className={`mt-1 font-bold ${s.acceptedSellerAgreement ? "text-emerald-600" : "text-red-500"}`}>
                          {s.acceptedSellerAgreement ? "Sözleşme onaylı" : "Sözleşme yok"}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm font-black text-slate-800">{s.productCount}</div>
                        <div className="text-[11px] font-semibold text-slate-400">{s.activeProducts} aktif</div>
                      </td>
                      <td className="px-5 py-4 text-sm font-black text-slate-800">{s.totalSales}</td>
                      <td className="px-5 py-4 text-sm font-black text-emerald-600 whitespace-nowrap">
                        {money(s.revenue)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {s.feedCount === 0 ? (
                          <span className="text-xs font-semibold text-slate-400">-</span>
                        ) : (
                          <Link href="/admin/xml-feeds" className="group">
                            <div className="text-sm font-black text-slate-800 group-hover:text-indigo-600">
                              {s.feedCount} feed
                            </div>
                            <div className="text-[11px] font-bold">
                              <span className="text-emerald-600">{s.approvedFeeds} onaylı</span>
                              {s.pendingFeeds > 0 && (
                                <span className="text-amber-600"> · {s.pendingFeeds} beklemede</span>
                              )}
                            </div>
                          </Link>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono font-semibold text-slate-500 whitespace-nowrap">
                        {maskIban(s.payoutIban)}
                      </td>
                      <td className="px-5 py-4">
                        {s.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-red-50 text-red-600 text-[10px] font-black uppercase">
                            Pasif
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
