"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api";

type Tab = "price" | "stock" | "category" | "visibility";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Seçili XML ürünlerinin barkodları (kural barkodla eşleşir) */
  barcodes: string[];
  selectedCount: number;
  onApplied: () => void;
}

const PRICE_MODES = [
  { id: "PERCENT_DISCOUNT", label: "% İndirim yap", hint: "%10 indirim → 1.000 TL ürün 900 TL olur." },
  { id: "AMOUNT_DISCOUNT", label: "Sabit tutar indir (TL)", hint: "50 TL → 1.000 TL ürün 950 TL olur." },
  { id: "PERCENT_INCREASE", label: "% Kâr marjı ekle", hint: "%20 → 1.000 TL ürün 1.200 TL olur." },
  { id: "AMOUNT_INCREASE", label: "Sabit tutar ekle (TL)", hint: "50 TL → 1.000 TL ürün 1.050 TL olur." },
];

const STOCK_MODES = [
  { id: "SET", label: "Stoğu şuna eşitle" },
  { id: "INCREASE", label: "Stoğu artır" },
  { id: "DECREASE", label: "Stoğu azalt" },
];

/**
 * XML kataloğundan gelen ürünler için toplu işlem.
 * Envanter ürünlerinden farkı: burada yapılan değişiklik bir KURAL olarak
 * saklanır ve feed her senkronlandığında yeniden uygulanır.
 */
export function XmlBulkActionsModal({ isOpen, onClose, barcodes, selectedCount, onApplied }: Props) {
  const [tab, setTab] = useState<Tab>("price");
  const [priceMode, setPriceMode] = useState(PRICE_MODES[0].id);
  const [priceValue, setPriceValue] = useState("");
  const [stockMode, setStockMode] = useState(STOCK_MODES[0].id);
  const [stockValue, setStockValue] = useState("");
  const [categoryPath, setCategoryPath] = useState("");
  const [hidden, setHidden] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!isOpen) return null;

  const send = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await apiClient.post("/products/admin/xml/catalog/bulk", { barcodes, ...payload });
      setMsg({ ok: true, text: res.data?.message || "Uygulandı." });
      onApplied();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({ ok: false, text: e.response?.data?.message || "İşlem başarısız." });
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    if (tab === "price") {
      const v = Number(priceValue);
      if (!v || v <= 0) return setMsg({ ok: false, text: "Geçerli bir değer girin." });
      return send({ priceMode, priceValue: v });
    }
    if (tab === "stock") {
      const v = Number(stockValue);
      if (Number.isNaN(v) || v < 0) return setMsg({ ok: false, text: "Geçerli bir stok değeri girin." });
      return send({ stockMode, stockValue: v });
    }
    if (tab === "category") {
      if (!categoryPath.trim()) return setMsg({ ok: false, text: "Kategori yazın." });
      return send({ categoryPath: categoryPath.trim() });
    }
    return send({ isHidden: hidden });
  };

  const activeHint = PRICE_MODES.find((m) => m.id === priceMode)?.hint;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-black text-slate-900">XML Ürünlerinde Toplu İşlem</h3>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            {selectedCount} ürün seçildi · Kural, feed her güncellendiğinde otomatik uygulanır
          </p>
        </div>

        <div className="flex gap-1 border-b border-slate-100 px-4">
          {(
            [
              ["price", "Fiyat"],
              ["stock", "Stok"],
              ["category", "Kategori"],
              ["visibility", "Görünürlük"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setMsg(null);
              }}
              className={`border-b-2 px-3 py-2.5 text-xs font-black transition-colors ${
                tab === id ? "border-[#ff5000] text-[#ff5000]" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3 px-6 py-5">
          {tab === "price" && (
            <>
              <select
                value={priceMode}
                onChange={(e) => setPriceMode(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#ff5000]"
              >
                {PRICE_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                placeholder="Değer"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#ff5000]"
              />
              <p className="text-[11px] font-semibold text-slate-400">{activeHint}</p>
            </>
          )}

          {tab === "stock" && (
            <>
              <select
                value={stockMode}
                onChange={(e) => setStockMode(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#ff5000]"
              >
                {STOCK_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
                placeholder="Adet"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#ff5000]"
              />
              <p className="text-[11px] font-semibold text-slate-400">
                XML&apos;den gelen stok yerine bu kural geçerli olur.
              </p>
            </>
          )}

          {tab === "category" && (
            <>
              <input
                value={categoryPath}
                onChange={(e) => setCategoryPath(e.target.value)}
                placeholder="Örn: Elektronik > Cep Telefonu"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#ff5000]"
              />
              <p className="text-[11px] font-semibold text-slate-400">
                XML&apos;deki kategori adı yanlış geliyorsa buradan düzeltebilirsiniz.
              </p>
            </>
          )}

          {tab === "visibility" && (
            <>
              <select
                value={hidden ? "hide" : "show"}
                onChange={(e) => setHidden(e.target.value === "hide")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#ff5000]"
              >
                <option value="hide">Yayından kaldır (stok 0)</option>
                <option value="show">Tekrar yayına al</option>
              </select>
              <p className="text-[11px] font-semibold text-slate-400">
                Yayından kaldırılan ürünler mağazada satılamaz; feed güncellense de kapalı kalır.
              </p>
            </>
          )}

          {msg && (
            <p className={`text-xs font-black ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            onClick={() => send({ reset: true })}
            disabled={busy}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-slate-400 disabled:opacity-50"
          >
            Kuralları Sıfırla
          </button>
          <button
            onClick={apply}
            disabled={busy}
            className="ml-auto rounded-lg bg-[#ff5000] px-5 py-2.5 text-xs font-black text-white hover:bg-[#e04800] disabled:opacity-50"
          >
            {busy ? "Uygulanıyor…" : `${selectedCount} Ürüne Uygula`}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
