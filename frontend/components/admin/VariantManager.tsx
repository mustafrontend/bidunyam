"use client";

import { VariantGroup, ExtraService } from "@/hooks/useSellerProducts";

interface VariantManagerProps {
  variantGroups: VariantGroup[];
  onChange: (groups: VariantGroup[]) => void;
  extraServices: ExtraService[];
  onExtraServicesChange: (services: ExtraService[]) => void;
}

function InputField({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]"
      />
    </div>
  );
}

export function VariantManager({
  variantGroups, onChange, extraServices, onExtraServicesChange,
}: VariantManagerProps) {
  const updateGroup = (idx: number, patch: Partial<VariantGroup>) => {
    onChange(variantGroups.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  };
  const removeGroup = (idx: number) => onChange(variantGroups.filter((_, i) => i !== idx));
  const addGroup = () => onChange([...variantGroups, { name: "", type: "CUSTOM", valuesText: "" }]);

  const updateService = (idx: number, patch: Partial<ExtraService>) => {
    onExtraServicesChange(extraServices.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };
  const removeService = (idx: number) => onExtraServicesChange(extraServices.filter((_, i) => i !== idx));
  const addService = () => onExtraServicesChange([...extraServices, { name: "", price: "0", description: "" }]);

  return (
    <div className="space-y-6">
      {/* Varyant Grupları */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm font-black uppercase tracking-wide text-slate-700">Varyant Kutuları</h4>
          <button
            type="button"
            onClick={addGroup}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:border-[#ff6000] hover:text-[#ff6000]"
          >
            + Grup Ekle
          </button>
        </div>
        <div className="space-y-3">
          {variantGroups.map((group, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_180px_1fr_auto]">
                <InputField label="Grup Adı" value={group.name} onChange={(v) => updateGroup(idx, { name: v })} />
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Tip</label>
                  <select
                    value={group.type}
                    onChange={(e) => updateGroup(idx, { type: e.target.value as VariantGroup["type"] })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]"
                  >
                    {["COLOR", "SIZE", "CUSTOM"].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Değerler</label>
                  <textarea
                    value={group.valuesText}
                    onChange={(e) => updateGroup(idx, { valuesText: e.target.value })}
                    placeholder="30 GB|12000|3&#10;50 GB|60000|1"
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeGroup(idx)}
                  className="self-end rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:border-red-300 hover:text-red-600"
                >
                  Sil
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.valuesText.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
                  const [label, price, stock] = line.split("|").map((p) => p.trim());
                  return (
                    <span key={line} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {label || line}{price ? ` · ${price} TL` : ""}{stock ? ` · ${stock} adet` : ""}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ek Hizmetler */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm font-black uppercase tracking-wide text-slate-700">Ek Hizmet Kartları</h4>
          <button
            type="button"
            onClick={addService}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:border-[#ff6000] hover:text-[#ff6000]"
          >
            + Hizmet Ekle
          </button>
        </div>
        <div className="space-y-3">
          {extraServices.map((service, idx) => (
            <div key={idx} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_160px_1fr_auto]">
              <InputField label="Hizmet Adı" value={service.name} onChange={(v) => updateService(idx, { name: v })} />
              <InputField type="number" label="Fiyat" value={service.price} onChange={(v) => updateService(idx, { price: v })} />
              <InputField label="Açıklama" value={service.description} onChange={(v) => updateService(idx, { description: v })} />
              <button
                type="button"
                onClick={() => removeService(idx)}
                className="self-end rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:border-red-300 hover:text-red-600"
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
