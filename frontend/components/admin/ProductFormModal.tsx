"use client";

import { FormState, VariantGroup, ExtraService, CategoryTree, Product, EMPTY_IMAGES, CategoryAttribute } from "@/hooks/useSellerProducts";
import { VariantManager } from "./VariantManager";
import { apiClient } from "@/lib/api";
import { Dispatch, SetStateAction } from "react";

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
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  onImageChange: (index: number, file?: File | null) => void;
  addCategoryMain: () => void;
  addCategorySub: () => void;
  addBrand: () => void;
}

function InputField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]">
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
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
  error, saving, onSave, onCancel, onImageChange,
  addCategoryMain, addCategorySub, addBrand,
}: ProductFormModalProps) {
  const activeSubCategories = categoryTree[form.categoryMain] || [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-base font-black text-slate-700">
        {editingProduct ? `Ürün Düzenle — ${editingProduct.name}` : "Sade Ürün Kartı"}
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
            <InputField label="Ürün Adı" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            <InputField label="Barkod" value={form.barcode} onChange={(v) => setForm((f) => ({ ...f, barcode: v }))} />
            <InputField label="Model Kodu" value={form.modelCode} onChange={(v) => setForm((f) => ({ ...f, modelCode: v }))} />
            <InputField label="SKU" value={form.sku} onChange={(v) => setForm((f) => ({ ...f, sku: v }))} />

            {/* Kategori */}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Kategori</label>
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
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Alt Kategori</label>
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
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Marka</label>
              <div className="flex gap-2">
                <select value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]">
                  <option value="" disabled>Marka seç</option>
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
        <section>
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
        <section>
          <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">Fiyat ve Stok</h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InputField type="number" label="Piyasa Fiyatı" value={form.originalPrice} onChange={(v) => setForm((f) => ({ ...f, originalPrice: v }))} />
            <InputField type="number" label="Satış Fiyatı" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: v }))} />
            <InputField type="number" label="Alış Fiyatı" value={form.purchasePrice} onChange={(v) => setForm((f) => ({ ...f, purchasePrice: v }))} />
            <SelectField label="KDV" value={form.vatRate} onChange={(v) => setForm((f) => ({ ...f, vatRate: v as FormState["vatRate"] }))} options={["1", "10", "20"]} />
            <InputField type="number" label="Stok" value={form.stock} onChange={(v) => setForm((f) => ({ ...f, stock: v }))} />
            <InputField type="number" label="Desi" value={form.desi} onChange={(v) => setForm((f) => ({ ...f, desi: v }))} />
            <InputField type="number" label="Hazırlık Süresi (gün)" value={form.preparationDays} onChange={(v) => setForm((f) => ({ ...f, preparationDays: v }))} />
            <SelectField label="Gönderim Tipi" value={form.shippingType} onChange={(v) => setForm((f) => ({ ...f, shippingType: v as FormState["shippingType"] }))} options={["MARKETPLACE_LOGISTICS", "SELF_SHIPPING"]} />
          </div>
        </section>

        {/* Kategori Özellikleri (Dinamik Filtreler) */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-wide text-slate-700">Kategori Özellikleri (Filtreler)</h4>
            <button
              type="button"
              onClick={() => setCategoryAttributes([...categoryAttributes, { key: "", value: "" }])}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:bg-slate-200"
            >
              + Özellik Ekle
            </button>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            Kategoriye özgü özellikleri (Örn: RAM, Kumaş Tipi, Ekran Boyutu) buraya ekleyin. Girdiğiniz özellikler arama sayfasında otomatik olarak filtreye dönüşür.
          </p>
          <div className="space-y-3">
            {categoryAttributes.map((attr, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Özellik Adı (Örn: RAM)"
                  value={attr.key}
                  onChange={(e) => {
                    const newAttrs = [...categoryAttributes];
                    newAttrs[idx].key = e.target.value;
                    setCategoryAttributes(newAttrs);
                  }}
                  className="w-1/2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-[#ff6000]"
                />
                <input
                  type="text"
                  placeholder="Değer (Örn: 16GB)"
                  value={attr.value}
                  onChange={(e) => {
                    const newAttrs = [...categoryAttributes];
                    newAttrs[idx].value = e.target.value;
                    setCategoryAttributes(newAttrs);
                  }}
                  className="w-1/2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-colors focus:border-[#ff6000]"
                />
                <button
                  type="button"
                  onClick={() => setCategoryAttributes(categoryAttributes.filter((_, i) => i !== idx))}
                  className="shrink-0 rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100"
                  title="Sil"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            {categoryAttributes.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm font-semibold text-slate-400">
                Henüz kategori özelliği eklenmedi. Arama filtrelerinde görünmesi için özellik ekleyin.
              </div>
            )}
          </div>
        </section>

        {/* Varyantlar ve Ek Hizmetler */}
        <VariantManager
          variantGroups={variantGroups} onChange={setVariantGroups}
          extraServices={extraServices} onExtraServicesChange={setExtraServices}
        />

        {/* İçerik */}
        <section>
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

        {/* Durum */}
        <section>
          <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">Durum</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField label="Satış Durumu" value={form.saleStatus} onChange={(v) => setForm((f) => ({ ...f, saleStatus: v as FormState["saleStatus"] }))} options={["ACTIVE", "PASSIVE"]} />
            <SelectField label="Onay Durumu" value={form.approvalStatus} onChange={(v) => setForm((f) => ({ ...f, approvalStatus: v as FormState["approvalStatus"] }))} options={["PENDING", "APPROVED", "REJECTED"]} />
          </div>
        </section>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onSave} disabled={saving}
          className="rounded-lg bg-[#ff6000] px-5 py-2 text-sm font-black text-white disabled:opacity-60">
          {saving ? "Kaydediliyor..." : editingProduct ? "Güncelle" : "Kaydet"}
        </button>
        <button onClick={onCancel}
          className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Vazgeç
        </button>
      </div>
    </div>
  );
}
