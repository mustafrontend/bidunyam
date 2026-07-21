"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiClient } from "@/lib/api";
import {
  FileCode2,
  Eye,
  Check,
  X,
  Loader2,
  RefreshCw,
  User,
  Store,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

type FeedSeller = {
  id: string;
  email: string;
  accountType: string;
  displayName: string;
  storeSlug: string | null;
};

type Feed = {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  syncInterval: number;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  seller: FeedSeller;
};

type PreviewRow = {
  urunAdi: string;
  barkodno: string;
  kategori: string;
  altKategori: string;
  marka: string;
  fiyat: number;
  listeFiyati: number;
  stok: number;
  resim: string;
};

type Preview = {
  totalProducts: number;
  validProducts: number;
  invalidProducts: number;
  preview: PreviewRow[];
  rawProduct: Record<string, unknown>;
};

const STATUS_META: Record<Feed["approvalStatus"], { label: string; cls: string }> = {
  PENDING: { label: "Onay Bekliyor", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  APPROVED: { label: "Onaylı", cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  REJECTED: { label: "Reddedildi", cls: "bg-red-50 text-red-600 border-red-200" },
};

const money = (n: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n || 0);

const dt = (v: string | null) => (v ? new Date(v).toLocaleString("tr-TR") : "-");

export default function AdminXmlFeedsPage() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");

  const [openFeed, setOpenFeed] = useState<Feed | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/products/admin/xml/feeds/all");
      setFeeds(res.data?.feeds || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      PENDING: feeds.filter((f) => f.approvalStatus === "PENDING").length,
      APPROVED: feeds.filter((f) => f.approvalStatus === "APPROVED").length,
      REJECTED: feeds.filter((f) => f.approvalStatus === "REJECTED").length,
      ALL: feeds.length,
    }),
    [feeds]
  );

  const visible = tab === "ALL" ? feeds : feeds.filter((f) => f.approvalStatus === tab);

  const openPreview = async (feed: Feed) => {
    setOpenFeed(feed);
    setPreview(null);
    setPreviewError(null);
    setNote(feed.reviewNote || "");
    setPreviewLoading(true);
    try {
      const res = await apiClient.get(`/products/admin/xml/feeds/${feed.id}/preview`);
      setPreview(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      setPreviewError(e.response?.data?.error || e.response?.data?.message || "Feed önizlenemedi");
    } finally {
      setPreviewLoading(false);
    }
  };

  const review = async (action: "APPROVE" | "REJECT") => {
    if (!openFeed) return;
    if (action === "REJECT" && !note.trim()) {
      alert("Reddetme gerekçesi yazın; satıcı bu notu görecek.");
      return;
    }
    setActing(true);
    try {
      await apiClient.post(`/products/admin/xml/feeds/${openFeed.id}/review`, {
        action,
        note: note.trim() || undefined,
      });
      setOpenFeed(null);
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || "İşlem başarısız");
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">XML Feed Onayları</h1>
          <p className="text-sm font-semibold text-slate-500">
            Satıcıların eklediği XML kaynakları burada onaya düşer. Yalnızca onaylanan feed&apos;ler senkronize edilir.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Yenile
        </button>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "ALL" ? "Tümü" : STATUS_META[t].label} ({counts[t]})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-semibold text-sm animate-pulse">Yükleniyor...</div>
        ) : visible.length === 0 ? (
          <div className="p-12 text-center">
            <FileCode2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">Bu durumda feed yok.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((f) => (
              <div key={f.id} className="p-5 flex flex-wrap items-start gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex-1 min-w-[260px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-slate-900">{f.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase ${
                        STATUS_META[f.approvalStatus].cls
                      }`}
                    >
                      {STATUS_META[f.approvalStatus].label}
                    </span>
                    {!f.isActive && (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase">
                        Pasif
                      </span>
                    )}
                  </div>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline break-all"
                  >
                    {f.url.length > 90 ? `${f.url.slice(0, 90)}...` : f.url}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  <div className="mt-2 text-[11px] font-semibold text-slate-400">
                    Eklendi: {dt(f.createdAt)} · Sıklık: {f.syncInterval} dk · Son sync: {dt(f.lastSyncAt)}
                  </div>
                  {f.lastSyncStatus && (
                    <div
                      className={`mt-1 text-[11px] font-bold ${
                        f.lastSyncStatus.startsWith("SUCCESS") ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {f.lastSyncStatus}
                    </div>
                  )}
                  {f.reviewNote && (
                    <div className="mt-1 text-[11px] font-bold text-red-500">Not: {f.reviewNote}</div>
                  )}
                </div>

                <div className="min-w-[180px]">
                  <div className="flex items-center gap-1.5">
                    {f.seller.accountType === "BIREYSEL" ? (
                      <User className="w-3.5 h-3.5 text-orange-500" />
                    ) : (
                      <Store className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                    <span className="text-xs font-black text-slate-800">{f.seller.displayName}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400">{f.seller.email}</div>
                  <span
                    className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      f.seller.accountType === "BIREYSEL"
                        ? "bg-orange-50 text-orange-600"
                        : "bg-indigo-50 text-indigo-600"
                    }`}
                  >
                    {f.seller.accountType === "BIREYSEL"
                      ? "Bireysel"
                      : f.seller.accountType === "ADMIN"
                        ? "Admin"
                        : "Tüzel"}
                  </span>
                </div>

                <button
                  onClick={() => openPreview(f)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-colors"
                >
                  <Eye className="w-4 h-4" /> Önizle & İncele
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Önizleme + onay modalı */}
      {openFeed && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">{openFeed.name}</h2>
                <p className="text-xs font-semibold text-slate-500 break-all">{openFeed.url}</p>
                <p className="mt-1 text-xs font-bold text-slate-600">
                  Satıcı: {openFeed.seller.displayName} ({openFeed.seller.email})
                </p>
              </div>
              <button
                onClick={() => setOpenFeed(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {previewLoading ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">XML indiriliyor ve ayrıştırılıyor...</p>
                </div>
              ) : previewError ? (
                <div className="p-5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-red-700">Feed okunamadı</p>
                    <p className="text-xs font-semibold text-red-600 mt-1">{previewError}</p>
                  </div>
                </div>
              ) : preview ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Toplam Ürün", value: preview.totalProducts, tone: "text-slate-900" },
                      { label: "Geçerli", value: preview.validProducts, tone: "text-emerald-600" },
                      { label: "Hatalı", value: preview.invalidProducts, tone: "text-red-500" },
                    ].map((c) => (
                      <div key={c.label} className="bg-slate-50 rounded-2xl px-5 py-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{c.label}</p>
                        <p className={`mt-1 text-xl font-black ${c.tone}`}>{c.value}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                      İlk {preview.preview.length} ürün önizlemesi
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            {["Görsel", "Ürün Adı", "Barkod", "Kategori", "Marka", "Fiyat", "Liste", "Stok"].map(
                              (h) => (
                                <th
                                  key={h}
                                  className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap"
                                >
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {preview.preview.map((p, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5">
                                {p.resim ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={p.resim}
                                    alt=""
                                    className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-slate-100" />
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-xs font-bold text-slate-800 max-w-[240px] truncate">
                                {p.urunAdi}
                              </td>
                              <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{p.barkodno}</td>
                              <td className="px-4 py-2.5 text-xs font-semibold text-slate-600 whitespace-nowrap">
                                {p.kategori}
                                {p.altKategori && p.altKategori !== "N/A" ? ` › ${p.altKategori}` : ""}
                              </td>
                              <td className="px-4 py-2.5 text-xs font-semibold text-slate-600">{p.marka}</td>
                              <td className="px-4 py-2.5 text-xs font-black text-slate-900 whitespace-nowrap">
                                {money(p.fiyat)}
                              </td>
                              <td className="px-4 py-2.5 text-xs font-semibold text-slate-400 whitespace-nowrap">
                                {p.listeFiyati ? money(p.listeFiyati) : "-"}
                              </td>
                              <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{p.stok}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <details className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <summary className="text-xs font-black text-slate-500 cursor-pointer">
                      Ham XML alanları (ilk kayıt)
                    </summary>
                    <pre className="mt-3 text-[11px] font-mono text-slate-600 overflow-x-auto max-h-64">
                      {JSON.stringify(preview.rawProduct, null, 2)}
                    </pre>
                  </details>
                </>
              ) : null}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center gap-3">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
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
                disabled={acting || !!previewError}
                onClick={() => review("APPROVE")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Onayla ve Senkronize Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
