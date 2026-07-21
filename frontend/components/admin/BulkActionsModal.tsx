"use client";

import React, { useState } from "react";
import { apiClient } from "@/lib/api";
import { CATEGORY_TREE } from "@/lib/categories";
import { Percent, Package, FolderTree, Tag, Receipt, X, Check } from "lucide-react";

type TabId = "fiyat" | "stok" | "kategori" | "durum" | "kdv";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "fiyat", label: "Fiyat", icon: Percent },
  { id: "stok", label: "Stok", icon: Package },
  { id: "kategori", label: "Kategori", icon: FolderTree },
  { id: "durum", label: "Ürün Durumu", icon: Tag },
  { id: "kdv", label: "KDV", icon: Receipt },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onDone: () => void;
}

export const BulkActionsModal: React.FC<Props> = ({ isOpen, onClose, selectedIds, onDone }) => {
  const [tab, setTab] = useState<TabId>("fiyat");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Fiyat
  const [priceOp, setPriceOp] = useState("PERCENTAGE_DISCOUNT");
  const [priceVal, setPriceVal] = useState("10");
  // Stok
  const [stockOp, setStockOp] = useState<"SET" | "INCREASE" | "DECREASE">("SET");
  const [stockVal, setStockVal] = useState("10");
  // Kategori
  const [category, setCategory] = useState("");
  // Durum
  const [listingType, setListingType] = useState("");
  const [condition, setCondition] = useState("");
  // KDV
  const [vat, setVat] = useState("20");

  if (!isOpen) return null;

  const run = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: okText });
      onDone();
      setTimeout(() => { setMsg(null); onClose(); }, 1200);
    } catch (e: any) {
      setMsg({ ok: false, text: e?.response?.data?.message || "İşlem başarısız" });
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    const productIds = selectedIds;
    if (tab === "fiyat") {
      return run(
        () => apiClient.patch("/products/admin/products/bulk/price", { productIds, operation: priceOp, value: Number(priceVal) }),
        `${productIds.length} üründe fiyat güncellendi`
      );
    }
    if (tab === "stok") {
      return run(
        () => apiClient.patch("/products/admin/products/bulk/stock", { productIds, operation: stockOp, value: Number(stockVal) }),
        `${productIds.length} üründe stok güncellendi`
      );
    }
    if (tab === "kategori") {
      if (!category) { setMsg({ ok: false, text: "Kategori seçin" }); return; }
      return run(
        () => apiClient.patch("/products/admin/products/bulk/category", { productIds, categoryName: category }),
        `${productIds.length} ürün "${category}" kategorisine taşındı`
      );
    }
    if (tab === "durum") {
      if (!listingType && !condition) { setMsg({ ok: false, text: "En az bir alan seçin" }); return; }
      return run(
        () => apiClient.patch("/products/admin/products/bulk/condition", {
          productIds,
          ...(condition ? { condition } : {}),
          ...(listingType ? { listingType } : {}),
        }),
        `${productIds.length} üründe durum güncellendi`
      );
    }
    return run(
      () => apiClient.patch("/products/admin/products/bulk/vat", { productIds, vatRate: Number(vat) }),
      `${productIds.length} üründe KDV %${vat} yapıldı`
    );
  };

  const radio = (checked: boolean, onSel: () => void, label: string) => (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-[#ff6000]">
      <input type="radio" checked={checked} onChange={onSel} className="accent-[#ff6000]" />
      {label}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-black text-slate-800">Toplu İşlemler</h3>
            <p className="text-xs font-semibold text-slate-400">{selectedIds.length} ürün seçildi</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setMsg(null); }}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black transition-colors ${
                  tab === t.id ? "bg-[#ff6000] text-white" : "text-slate-500 hover:bg-slate-50"
                }`}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {tab === "fiyat" && (
            <div className="space-y-2">
              {radio(priceOp === "PERCENTAGE_DISCOUNT", () => setPriceOp("PERCENTAGE_DISCOUNT"), "% İndirim yap")}
              {radio(priceOp === "FIXED_DISCOUNT", () => setPriceOp("FIXED_DISCOUNT"), "Sabit tutar indir (TL)")}
              {radio(priceOp === "PERCENTAGE_INCREASE", () => setPriceOp("PERCENTAGE_INCREASE"), "% Zam yap")}
              {radio(priceOp === "FIXED_INCREASE", () => setPriceOp("FIXED_INCREASE"), "Sabit tutar artır (TL)")}
              <input type="number" min={0} value={priceVal} onChange={(e) => setPriceVal(e.target.value)}
                placeholder="Değer"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]" />
              <p className="text-[11px] font-semibold text-slate-400">
                Örn: %{priceVal || 0} indirim → 1.000 TL ürün {Math.round(1000 * (1 - Number(priceVal || 0) / 100))} TL olur.
              </p>
            </div>
          )}

          {tab === "stok" && (
            <div className="space-y-2">
              {radio(stockOp === "SET", () => setStockOp("SET"), "Stoğu şu değere sabitle")}
              {radio(stockOp === "INCREASE", () => setStockOp("INCREASE"), "Stoğu artır")}
              {radio(stockOp === "DECREASE", () => setStockOp("DECREASE"), "Stoğu azalt")}
              <input type="number" min={0} value={stockVal} onChange={(e) => setStockVal(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]" />
            </div>
          )}

          {tab === "kategori" && (
            <div>
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">Yeni Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]">
                <option value="">Seçiniz</option>
                {CATEGORY_TREE.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <p className="mt-2 text-[11px] font-semibold text-slate-400">Seçili ürünlerin ana kategorisi değişir.</p>
            </div>
          )}

          {tab === "durum" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase text-slate-500">İlan Tipi</label>
                <div className="grid grid-cols-3 gap-2">
                  {[["", "Değiştirme"], ["KURUMSAL", "Kurumsal"], ["BIREYSEL", "Bireysel"]].map(([v, l]) => (
                    <button key={v} onClick={() => setListingType(v)}
                      className={`rounded-lg border px-2 py-2 text-xs font-black ${listingType === v ? "border-[#ff6000] bg-[#ff6000]/5 text-[#ff6000]" : "border-slate-200 text-slate-500"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase text-slate-500">Ürün Durumu</label>
                <div className="grid grid-cols-4 gap-2">
                  {[["", "Değiştirme"], ["SIFIR", "Sıfır"], ["AZ_KULLANILMIS", "Az Kull."], ["IKINCI_EL", "İkinci El"]].map(([v, l]) => (
                    <button key={v} onClick={() => setCondition(v)}
                      className={`rounded-lg border px-2 py-2 text-[11px] font-black ${condition === v ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"}`}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "kdv" && (
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase text-slate-500">KDV Oranı</label>
              <div className="grid grid-cols-3 gap-2">
                {["1", "10", "20"].map((v) => (
                  <button key={v} onClick={() => setVat(v)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-black ${vat === v ? "border-[#ff6000] bg-[#ff6000]/5 text-[#ff6000]" : "border-slate-200 text-slate-500"}`}>%{v}</button>
                ))}
              </div>
            </div>
          )}

          {msg && (
            <div className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              {msg.ok && <Check size={15} />} {msg.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={apply} disabled={busy || selectedIds.length === 0}
            className="flex-1 rounded-lg bg-[#ff6000] py-2.5 text-sm font-black text-white disabled:opacity-60">
            {busy ? "Uygulanıyor…" : `${selectedIds.length} Ürüne Uygula`}
          </button>
          <button onClick={onClose} disabled={busy}
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
