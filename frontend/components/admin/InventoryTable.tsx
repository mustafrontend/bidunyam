"use client";

import { Product } from "@/hooks/useSellerProducts";

interface InventoryTableProps {
  products: Product[];
  loading: boolean;
  togglingId: string | null;
  page: number;
  totalPages: number;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleActive: (product: Product) => void;
  onPageChange: (page: number) => void;
}

const TABLE_HEADERS = ["Ürün", "Barkod", "SKU", "Marka", "Kategori", "Fiyat", "Stok", "Durum", "İşlem"];

export function InventoryTable({
  products,
  loading,
  togglingId,
  page,
  totalPages,
  selectedIds = new Set(),
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
  onPageChange,
}: InventoryTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-white" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {onToggleSelectAll && (
              <th className="px-4 py-3 w-10">
                <input 
                  type="checkbox" 
                  className="accent-[#ff6000] w-4 h-4 cursor-pointer"
                  checked={products.length > 0 && selectedIds.size === products.length}
                  onChange={onToggleSelectAll} 
                />
              </th>
            )}
            {TABLE_HEADERS.map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={10} className="py-16 text-center font-semibold text-slate-400">
                Ürün bulunamadı.
              </td>
            </tr>
          ) : (
            products.map((p) => (
              <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50">
                {onToggleSelect && (
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      className="accent-[#ff6000] w-4 h-4 cursor-pointer"
                      checked={selectedIds.has(p._id)}
                      onChange={() => onToggleSelect(p._id)} 
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-lg bg-slate-100 object-cover" />
                    <span className="max-w-[220px] truncate font-semibold text-slate-800">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.barcode || "-"}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.sku || "-"}</td>
                <td className="px-4 py-3 text-slate-600">{p.brand}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {p.category}
                  </span>
                </td>
                <td className="px-4 py-3 font-black text-[#ff6000]">
                  {p.price.toLocaleString("tr-TR")} TL
                </td>
                <td className="px-4 py-3">
                  <span className={`font-bold ${p.stock < 10 ? "text-red-500" : "text-slate-700"}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onToggleActive(p)}
                    disabled={togglingId === p._id}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-opacity hover:opacity-70 disabled:cursor-wait ${
                      p.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    }`}
                  >
                    {togglingId === p._id ? "..." : p.isActive ? "Aktif" : "Pasif"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onEdit(p)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:border-[#ff6000] hover:text-[#ff6000]"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => onDuplicate(p)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:border-[#ff6000] hover:text-[#ff6000]"
                    >
                      Çoğalt
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-bold text-red-500 hover:bg-red-50"
                    >
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
          <p className="text-xs text-slate-500">Sayfa {page} / {totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Önceki
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg bg-[#ff6000] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
