"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { Search, Store, User, ExternalLink, FileCode2, ShieldCheck, X, Check, Loader2 } from "lucide-react";

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
  onboardingStatus?: string;
  onboardingNote?: string | null;
  onboardingSubmittedAt?: string | null;
  mersisNo?: string | null;
  authorizedName?: string | null;
};

type SellerDossier = {
  id: string;
  email: string;
  accountType: string;
  companyName?: string | null;
  fullName?: string | null;
  taxNo?: string | null;
  taxOffice?: string | null;
  mersisNo?: string | null;
  tradeRegistryNo?: string | null;
  authorizedName?: string | null;
  kepAddress?: string | null;
  onboardingStatus?: string;
  onboardingNote?: string | null;
  onboardingSubmittedAt?: string | null;
  acceptedContracts?: Array<{ key: string; title: string; version: string; acceptedAt: string }>;
  documents?: Record<string, string>;
};

const ONBOARDING_BADGE: Record<string, { label: string; cls: string }> = {
  CONTRACTS_PENDING: { label: "Sözleşme eksik", cls: "bg-amber-50 text-amber-600" },
  REVIEW_PENDING: { label: "Onay bekliyor", cls: "bg-blue-50 text-blue-600" },
  APPROVED: { label: "Onaylı", cls: "bg-emerald-50 text-emerald-600" },
  REJECTED: { label: "Reddedildi", cls: "bg-red-50 text-red-600" },
};

const DOC_LABELS: Record<string, string> = {
  vergiLevhasi: "Vergi Levhası",
  imzaSirkuleri: "İmza Sirküleri",
  ticaretSicilGazetesi: "Ticaret Sicil Gazetesi",
  yetkiliKimlik: "Yetkili Kimlik Belgesi",
  faaliyetBelgesi: "Faaliyet Belgesi",
  kimlik: "Kimlik Belgesi",
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

  const [dossier, setDossier] = useState<SellerDossier | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [acting, setActing] = useState(false);

  const load = () =>
    apiClient
      .get("/auth/admin/sellers")
      .then((res) => setSellers(res.data?.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const openDossier = async (id: string) => {
    setDossierLoading(true);
    setDossier(null);
    try {
      const res = await apiClient.get(`/auth/admin/sellers/${id}/documents`);
      setDossier(res.data?.data);
      setReviewNote(res.data?.data?.onboardingNote || "");
    } catch (err) {
      console.error(err);
    } finally {
      setDossierLoading(false);
    }
  };

  const review = async (action: "APPROVE" | "REJECT") => {
    if (!dossier) return;
    if (action === "REJECT" && !reviewNote.trim()) {
      alert("Red gerekçesi yazın; satıcı bu notu görecek.");
      return;
    }
    setActing(true);
    try {
      await apiClient.post(`/auth/admin/sellers/${dossier.id}/review`, {
        action,
        note: reviewNote.trim() || undefined,
      });
      setDossier(null);
      await load();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || "İşlem başarısız");
    } finally {
      setActing(false);
    }
  };

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
                    "Onay Durumu",
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
                      <td className="px-5 py-4">
                        {(() => {
                          const st = s.onboardingStatus || "APPROVED";
                          const badge = ONBOARDING_BADGE[st] || ONBOARDING_BADGE.APPROVED;
                          return (
                            <button
                              onClick={() => openDossier(s.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase hover:ring-2 hover:ring-slate-200 transition ${badge.cls}`}
                            >
                              <ShieldCheck className="w-3 h-3" />
                              {badge.label}
                            </button>
                          );
                        })()}
                        <div className="mt-1 text-[10px] font-bold text-slate-400">Evrakları incele →</div>
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

      {/* Satıcı evrak dosyası + onay/red */}
      {(dossier || dossierLoading) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {dossierLoading || !dossier ? (
              <div className="py-24 text-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500">Evraklar yükleniyor...</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      {dossier.companyName || dossier.fullName || dossier.email}
                    </h2>
                    <p className="text-xs font-semibold text-slate-500">
                      {dossier.email} ·{" "}
                      {dossier.accountType === "BIREYSEL" ? "Bireysel satıcı" : "Tüzel kişi satıcı"}
                    </p>
                  </div>
                  <button
                    onClick={() => setDossier(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      ["Vergi No (VKN)", dossier.taxNo],
                      ["Vergi Dairesi", dossier.taxOffice],
                      ["MERSİS No", dossier.mersisNo],
                      ["Ticaret Sicil No", dossier.tradeRegistryNo],
                      ["İmza Yetkilisi", dossier.authorizedName],
                      ["KEP Adresi", dossier.kepAddress],
                    ]
                      .filter(([, v]) => v)
                      .map(([label, value]) => (
                        <div key={label as string} className="bg-slate-50 rounded-2xl px-4 py-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
                        </div>
                      ))}
                  </div>

                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                      Onaylanan Sözleşmeler ({dossier.acceptedContracts?.length || 0})
                    </h3>
                    {dossier.acceptedContracts?.length ? (
                      <div className="space-y-1.5">
                        {dossier.acceptedContracts.map((c) => (
                          <div
                            key={c.key}
                            className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-2.5"
                          >
                            <span className="text-xs font-black text-slate-800">{c.title || c.key}</span>
                            <span className="text-[10px] font-bold text-slate-500 shrink-0">
                              v{c.version} · {new Date(c.acceptedAt).toLocaleString("tr-TR")}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-slate-400">Henüz sözleşme onayı yok.</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                      Yüklenen Belgeler ({Object.keys(dossier.documents || {}).length})
                    </h3>
                    {Object.keys(dossier.documents || {}).length ? (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {Object.entries(dossier.documents || {}).map(([key, dataUrl]) => {
                          const isPdf = dataUrl.startsWith("data:application/pdf");
                          return (
                            <div key={key} className="rounded-2xl border border-slate-200 overflow-hidden">
                              <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-between gap-2">
                                <span className="text-xs font-black text-slate-700">{DOC_LABELS[key] || key}</span>
                                <a
                                  href={dataUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-black text-indigo-600 hover:underline shrink-0"
                                >
                                  BÜYÜT
                                </a>
                              </div>
                              {isPdf ? (
                                <object data={dataUrl} type="application/pdf" className="w-full h-56 bg-slate-100">
                                  <p className="p-4 text-xs font-semibold text-slate-500">
                                    PDF önizlenemedi, &quot;Büyüt&quot; ile açın.
                                  </p>
                                </object>
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={dataUrl} alt={key} className="w-full h-56 object-contain bg-slate-100" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-slate-400">Henüz belge yüklenmemiş.</p>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center gap-3">
                  <input
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Not / red gerekçesi (satıcı görecek)"
                    className="flex-1 min-w-[220px] px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    disabled={acting}
                    onClick={() => review("REJECT")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-red-200 text-red-600 text-xs font-black hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Reddet
                  </button>
                  <button
                    disabled={acting}
                    onClick={() => review("APPROVE")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Onayla ve Paneli Aç
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
