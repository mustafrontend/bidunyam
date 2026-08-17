"use client";

import { FormState, VariantGroup, ExtraService, CategoryTree, Product, EMPTY_IMAGES, CategoryAttribute } from "@/hooks/useSellerProducts";
import { VariantManager } from "./VariantManager";
import { apiClient } from "@/lib/api";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

type TemplateAttr = {
  name: string;
  label?: string;
  type: "select" | "number" | "text" | "boolean";
  options?: string[];
  unit?: string;
  required?: boolean;
};

interface ProductFormModalProps {
  editingProduct: Product | null;
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  imageSlots: string[];
  setImageSlots: Dispatch<SetStateAction<string[]>>;
  variantGroups: VariantGroup[];
  setVariantGroups: Dispatch<SetStateAction<VariantGroup[]>>;
  extraServices: ExtraService[];
  setExtraServices: Dispatch<SetStateAction<ExtraService[]>>;
  categoryAttributes: CategoryAttribute[];
  setCategoryAttributes: Dispatch<SetStateAction<CategoryAttribute[]>>;
  categoryOptions: string[];
  setCategoryOptions: Dispatch<SetStateAction<string[]>>;
  categoryTree: CategoryTree;
  setCategoryTree: Dispatch<SetStateAction<CategoryTree>>;
  brandOptions: string[];
  setBrandOptions: Dispatch<SetStateAction<string[]>>;
  categoryMainDraft: string;
  setCategoryMainDraft: Dispatch<SetStateAction<string>>;
  categorySubDraft: string;
  setCategorySubDraft: Dispatch<SetStateAction<string>>;
  brandDraft: string;
  setBrandDraft: Dispatch<SetStateAction<string>>;
  error: string | null;
  errorField?: string | null;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  onImageChange: (index: number, file?: File | null) => void;
  addCategoryMain: () => void;
  addCategorySub: () => void;
  addBrand: () => void;
}

function InputField({
  label, value, onChange, type = "text", required, hint, suffix, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
  required?: boolean; hint?: string; suffix?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000] ${suffix ? "pr-10" : ""}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  // Etiket/değer ayrı olabilir: ["value", "Görünen Etiket"]
  options: Array<string | [string, string]>;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]">
        {options.map((opt) => {
          const [val, lbl] = Array.isArray(opt) ? opt : [opt, opt];
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>
    </div>
  );
}

export function ProductFormModal({
  editingProduct, form, setForm, imageSlots, setImageSlots,
  variantGroups, setVariantGroups, extraServices, setExtraServices,
  categoryAttributes, setCategoryAttributes,
  categoryOptions, setCategoryOptions, categoryTree, setCategoryTree,
  brandOptions, setBrandOptions, categoryMainDraft, setCategoryMainDraft,
  categorySubDraft, setCategorySubDraft, brandDraft, setBrandDraft,
  error, errorField, saving, onSave, onCancel, onImageChange,
  addCategoryMain, addCategorySub, addBrand,
}: ProductFormModalProps) {
  const activeSubCategories = categoryTree[form.categoryMain] || [];

  // Doğrulama hatasında ilgili alana kaydır + kısa süre vurgula
  useEffect(() => {
    if (!errorField) return;
    const el = document.getElementById(`pf-${errorField}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("pf-flash");
    const t = setTimeout(() => el.classList.remove("pf-flash"), 1600);
    return () => clearTimeout(t);
  }, [errorField]);

  // Kaydedilmemiş değişiklik var mı? (yeni üründe içerik girildiyse)
  const isDirty =
    !!form.name.trim() || !!form.price || !!form.originalPrice || !!form.description.trim() ||
    imageSlots.some(Boolean);

  const handleCancel = () => {
    if (isDirty && !window.confirm("Kaydedilmemiş değişiklikler kaybolacak. Çıkmak istediğinize emin misiniz?")) {
      return;
    }
    onCancel();
  };

  // Sekme/pencere kapatılırken de uyar (form açık ve doldurulmuşsa)
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  // ─── Satıcı hesap tipi (bireysel/tüzel ürün girişi farklılaşır) ───
  const [sellerType, setSellerType] = useState<"BIREYSEL" | "TUZEL" | null>(null);
  const isBireysel = sellerType === "BIREYSEL";
  const isTuzel = sellerType === "TUZEL";

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get("/auth/seller/profile")
      .then((res) => {
        if (cancelled) return;
        const t = res.data?.data?.accountType;
        if (t === "BIREYSEL" || t === "TUZEL") setSellerType(t);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Yeni üründe ilan tipini hesap tipine göre otomatik ayarla
  useEffect(() => {
    if (!sellerType || editingProduct) return;
    setForm((f) => ({
      ...f,
      listingType: sellerType === "BIREYSEL" ? "BIREYSEL" : "KURUMSAL",
      condition: sellerType === "TUZEL" ? "SIFIR" : f.condition,
    }));
  }, [sellerType, editingProduct, setForm]);

  // ─── Dinamik kategori şablonu ───────────────────────────────
  const [template, setTemplate] = useState<TemplateAttr[]>([]);
  const [templateSource, setTemplateSource] = useState<string>("");

  useEffect(() => {
    const cat = form.categorySub || form.categoryMain;
    if (!cat) {
      setTemplate([]);
      return;
    }
    let cancelled = false;
    apiClient
      .get(`/products/meta/filters?category=${encodeURIComponent(cat)}`)
      .then((res) => {
        if (cancelled) return;
        const attrs = (res.data?.data?.attributes || []) as any[];
        setTemplateSource(res.data?.data?.source || "");
        // Şablon (typed) veya auto (name/options) formatını normalize et
        setTemplate(
          attrs.map((a) => ({
            name: a.name,
            label: a.label,
            type: a.type || (Array.isArray(a.options) && a.options.length ? "select" : "text"),
            options: a.options,
            unit: a.unit,
            required: a.required,
          }))
        );
      })
      .catch(() => !cancelled && setTemplate([]));
    return () => { cancelled = true; };
  }, [form.categoryMain, form.categorySub]);

  const getAttr = (name: string): string =>
    categoryAttributes.find((a) => a.key === name)?.value || "";

  const setAttr = (name: string, value: string) => {
    setCategoryAttributes((prev) => {
      const idx = prev.findIndex((a) => a.key === name);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { key: name, value };
        return next;
      }
      return [...prev, { key: name, value }];
    });
  };

  const templateNames = new Set(template.map((t) => t.name));
  const customAttributes = categoryAttributes.filter((a) => !templateNames.has(a.key));

  // Doldurma ilerlemesi (Trendyol tarzı okunabilirlik)
  const requiredAttrs = template.filter((t) => t.required);
  const filledRequired = requiredAttrs.filter((t) => getAttr(t.name).trim()).length;
  const filledTotal = template.filter((t) => getAttr(t.name).trim()).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <style>{`
        @keyframes pfFlash { 0%,100% { box-shadow: 0 0 0 0 rgba(255,96,0,0); } 30% { box-shadow: 0 0 0 3px rgba(255,96,0,.35); } }
        .pf-flash { animation: pfFlash 1.4s ease; border-radius: 12px; }
        @media (prefers-reduced-motion: reduce) { .pf-flash { animation: none; outline: 2px solid #ff6000; } }
      `}</style>
      <h3 className="mb-5 text-base font-black text-slate-700">
        {editingProduct ? `Ürün Düzenle — ${editingProduct.name}` : "Yeni Ürün Ekle"}
      </h3>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Temel Bilgiler */}
        <section>
          <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">Temel Bilgiler</h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div id="pf-name" className="lg:col-span-3">
              <InputField
                label="Ürün Adı"
                required
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Örn: Apple iPhone 14 128 GB Yıldız Işığı"
                hint={`${form.name.length}/120 — marka, model ve öne çıkan özelliği yazın (aramada bulunmayı artırır).`}
              />
            </div>

            {/* Kategori */}
            <div id="pf-category">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Kategori <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <select
                  value={form.categoryMain}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setForm((f) => ({ ...f, categoryMain: value, categorySub: "" }));
                    try {
                      const metaRes = await apiClient.get("/products/meta/options");
                      const cats = metaRes.data?.data?.categories as Array<{ name: string; subCategories: string[] }> | undefined;
                      if (cats) {
                        setCategoryOptions(cats.map((item) => item.name).sort((a, b) => a.localeCompare(b, "tr")));
                        setCategoryTree(Object.fromEntries(cats.map((item) => [item.name, item.subCategories.sort((a, b) => a.localeCompare(b, "tr"))])));
                      }
                    } catch { /* ignore */ }
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]"
                >
                  <option value="" disabled>Ana kategori seç</option>
                  {categoryOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <input value={categoryMainDraft} onChange={(e) => setCategoryMainDraft(e.target.value)} placeholder="Yeni kategori"
                  className="w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]" />
                <button type="button" onClick={addCategoryMain}
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-black text-slate-600 hover:border-[#ff6000] hover:text-[#ff6000]">+</button>
              </div>
            </div>

            {/* Alt Kategori */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Alt Kategori <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <select value={form.categorySub} onChange={(e) => setForm((f) => ({ ...f, categorySub: e.target.value }))}
                  disabled={!form.categoryMain}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]">
                  <option value="" disabled>Alt kategori seç</option>
                  {activeSubCategories.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <input value={categorySubDraft} onChange={(e) => setCategorySubDraft(e.target.value)} placeholder="Yeni alt kategori"
                  disabled={!form.categoryMain}
                  className="w-40 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000] disabled:opacity-40" />
                <button type="button" onClick={addCategorySub} disabled={!form.categoryMain}
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-black text-slate-600 hover:border-[#ff6000] hover:text-[#ff6000] disabled:opacity-40">+</button>
              </div>
            </div>

            {/* Marka */}
            <div id="pf-brand">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Marka <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <select value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]">
                  <option value="" disabled>Marka seç</option>
                  {/* Düzenlenen ürünün markası listede yoksa yine de görünsün */}
                  {form.brand && !brandOptions.includes(form.brand) && (
                    <option value={form.brand}>{form.brand}</option>
                  )}
                  {brandOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <input value={brandDraft} onChange={(e) => setBrandDraft(e.target.value)} placeholder="Yeni marka"
                  className="w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]" />
                <button type="button" onClick={addBrand}
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-black text-slate-600 hover:border-[#ff6000] hover:text-[#ff6000]">+</button>
              </div>
            </div>
          </div>
        </section>

        {/* Fotoğraflar */}
        <section id="pf-images">
          <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">Fotoğraflar</h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {imageSlots.map((src, idx) => (
              <label key={idx} className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 transition-colors hover:border-[#ff6000]">
                <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">Fotoğraf {idx + 1}</span>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white">
                  {src ? (
                    <img src={src} alt={`Fotoğraf ${idx + 1}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center text-xs font-semibold text-slate-400">Yüklemek için tıkla</div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => onImageChange(idx, e.target.files?.[0] ?? null)} />
              </label>
            ))}
          </div>
          {imageSlots.some(Boolean) && (
            <button type="button" onClick={() => setImageSlots(EMPTY_IMAGES)}
              className="mt-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">
              Fotoğrafları Temizle
            </button>
          )}
        </section>

        {/* Fiyat ve Stok */}
        <section id="pf-price">
          <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">Fiyat ve Stok</h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InputField type="number" label="Piyasa Fiyatı" required suffix="TL" value={form.originalPrice}
              onChange={(v) => setForm((f) => ({ ...f, originalPrice: v }))} hint="Ürünün üstü çizili etiket fiyatı" />
            <InputField type="number" label="Satış Fiyatı" required suffix="TL" value={form.price}
              onChange={(v) => setForm((f) => ({ ...f, price: v }))} hint="Alıcının ödeyeceği fiyat" />
            <InputField type="number" label="Alış Fiyatı" suffix="TL" value={form.purchasePrice}
              onChange={(v) => setForm((f) => ({ ...f, purchasePrice: v }))} hint="Maliyetiniz (yalnız kâr hesabı için)" />
            <SelectField label="KDV Oranı" value={form.vatRate}
              onChange={(v) => setForm((f) => ({ ...f, vatRate: v as FormState["vatRate"] }))}
              options={[["1", "%1"], ["10", "%10"], ["20", "%20"]]} />
            <InputField type="number" label="Stok" required value={form.stock} onChange={(v) => setForm((f) => ({ ...f, stock: v }))} />
            <InputField type="number" label="Desi" suffix="desi" value={form.desi}
              onChange={(v) => setForm((f) => ({ ...f, desi: v }))} hint="Kargo ücreti buna göre hesaplanır" />
            <InputField type="number" label="Hazırlık Süresi" suffix="gün" value={form.preparationDays}
              onChange={(v) => setForm((f) => ({ ...f, preparationDays: v }))} />
            <SelectField label="Gönderim Tipi" value={form.shippingType}
              onChange={(v) => setForm((f) => ({ ...f, shippingType: v as FormState["shippingType"] }))}
              options={[["MARKETPLACE_LOGISTICS", "Pazaryeri Lojistiği"], ["SELF_SHIPPING", "Kendi Kargom"]]} />
          </div>

          {/* Canlı kâr / indirim özeti — satıcı fiyatı yazarken anında görür */}
          {(() => {
            const satis = Number(form.price) || 0;
            const piyasa = Number(form.originalPrice) || 0;
            const alis = Number(form.purchasePrice) || 0;
            const indirim = piyasa > satis ? Math.round(((piyasa - satis) / piyasa) * 100) : 0;
            const kar = alis > 0 && satis > 0 ? satis - alis : null;
            const marj = kar !== null && satis > 0 ? Math.round((kar / satis) * 100) : null;
            if (satis <= 0 && piyasa <= 0) return null;
            return (
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                {indirim > 0 && (
                  <span className="rounded-lg bg-rose-50 px-3 py-1.5 text-rose-600">%{indirim} indirimli görünecek</span>
                )}
                {kar !== null && (
                  <span className={`rounded-lg px-3 py-1.5 ${kar >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                    {kar >= 0 ? "Kârınız" : "Zarar"}: {kar.toLocaleString("tr-TR")} TL{marj !== null ? ` (marj %${marj})` : ""}
                  </span>
                )}
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-500">
                  Platform komisyonu kesildikten sonraki net hakediş Tahsilat sayfasında görünür
                </span>
              </div>
            );
          })()}
        </section>

        {/* Kategori Özellikleri (Dinamik / Kategoriye Özel Filtreler) */}
        <section className="rounded-2xl border border-[#ff6000]/20 bg-gradient-to-br from-[#ff6000]/[0.03] to-transparent p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff6000]/10 text-[#ff6000]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">Ürün Özellikleri</h4>
                <p className="text-[11px] font-semibold text-slate-400">Kategoriye özel; arama filtrelerinde görünür</p>
              </div>
            </div>
            {templateSource === "template" && (
              <span className="rounded-full bg-[#ff6000] px-3 py-1 text-[11px] font-black text-white">
                {form.categorySub || form.categoryMain}
              </span>
            )}
          </div>

          {!form.categoryMain ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white py-6 text-center text-sm font-semibold text-slate-400">
              Kategoriye özel özelliklerin (RAM, Beden, Hafıza vb.) görünmesi için önce kategori seçin.
            </div>
          ) : (
            <>
              {template.length > 0 && (
                <>
                  {/* Doldurma ilerlemesi */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-[#ff6000] transition-all duration-300"
                        style={{ width: `${template.length ? (filledTotal / template.length) * 100 : 0}%` }} />
                    </div>
                    <span className="shrink-0 text-[11px] font-black text-slate-500">
                      {filledTotal}/{template.length} dolduruldu
                      {requiredAttrs.length > 0 && (
                        <span className={filledRequired === requiredAttrs.length ? "ml-1 text-emerald-600" : "ml-1 text-red-500"}>
                          · {filledRequired}/{requiredAttrs.length} zorunlu
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {template.map((attr) => {
                      const label = (attr.label || attr.name) + (attr.unit ? ` (${attr.unit})` : "");
                      const value = getAttr(attr.name);
                      if (attr.type === "select" && attr.options?.length) {
                        return (
                          <div key={attr.name}>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                              {label} {attr.required && <span className="text-red-500">*</span>}
                            </label>
                            <select value={value} onChange={(e) => setAttr(attr.name, e.target.value)}
                              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#ff6000] ${value ? "border-slate-200" : attr.required ? "border-red-200" : "border-slate-200"}`}>
                              <option value="">Seçiniz</option>
                              {attr.options.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                        );
                      }
                      return (
                        <div key={attr.name}>
                          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                            {label} {attr.required && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type={attr.type === "number" ? "number" : "text"}
                            value={value}
                            onChange={(e) => setAttr(attr.name, e.target.value)}
                            placeholder={attr.type === "number" ? "0" : ""}
                            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#ff6000] ${!value && attr.required ? "border-red-200" : "border-slate-200"}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {template.length === 0 && (
                <p className="mb-4 text-xs text-slate-500">
                  Bu kategori için hazır şablon yok. Aşağıdan özel özellik ekleyebilirsiniz (arama filtresine dönüşür).
                </p>
              )}

              {/* Özel (şablon dışı) özellikler */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">Ek Özellikler</span>
                  <button
                    type="button"
                    onClick={() => setCategoryAttributes([...categoryAttributes, { key: "", value: "" }])}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    + Özel Özellik
                  </button>
                </div>
                <div className="space-y-3">
                  {customAttributes.map((attr) => {
                    const realIdx = categoryAttributes.findIndex((a) => a === attr);
                    return (
                      <div key={realIdx} className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Özellik Adı"
                          value={attr.key}
                          onChange={(e) => {
                            const newAttrs = [...categoryAttributes];
                            newAttrs[realIdx] = { ...newAttrs[realIdx], key: e.target.value };
                            setCategoryAttributes(newAttrs);
                          }}
                          className="w-1/2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff6000]"
                        />
                        <input
                          type="text"
                          placeholder="Değer"
                          value={attr.value}
                          onChange={(e) => {
                            const newAttrs = [...categoryAttributes];
                            newAttrs[realIdx] = { ...newAttrs[realIdx], value: e.target.value };
                            setCategoryAttributes(newAttrs);
                          }}
                          className="w-1/2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff6000]"
                        />
                        <button
                          type="button"
                          onClick={() => setCategoryAttributes(categoryAttributes.filter((_, i) => i !== realIdx))}
                          className="shrink-0 rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100"
                          title="Sil"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Varyantlar ve Ek Hizmetler */}
        <VariantManager
          variantGroups={variantGroups} onChange={setVariantGroups}
          extraServices={extraServices} onExtraServicesChange={setExtraServices}
        />

        {/* İçerik */}
        <section id="pf-description">
          <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">İçerik</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Kısa Açıklama</label>
              <textarea rows={2} value={form.shortDescription} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Bullet Points (satır satır)</label>
              <textarea rows={2} value={form.bulletPoints} onChange={(e) => setForm((f) => ({ ...f, bulletPoints: e.target.value }))}
                placeholder="- Özellik 1&#10;- Özellik 2"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Detaylı Açıklama</label>
              <textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]" />
            </div>
          </div>
        </section>

        {/* İlan Tipi & Ürün Durumu — satıcı hesap tipine göre farklılaşır */}
        <section className={`rounded-2xl border p-5 ${isBireysel ? "border-violet-200 bg-violet-50/40" : "border-slate-200 bg-slate-50/40"}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-black uppercase tracking-wide text-slate-700">İlan Tipi ve Ürün Durumu</h4>
            {sellerType && (
              <span className={`rounded-full px-3 py-1 text-[11px] font-black text-white ${isBireysel ? "bg-violet-600" : "bg-slate-700"}`}>
                {isBireysel ? "Bireysel Satıcı — Pazar ilanı" : "Kurumsal Satıcı — Faturalı satış"}
              </span>
            )}
          </div>

          {isTuzel ? (
            /* TÜZEL: yalnızca sıfır ürün, faturalı satış */
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-slate-700">Kurumsal ilan · Sıfır ürün</p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Tüzel kişi satıcılar yalnızca <strong>sıfır (yeni)</strong> ürün satabilir. Satışlarınız faturalı işlenir;
                KDV oranını “Fiyat ve Stok” bölümünden belirleyin.
              </p>
            </div>
          ) : isBireysel ? (
            /* BİREYSEL: Pazar ilanı — ürün durumu zorunlu */
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Ürün Durumu <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([["SIFIR", "Sıfır"], ["AZ_KULLANILMIS", "Az Kullanılmış"], ["IKINCI_EL", "İkinci El"]] as const).map(([val, lbl]) => (
                  <button key={val} type="button"
                    onClick={() => setForm((f) => ({ ...f, condition: val }))}
                    className={`rounded-lg border px-2 py-2.5 text-[11px] font-black transition-all ${form.condition === val ? "border-violet-500 bg-violet-100 text-violet-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
                    {lbl}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs font-medium text-slate-500">
                İlanınız <strong>Pazar</strong> bölümünde ve kendi mağaza sayfanızda yayınlanır. Durum bilgisi alıcıya rozet olarak gösterilir.
              </p>
            </div>
          ) : (
            /* Hesap tipi yüklenene kadar manuel seçim */
            <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">İlan Tipi</label>
              <div className="grid grid-cols-2 gap-2">
                {([["KURUMSAL", "Kurumsal (Sıfır Ürün)"], ["BIREYSEL", "Bireysel (Pazar)"]] as const).map(([val, lbl]) => (
                  <button key={val} type="button"
                    onClick={() => setForm((f) => ({ ...f, listingType: val, condition: val === "KURUMSAL" ? "SIFIR" : f.condition }))}
                    className={`rounded-lg border px-3 py-2.5 text-xs font-black transition-all ${form.listingType === val ? "border-[#ff6000] bg-[#ff6000]/5 text-[#ff6000]" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Ürün Durumu {form.listingType === "BIREYSEL" && <span className="text-[#ff6000]">(Pazar)</span>}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([["SIFIR", "Sıfır"], ["AZ_KULLANILMIS", "Az Kullanılmış"], ["IKINCI_EL", "İkinci El"]] as const).map(([val, lbl]) => (
                  <button key={val} type="button"
                    disabled={form.listingType === "KURUMSAL" && val !== "SIFIR"}
                    onClick={() => setForm((f) => ({ ...f, condition: val }))}
                    className={`rounded-lg border px-2 py-2.5 text-[11px] font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed ${form.condition === val ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            </div>
          )}
        </section>

        {/* Gelişmiş — barkod/SKU/model kodu (boş bırakılırsa otomatik üretilir) */}
        <details className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <summary className="cursor-pointer text-sm font-black text-slate-700">
            Gelişmiş: Barkod / SKU / Model kodu (opsiyonel)
          </summary>
          <p className="mt-2 mb-3 text-xs text-slate-500">
            Boş bırakırsanız sistem otomatik oluşturur. Kendi stok kodunuz varsa buraya yazın.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <InputField label="Barkod" value={form.barcode} onChange={(v) => setForm((f) => ({ ...f, barcode: v }))}
              placeholder="Otomatik" hint="En az 8 hane" />
            <InputField label="Model Kodu" value={form.modelCode} onChange={(v) => setForm((f) => ({ ...f, modelCode: v }))} placeholder="Otomatik" />
            <InputField label="SKU" value={form.sku} onChange={(v) => setForm((f) => ({ ...f, sku: v }))} placeholder="Otomatik" />
          </div>
        </details>

        {/* Yayın Durumu — yalnızca satıcının kararı (aktif/pasif). Onay sistemindir. */}
        <section>
          <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">Yayın Durumu</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField label="Satış Durumu" value={form.saleStatus}
              onChange={(v) => setForm((f) => ({ ...f, saleStatus: v as FormState["saleStatus"] }))}
              options={[["ACTIVE", "Satışta (aktif)"], ["PASSIVE", "Vitrinden gizli (pasif)"]]} />
          </div>
        </section>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onSave} disabled={saving}
          className="rounded-lg bg-[#ff6000] px-5 py-2 text-sm font-black text-white disabled:opacity-60">
          {saving ? "Kaydediliyor..." : editingProduct ? "Güncelle" : "Kaydet"}
        </button>
        <button onClick={handleCancel}
          className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Vazgeç
        </button>
      </div>
    </div>
  );
}
