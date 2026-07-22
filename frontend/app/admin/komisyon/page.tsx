"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { Percent, Truck, Settings2, Plus, Trash2, Save, Loader2, Calculator } from "lucide-react";

interface Commission {
  categoryName: string;
  rate: number;
  bireyselRate: number | null;
  isActive: boolean;
}

interface Shipping {
  label: string;
  minDesi: number;
  maxDesi: number;
  price: number;
  isActive: boolean;
}

interface Settings {
  freeShippingLimit: number;
  perDesiPrice: number;
  payoutHoldDays: number;
  serviceFeeRate: number;
  transactionFee: number;
}

interface Quote {
  gross: number;
  commissionTotal: number;
  serviceFee: number;
  transactionFee: number;
  shippingCost: number;
  freeShippingApplied: boolean;
  sellerPayout: number;
  buyerTotal: number;
  lines: Array<{ categoryName: string; commissionRate: number }>;
}

const TL = (n: number) =>
  Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL";

export default function AdminPricingPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [shipping, setShipping] = useState<Shipping[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Canlı hesap makinesi
  const [simPrice, setSimPrice] = useState("1000");
  const [simCategory, setSimCategory] = useState("Elektronik");
  const [simDesi, setSimDesi] = useState("2");
  const [simType, setSimType] = useState("KURUMSAL");
  const [quote, setQuote] = useState<Quote | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/products/pricing/rates");
      const d = res.data?.data;
      setCommissions(d?.commissions || []);
      setShipping(d?.shipping || []);
      setSettings(d?.settings || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runQuote = useCallback(async () => {
    try {
      const res = await apiClient.post("/products/pricing/quote", {
        items: [
          {
            price: Number(simPrice) || 0,
            quantity: 1,
            categoryPath: simCategory,
            listingType: simType,
            desi: Number(simDesi) || 1,
          },
        ],
      });
      setQuote(res.data?.data);
    } catch {
      setQuote(null);
    }
  }, [simPrice, simCategory, simDesi, simType]);

  useEffect(() => {
    const t = setTimeout(runQuote, 400);
    return () => clearTimeout(t);
  }, [runQuote]);

  const save = async (what: "commissions" | "shipping" | "settings") => {
    setSaving(what);
    setMsg(null);
    try {
      const body =
        what === "commissions" ? { rows: commissions } : what === "shipping" ? { rows: shipping } : settings;
      const res = await apiClient.put(`/products/admin/pricing/${what}`, body);
      setMsg({ ok: true, text: res.data?.message || "Kaydedildi." });
      await load();
      await runQuote();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setMsg({ ok: false, text: e.response?.data?.message || "Kaydedilemedi." });
    } finally {
      setSaving(null);
    }
  };

  const removeCommission = async (categoryName: string) => {
    if (categoryName === "*") return;
    if (!confirm(`"${categoryName}" komisyon kuralı silinsin mi?`)) return;
    try {
      await apiClient.delete(`/products/admin/pricing/commissions/${encodeURIComponent(categoryName)}`);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm font-semibold text-slate-400 animate-pulse">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Komisyon & Kargo Tarifesi</h1>
        <p className="text-sm font-semibold text-slate-500">
          Platform kâr oranları ve kargo ücretleri. Değişiklik anında yürürlüğe girer; geçmiş siparişler etkilenmez.
        </p>
      </div>

      {msg && (
        <div
          className={`rounded-2xl px-5 py-3 text-sm font-black ${
            msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Komisyon oranları */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-black text-slate-800">
                <Percent className="h-4 w-4 text-indigo-500" /> Kategori Bazlı Komisyon
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCommissions((p) => [...p, { categoryName: "", rate: 12, bireyselRate: 8, isActive: true }])
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:border-slate-400"
                >
                  <Plus className="h-3.5 w-3.5" /> Kategori Ekle
                </button>
                <button
                  onClick={() => save("commissions")}
                  disabled={saving === "commissions"}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving === "commissions" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Kaydet
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Kategori", "Kurumsal %", "Bireysel %", "Aktif", ""].map((h) => (
                      <th key={h} className="px-2 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {commissions.map((c, i) => {
                    const isDefault = c.categoryName === "*";
                    return (
                      <tr key={`${c.categoryName}-${i}`}>
                        <td className="px-2 py-2">
                          <input
                            value={isDefault ? "Varsayılan (tüm kategoriler)" : c.categoryName}
                            disabled={isDefault}
                            onChange={(e) =>
                              setCommissions((p) =>
                                p.map((x, j) => (j === i ? { ...x, categoryName: e.target.value } : x))
                              )
                            }
                            placeholder="Kategori adı"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 disabled:bg-slate-50 disabled:text-slate-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={c.rate}
                            onChange={(e) =>
                              setCommissions((p) =>
                                p.map((x, j) => (j === i ? { ...x, rate: Number(e.target.value) } : x))
                              )
                            }
                            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-800 outline-none focus:border-indigo-400"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={c.bireyselRate ?? ""}
                            placeholder="—"
                            onChange={(e) =>
                              setCommissions((p) =>
                                p.map((x, j) =>
                                  j === i
                                    ? { ...x, bireyselRate: e.target.value === "" ? null : Number(e.target.value) }
                                    : x
                                )
                              )
                            }
                            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-orange-600 outline-none focus:border-orange-400"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={c.isActive}
                            onChange={(e) =>
                              setCommissions((p) =>
                                p.map((x, j) => (j === i ? { ...x, isActive: e.target.checked } : x))
                              )
                            }
                            className="h-4 w-4 accent-indigo-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          {!isDefault && (
                            <button
                              onClick={() => removeCommission(c.categoryName)}
                              className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] font-semibold text-slate-400">
              Bireysel oran boş bırakılırsa o kategoride bireysel satıcıya da kurumsal oran uygulanır.
              Kategori eşleşmezse &quot;Varsayılan&quot; satırı geçerlidir.
            </p>
          </section>

          {/* Kargo tarifesi */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-black text-slate-800">
                <Truck className="h-4 w-4 text-emerald-500" /> Desi Bazlı Kargo Tarifesi
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const last = shipping[shipping.length - 1];
                    const min = last ? last.maxDesi : 0;
                    setShipping((p) => [
                      ...p,
                      { label: `${min} - ${min + 5} Desi`, minDesi: min, maxDesi: min + 5, price: 0, isActive: true },
                    ]);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:border-slate-400"
                >
                  <Plus className="h-3.5 w-3.5" /> Kademe Ekle
                </button>
                <button
                  onClick={() => save("shipping")}
                  disabled={saving === "shipping"}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving === "shipping" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Kaydet
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {shipping.map((s, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 p-2.5">
                  <input
                    value={s.label}
                    onChange={(e) => setShipping((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    placeholder="Kademe adı"
                    className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-400"
                  />
                  <span className="text-[10px] font-black text-slate-400">DESİ</span>
                  <input
                    type="number"
                    step="0.5"
                    value={s.minDesi}
                    onChange={(e) => setShipping((p) => p.map((x, j) => (j === i ? { ...x, minDesi: Number(e.target.value) } : x)))}
                    className="w-20 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-black outline-none focus:border-emerald-400"
                  />
                  <span className="text-slate-300">—</span>
                  <input
                    type="number"
                    step="0.5"
                    value={s.maxDesi}
                    onChange={(e) => setShipping((p) => p.map((x, j) => (j === i ? { ...x, maxDesi: Number(e.target.value) } : x)))}
                    className="w-20 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-black outline-none focus:border-emerald-400"
                  />
                  <span className="ml-auto text-[10px] font-black text-slate-400">ÜCRET</span>
                  <input
                    type="number"
                    step="0.1"
                    value={s.price}
                    onChange={(e) => setShipping((p) => p.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)))}
                    className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-emerald-600 outline-none focus:border-emerald-400"
                  />
                  <button
                    onClick={() => setShipping((p) => p.filter((_, j) => j !== i))}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] font-semibold text-slate-400">
              Tarifenin üstünde kalan gönderilerde: son kademe ücreti + aşan desi × desi başı ücret uygulanır.
            </p>
          </section>

          {/* Genel ayarlar */}
          {settings && (
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <Settings2 className="h-4 w-4 text-amber-500" /> Genel Ayarlar
                </h2>
                <button
                  onClick={() => save("settings")}
                  disabled={saving === "settings"}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving === "settings" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Kaydet
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(
                  [
                    ["freeShippingLimit", "Ücretsiz Kargo Limiti (TL)", "0 yazarsanız kapalı"],
                    ["perDesiPrice", "Desi Başı Ücret (TL)", "Tarife dışı ağır gönderiler"],
                    ["payoutHoldDays", "Hakediş Bekleme (gün)", "Teslimat sonrası"],
                    ["serviceFeeRate", "Hizmet Bedeli (%)", "Komisyona ek"],
                    ["transactionFee", "İşlem Bedeli (TL)", "Sipariş başına sabit"],
                  ] as [keyof Settings, string, string][]
                ).map(([key, label, hint]) => (
                  <div key={key}>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={settings[key]}
                      onChange={(e) => setSettings({ ...settings, [key]: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-800 outline-none focus:border-amber-400"
                    />
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">{hint}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Canlı hesap makinesi */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-slate-800">
              <Calculator className="h-4 w-4 text-slate-500" /> Canlı Hesap
            </h2>
            <div className="space-y-2.5">
              <input
                value={simCategory}
                onChange={(e) => setSimCategory(e.target.value)}
                placeholder="Kategori"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold outline-none focus:border-indigo-400"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={simPrice}
                  onChange={(e) => setSimPrice(e.target.value)}
                  placeholder="Fiyat"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold outline-none focus:border-indigo-400"
                />
                <input
                  type="number"
                  step="0.5"
                  value={simDesi}
                  onChange={(e) => setSimDesi(e.target.value)}
                  placeholder="Desi"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold outline-none focus:border-indigo-400"
                />
              </div>
              <select
                value={simType}
                onChange={(e) => setSimType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold outline-none focus:border-indigo-400"
              >
                <option value="KURUMSAL">Tüzel satıcı</option>
                <option value="BIREYSEL">Bireysel satıcı</option>
              </select>
            </div>

            {quote && (
              <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-xs">
                {[
                  ["Ürün bedeli", TL(quote.gross), "text-slate-700"],
                  [`Komisyon (%${quote.lines[0]?.commissionRate ?? 0})`, `− ${TL(quote.commissionTotal)}`, "text-red-500"],
                  ...(quote.serviceFee > 0
                    ? [["Hizmet bedeli", `− ${TL(quote.serviceFee)}`, "text-red-500"] as [string, string, string]]
                    : []),
                  ...(quote.transactionFee > 0
                    ? [["İşlem bedeli", `− ${TL(quote.transactionFee)}`, "text-red-500"] as [string, string, string]]
                    : []),
                  [
                    quote.freeShippingApplied ? "Kargo (ücretsiz)" : "Kargo",
                    quote.shippingCost > 0 ? `− ${TL(quote.shippingCost)}` : "0,00 TL",
                    quote.freeShippingApplied ? "text-emerald-600" : "text-red-500",
                  ],
                ].map(([label, value, cls]) => (
                  <div key={label as string} className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">{label}</span>
                    <span className={`font-black ${cls}`}>{value}</span>
                  </div>
                ))}
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <span className="font-black text-slate-700">Satıcı hakedişi</span>
                  <span className="text-sm font-black text-emerald-600">{TL(quote.sellerPayout)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-700">Alıcı öder</span>
                  <span className="text-sm font-black text-slate-900">{TL(quote.buyerTotal)}</span>
                </div>
                <div className="mt-2 rounded-xl bg-indigo-50 px-3 py-2">
                  <span className="text-[11px] font-black text-indigo-700">
                    Platform kârı: {TL(quote.commissionTotal + quote.serviceFee + quote.transactionFee)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
