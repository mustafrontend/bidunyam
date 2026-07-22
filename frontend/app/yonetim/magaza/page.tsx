"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api";
import { useSellerAuthStore } from "@/stores/sellerAuthStore";
import { STORE_TEMPLATES, getTemplate } from "@/components/store";
import { Store as StoreIcon, ExternalLink, Copy, Check, Palette, Save, ShieldCheck } from "lucide-react";

export default function MagazaPage() {
  const { token } = useSellerAuthStore();
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeBio, setStoreBio] = useState("");
  const [storeColor, setStoreColor] = useState("#7c3aed");
  const [storeTheme, setStoreTheme] = useState("aurora");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiClient.get("/auth/seller/profile", authHeaders)
      .then((res) => {
        const d = res.data?.data || {};
        setStoreName(d.storeName || d.fullName || d.companyName || "");
        setStoreSlug(d.storeSlug || "");
        setStoreBio(d.storeBio || "");
        setStoreColor(d.storeColor || "#7c3aed");
        setStoreTheme(d.storeTheme || "aurora");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [token]);

  const template = useMemo(() => getTemplate(storeTheme), [storeTheme]);
  const slugPreview = storeSlug || "magaza-adiniz";
  const storeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/magaza/${slugPreview}`;

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await apiClient.put("/auth/seller/profile", {
        storeName, storeSlug, storeBio, storeColor, storeTheme,
      }, authHeaders);
      const d = res.data?.data;
      setStoreSlug(d.storeSlug || storeSlug);
      setMsg({ t: "ok", m: "Mağazanız kaydedildi ✓" });
    } catch (e: any) {
      setMsg({ t: "err", m: e?.response?.data?.message || "Kaydetme başarısız" });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) return <div className="py-20 text-center font-bold text-slate-400">Yükleniyor…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-800">Mağazam</h2>
        <p className="mt-1 text-sm text-slate-500">Kendi kişisel mağaza sayfanızı tasarlayın. Linki paylaştığınızda müşterileriniz size özel temayla karşılaşır.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ayarlar */}
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">Mağaza Adı</label>
            <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Mustafa'nın Butiği"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">Mağaza Adresi (link)</label>
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
              <span className="text-xs font-semibold text-slate-400">/magaza/</span>
              <input value={storeSlug} onChange={(e) => setStoreSlug(e.target.value)} placeholder="mustafa-butik"
                className="flex-1 bg-transparent px-1 py-2.5 text-sm outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">Mağaza Açıklaması</label>
            <textarea value={storeBio} onChange={(e) => setStoreBio(e.target.value)} rows={2} placeholder="El yapımı takılar ve butik ürünler"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-400">Vurgu Rengi</label>
            <div className="flex items-center gap-3">
              <input type="color" value={storeColor} onChange={(e) => setStoreColor(e.target.value)} className="h-10 w-16 cursor-pointer rounded-lg border border-slate-200" />
              <div className="flex gap-2">
                {["#7c3aed", "#ff6000", "#e11d48", "#0ea5e9", "#059669", "#0f172a"].map((c) => (
                  <button key={c} onClick={() => setStoreColor(c)} className={`h-7 w-7 rounded-full border-2 ${storeColor === c ? "border-slate-900" : "border-transparent"}`} style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>

          {/* Tasarım şablonu seçici */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-400">
              <Palette size={13} /> Tasarım Şablonu
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              {STORE_TEMPLATES.map((t) => {
                const selected = storeTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setStoreTheme(t.id)}
                    className={`overflow-hidden rounded-2xl border-2 text-left transition-all ${
                      selected ? "border-[#ff6000] shadow-md" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {/* Minyatür: navbar + hero + kart ızgarası */}
                    <div className="p-2.5" style={{ background: t.preview.bg }}>
                      <div className="mb-1.5 flex items-center gap-1">
                        <div className="h-2 w-2 rounded-sm" style={{ background: storeColor }} />
                        <div className="h-1 w-8 rounded-full" style={{ background: t.preview.muted }} />
                        <div className="ml-auto h-1.5 w-6 rounded-full" style={{ background: t.preview.surface }} />
                      </div>
                      <div
                        className="mb-1.5 h-7 rounded"
                        style={{ background: `linear-gradient(120deg, ${storeColor}, ${t.preview.surface})` }}
                      />
                      <div className="grid grid-cols-3 gap-1">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="rounded p-1" style={{ background: t.preview.surface }}>
                            <div className="mb-0.5 aspect-square rounded" style={{ background: t.preview.bg }} />
                            <div className="h-0.5 w-3/4 rounded-full" style={{ background: t.preview.muted }} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white p-2.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-slate-800">{t.name}</p>
                        {selected && <span className="text-[9px] font-black text-[#ff6000]">SEÇİLİ</span>}
                      </div>
                      <p className="text-[10px] font-bold leading-tight text-slate-500">{t.tagline}</p>
                      <p className="mt-1 text-[9px] leading-tight text-slate-400">{t.bestFor}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] font-semibold text-slate-400">
              {template.desc} Her şablonda mağaza navbar&apos;ı, kategori menüsü ve arama otomatik oluşur.
            </p>
          </div>

          {msg && (
            <div className={`rounded-lg px-4 py-2.5 text-sm font-bold ${msg.t === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.m}</div>
          )}

          <div className="flex gap-3">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#ff6000] px-5 py-2.5 text-sm font-black text-white disabled:opacity-60">
              <Save size={15} /> {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <a href={storeUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600 hover:border-[#ff6000]">
              <ExternalLink size={15} /> Mağazamı Gör
            </a>
          </div>

          {/* Link paylaş */}
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
            <span className="flex-1 truncate px-2 text-xs font-semibold text-slate-500">{storeUrl}</span>
            <button onClick={copyLink} className="flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm">
              {copied ? <><Check size={13} className="text-emerald-500" /> Kopyalandı</> : <><Copy size={13} /> Kopyala</>}
            </button>
          </div>
        </div>

        {/* Canlı önizleme */}
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">Canlı Önizleme</p>
          <div
            className="overflow-hidden rounded-2xl border border-slate-200"
            style={{ background: template.preview.bg }}
          >
            {/* Navbar */}
            <div
              className="flex items-center gap-2 border-b px-4 py-2.5"
              style={{ borderColor: template.preview.surface }}
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md text-white"
                style={{ background: storeColor }}
              >
                <StoreIcon size={12} />
              </div>
              <span className="text-xs font-black" style={{ color: template.preview.text }}>
                {storeName || "Mağaza Adınız"}
              </span>
              <div className="ml-auto flex gap-1.5">
                {["Tümü", "Kategori"].map((c, i) => (
                  <span
                    key={c}
                    className="rounded-full px-2 py-0.5 text-[8px] font-black"
                    style={
                      i === 0
                        ? { background: storeColor, color: "#fff" }
                        : { color: template.preview.muted }
                    }
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero */}
            <div
              className="m-3 rounded-xl p-4"
              style={{ background: `linear-gradient(120deg, ${storeColor}22, ${template.preview.surface})` }}
            >
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black" style={{ color: template.preview.text }}>
                  {storeName || "Mağaza Adınız"}
                </h3>
                <span
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-black text-white"
                  style={{ background: storeColor }}
                >
                  <ShieldCheck size={8} /> Onaylı
                </span>
              </div>
              <p className="mt-1 text-[11px]" style={{ color: template.preview.muted }}>
                {storeBio || "Mağaza açıklamanız burada görünür"}
              </p>
            </div>

            {/* Ürün kartları */}
            <div className="grid grid-cols-3 gap-2 px-3 pb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg p-2" style={{ background: template.preview.surface }}>
                  <div className="mb-1.5 aspect-square rounded" style={{ background: template.preview.bg }} />
                  <div className="h-1.5 w-3/4 rounded-full" style={{ background: template.preview.muted }} />
                  <p className="mt-1.5 text-[10px] font-black" style={{ color: storeColor }}>
                    199 TL
                  </p>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-slate-400">
            Gerçek görünüm için &quot;Mağazamı Gör&quot; ile canlı sayfayı açın.
          </p>
        </div>
      </div>
    </div>
  );
}
