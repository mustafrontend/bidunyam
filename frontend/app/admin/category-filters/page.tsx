"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { Plus, Trash2, Save, SlidersHorizontal, ChevronRight } from "lucide-react";

type FilterType = "select" | "number" | "text" | "boolean";

interface FilterAttr {
  name: string;
  type: FilterType;
  options?: string[];
  unit?: string;
  required?: boolean;
}

interface Template {
  id?: string;
  categoryName: string;
  filters: FilterAttr[];
}

export default function CategoryFiltersPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    apiClient
      .get("/products/meta/filter-templates")
      .then((res) => setTemplates(res.data?.data || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const selectTemplate = (t: Template) => {
    setSelected(JSON.parse(JSON.stringify(t)));
  };

  const createNew = () => {
    const name = newCategory.trim();
    if (!name) return;
    setSelected({ categoryName: name, filters: [] });
    setNewCategory("");
  };

  const updateAttr = (idx: number, patch: Partial<FilterAttr>) => {
    if (!selected) return;
    const filters = [...selected.filters];
    filters[idx] = { ...filters[idx], ...patch };
    setSelected({ ...selected, filters });
  };

  const addAttr = () => {
    if (!selected) return;
    setSelected({ ...selected, filters: [...selected.filters, { name: "", type: "select", options: [] }] });
  };

  const removeAttr = (idx: number) => {
    if (!selected) return;
    setSelected({ ...selected, filters: selected.filters.filter((_, i) => i !== idx) });
  };

  const save = async () => {
    if (!selected || !selected.categoryName.trim()) return;
    setSaving(true);
    try {
      const clean = selected.filters
        .filter((f) => f.name.trim())
        .map((f) => ({
          name: f.name.trim(),
          type: f.type,
          options: f.type === "select" ? (f.options || []).map((o) => o.trim()).filter(Boolean) : undefined,
          unit: f.unit?.trim() || undefined,
          required: !!f.required,
        }));
      await apiClient.put("/products/meta/filter-templates", {
        categoryName: selected.categoryName.trim(),
        filters: clean,
      });
      flash("Şablon kaydedildi ✓");
      load();
    } catch {
      flash("Kaydetme başarısız");
    } finally {
      setSaving(false);
    }
  };

  const del = async (categoryName: string) => {
    if (!confirm(`"${categoryName}" şablonu silinsin mi?`)) return;
    try {
      await apiClient.delete(`/products/meta/filter-templates/${encodeURIComponent(categoryName)}`);
      if (selected?.categoryName === categoryName) setSelected(null);
      flash("Şablon silindi");
      load();
    } catch {
      flash("Silme başarısız");
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-2xl bg-[#ff5000]/10 p-3 text-[#ff5000]">
          <SlidersHorizontal size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Kategori Filtreleri</h1>
          <p className="text-sm font-medium text-slate-500">
            Her kategoriye özel ürün özelliklerini (RAM, Beden, Hafıza…) tanımlayın. Satıcı ürün eklerken bu alanlar otomatik gelir; arama sayfasında filtre olur.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Şablon listesi */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 px-1 text-xs font-black uppercase tracking-wide text-slate-400">
            Şablonlar ({templates.length})
          </h2>
          <div className="mb-4 flex gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createNew()}
              placeholder="Yeni kategori adı"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#ff5000]"
            />
            <button onClick={createNew} className="rounded-lg bg-[#ff5000] px-3 py-2 text-white" title="Ekle">
              <Plus size={16} />
            </button>
          </div>
          {loading ? (
            <p className="px-1 py-4 text-sm text-slate-400">Yükleniyor…</p>
          ) : (
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {templates.map((t) => (
                <button
                  key={t.categoryName}
                  onClick={() => selectTemplate(t)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    selected?.categoryName === t.categoryName
                      ? "bg-[#ff5000]/10 text-[#ff5000]"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{t.categoryName}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    {t.filters.length} özellik <ChevronRight size={14} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editör */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
          {!selected ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-slate-400">
              <SlidersHorizontal size={32} className="mb-3" />
              <p className="text-sm font-semibold">Düzenlemek için bir şablon seçin veya yeni oluşturun.</p>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Kategori</span>
                  <h3 className="text-lg font-black text-slate-900">{selected.categoryName}</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => del(selected.categoryName)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50">
                    Sil
                  </button>
                  <button onClick={save} disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-[#ff5000] px-4 py-2 text-sm font-black text-white disabled:opacity-60">
                    <Save size={16} /> {saving ? "Kaydediliyor…" : "Kaydet"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {selected.filters.map((attr, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 grid gap-3 md:grid-cols-4">
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Özellik Adı</label>
                        <input value={attr.name} onChange={(e) => updateAttr(idx, { name: e.target.value })}
                          placeholder="Örn: RAM" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#ff5000]" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Tip</label>
                        <select value={attr.type} onChange={(e) => updateAttr(idx, { type: e.target.value as FilterType })}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#ff5000]">
                          <option value="select">Seçim (dropdown)</option>
                          <option value="number">Sayı</option>
                          <option value="text">Metin</option>
                          <option value="boolean">Var/Yok</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Birim</label>
                        <input value={attr.unit || ""} onChange={(e) => updateAttr(idx, { unit: e.target.value })}
                          placeholder="inç, mAh…" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#ff5000]" />
                      </div>
                    </div>
                    {attr.type === "select" && (
                      <div className="mb-3">
                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Seçenekler (virgülle ayır)</label>
                        <input
                          value={(attr.options || []).join(", ")}
                          onChange={(e) => updateAttr(idx, { options: e.target.value.split(",").map((s) => s.trimStart()) })}
                          placeholder="8 GB, 16 GB, 32 GB"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#ff5000]"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                        <input type="checkbox" checked={!!attr.required} onChange={(e) => updateAttr(idx, { required: e.target.checked })}
                          className="h-4 w-4 accent-[#ff5000]" />
                        Zorunlu alan
                      </label>
                      <button onClick={() => removeAttr(idx)} className="flex items-center gap-1 text-sm font-bold text-red-500 hover:text-red-600">
                        <Trash2 size={14} /> Kaldır
                      </button>
                    </div>
                  </div>
                ))}

                <button onClick={addAttr}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-black text-slate-500 hover:border-[#ff5000] hover:text-[#ff5000]">
                  <Plus size={16} /> Özellik Ekle
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
