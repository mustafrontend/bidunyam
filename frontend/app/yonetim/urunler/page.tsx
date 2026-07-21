"use client";

import { useState } from "react";
import { useSellerProducts } from "@/hooks/useSellerProducts";
import { InventoryTable } from "@/components/admin/InventoryTable";
import { ProductFormModal } from "@/components/admin/ProductFormModal";
import { BulkActionsModal } from "@/components/admin/BulkActionsModal";
import { ErrorBoundary } from "@/components/atoms/ErrorBoundary";

function DuplicateModal({ target, count, setCount, error, duplicating, onConfirm, onCancel }: {
  target: { name: string } | null;
  count: string;
  setCount: (v: string) => void;
  error: string | null;
  duplicating: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!target) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 className="mb-1 text-base font-black text-slate-800">Ürün Çoğalt</h3>
        <p className="mb-4 text-sm text-slate-500 line-clamp-1">{target.name}</p>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Kaç kopya oluşturulsun?</label>
        <input type="number" min={1} max={50} value={count} onChange={(e) => setCount(e.target.value)}
          className="mb-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]" autoFocus />
        <p className="mb-4 text-[11px] text-slate-400">Maksimum 50 kopya oluşturabilirsiniz.</p>
        {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</div>}
        <div className="flex gap-3">
          <button onClick={onConfirm} disabled={duplicating} className="flex-1 rounded-lg bg-[#ff6000] py-2 text-sm font-black text-white disabled:opacity-60">
            {duplicating ? "Çoğaltılıyor..." : `${count} Kopya Oluştur`}
          </button>
          <button onClick={onCancel} disabled={duplicating} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ target, deleting, onConfirm, onCancel }: {
  target: { name: string } | null;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!target) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 className="mb-1 text-base font-black text-slate-800">Ürünü Sil</h3>
        <p className="mb-4 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{target.name}</span> ürününü kalıcı olarak silmek istediğinize emin misiniz?
        </p>
        <p className="mb-4 text-xs text-red-500 font-semibold">Bu işlem geri alınamaz.</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} disabled={deleting} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-black text-white disabled:opacity-60">
            {deleting ? "Siliniyor..." : "Evet, Sil"}
          </button>
          <button onClick={onCancel} disabled={deleting} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}

function XmlTab({ state }: { state: ReturnType<typeof useSellerProducts> }) {
  const { xmlLoading, xmlData, xmlHistory, xmlFeeds, deleteXmlFeed, xmlSearch, setXmlSearch, filteredXmlProducts } = state;

  if (xmlLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-white" />
        ))}
      </div>
    );
  }

  if (!xmlData?.request && xmlFeeds.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-slate-500 font-bold">Henüz içeri aktarılmış bir XML kataloğunuz bulunmamaktadır.</p>
        <p className="text-xs text-slate-400 mt-1 mb-6">Toplu ürün eklemek ve satışa açmak için bir XML linki veya dosyası yükleyin.</p>
        <a href="/yonetim/xml-import" className="inline-flex rounded-xl bg-[#ff6000] px-6 py-3 text-sm font-black text-white transition-colors hover:bg-[#d85000]">
          🚀 Hemen XML Yükle
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {xmlFeeds.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <h3 className="text-lg font-black text-slate-800 mb-4">⚙️ Aktif XML Entegrasyonları (Otomatik Güncellenenler)</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {xmlFeeds.map((feed) => (
              <div key={feed.id} className="rounded-xl border border-slate-100 p-4 bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800 uppercase">Her {feed.syncInterval} Dk</span>
                    <h4 className="font-bold text-slate-800">{feed.name}</h4>
                  </div>
                  <a href={feed.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline break-all block mb-2">{feed.url}</a>
                  <p className="text-[10px] text-slate-500">Son Senkronizasyon: {feed.lastSyncAt ? new Date(feed.lastSyncAt).toLocaleString('tr-TR') : 'Henüz çalışmadı'}</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`${feed.name} entegrasyonunu silmek istediğinize emin misiniz?`)) {
                      deleteXmlFeed(feed.id);
                    }
                  }}
                  className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 transition-colors ml-4 shrink-0"
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {xmlData?.request && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">● Aktif Yayında</span>
                <h3 className="mt-3 text-lg font-black text-slate-800">📄 {xmlData.request.xmlFileName || "İçeri Aktarılan Dosya"}</h3>
                <p className="mt-1.5 text-xs text-[#ff6000] font-bold break-all">
                  🔗 <a href={xmlData.request.sourceUrl} target="_blank" rel="noreferrer" className="hover:underline">{xmlData.request.sourceUrl}</a>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-bold">İthalat Tarihi</p>
                <p className="text-sm font-black text-slate-700 mt-1">{new Date(xmlData.request.createdAt).toLocaleString("tr-TR")}</p>
              </div>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-[#ff6000]">{xmlData.products.length}</span>
                <span className="text-xs text-slate-500 font-bold">Aktif Kataloğa Alınan Ürün</span>
              </div>
              <a href="/yonetim/xml-import" className="text-xs font-black text-slate-600 hover:text-[#ff6000] transition-colors">Yeni Güncelleme Yap ➔</a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Geçmiş XML Yüklemeleri</h4>
            <div className="space-y-3">
              {xmlHistory.slice(0, 3).map((hist, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-700 truncate">{hist.xmlFileName}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{new Date(hist.createdAt).toLocaleDateString("tr-TR")}</p>
                  </div>
                  <span className="font-black text-slate-500 shrink-0 ml-2">{hist.totalProducts} Ürün</span>
                </div>
              ))}
              {xmlHistory.length === 0 && <p className="text-slate-400 text-xs font-bold py-4 text-center">Yükleme geçmişi bulunmamaktadır.</p>}
            </div>
          </div>
        </div>
      )}

      <input type="text" value={xmlSearch} onChange={(e) => setXmlSearch(e.target.value)} placeholder="XML ürün veya barkod ara..."
        className="w-72 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-[#ff6000]" />

      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Ürün", "Barkod", "Marka", "Kategori", "Satış Fiyatı", "Stok"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredXmlProducts.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center font-semibold text-slate-400">XML ürünü bulunamadı.</td></tr>
            ) : (
              filteredXmlProducts.map((p) => (
                <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-lg bg-slate-100 object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-lg text-slate-400 font-black">📦</div>
                      )}
                      <span className="max-w-xs truncate font-semibold text-slate-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.barcode || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.brand}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{p.category}</span></td>
                  <td className="px-4 py-3 font-black text-[#ff6000]">{Number(p.price).toLocaleString("tr-TR")} TL</td>
                  <td className="px-4 py-3"><span className={`font-bold ${p.stock < 10 ? "text-red-500" : "text-slate-700"}`}>{p.stock}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function UrunlerPage() {
  const state = useSellerProducts();
  const [bulkUpdating, setBulkUpdating] = useState(false);


  const handleBulkStatus = async (isActive: boolean) => {
    setBulkUpdating(true);
    try {
      await import("@/lib/api").then(m => m.apiClient.patch('/products/admin/products/bulk/status', {
        productIds: Array.from(state.selectedIds), isActive
      }));
      state.setSelectedIds(new Set());
      state.fetchProducts();
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`${state.selectedIds.size} ürünü silmek istediğinize emin misiniz?`)) return;
    setBulkUpdating(true);
    try {
      await import("@/lib/api").then(m => m.apiClient.delete('/products/admin/products/bulk', {
        data: { productIds: Array.from(state.selectedIds) }
      }));
      state.setSelectedIds(new Set());
      state.fetchProducts();
    } finally {
      setBulkUpdating(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Modals */}
        <DuplicateModal
          target={state.duplicateTarget}
          count={state.duplicateCount}
          setCount={state.setDuplicateCount}
          error={state.duplicateError}
          duplicating={state.duplicating}
          onConfirm={state.handleDuplicate}
          onCancel={() => { state.setDuplicateTarget(null); state.setDuplicateCount("1"); state.setDuplicateError(null); }}
        />
        <DeleteModal
          target={state.deleteTarget}
          deleting={state.deleting}
          onConfirm={state.handleDelete}
          onCancel={() => state.setDeleteTarget(null)}
        />
        <BulkActionsModal
          isOpen={state.bulkPriceModal}
          onClose={() => state.setBulkPriceModal(false)}
          selectedIds={Array.from(state.selectedIds)}
          onDone={() => { state.setSelectedIds(new Set()); state.fetchProducts(); }}
        />

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-800">Ürün Yönetimi</h2>
            <p className="mt-1 text-sm text-slate-500">{state.filtered.length} ürün listelendi</p>
          </div>
          <div className="flex gap-3">
            <a href="/yonetim/xml-import" className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50">
              XML İçeri Aktar
            </a>
            <button onClick={() => state.setShowForm((v) => !v)} className="rounded-xl bg-[#ff6000] px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-[#d85000]">
              + Yeni Ürün Ekle
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-1">
          {(["DB", "XML"] as const).map((tab) => (
            <button key={tab} onClick={() => state.setActiveTab(tab)}
              className={`pb-3 px-6 text-sm font-black transition-all border-b-2 ${
                state.activeTab === tab ? "border-[#ff6000] text-[#ff6000]" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}>
              {tab === "DB" ? "📂 Envanter Ürünleri" : "⚡ XML Kataloğundan Gelenler"}
            </button>
          ))}
        </div>

        {/* Product Form */}
        {state.showForm && (
          <ProductFormModal
            editingProduct={state.editingProduct}
            form={state.form} setForm={state.setForm}
            imageSlots={state.imageSlots} setImageSlots={state.setImageSlots}
            variantGroups={state.variantGroups} setVariantGroups={state.setVariantGroups}
            extraServices={state.extraServices} setExtraServices={state.setExtraServices}
            categoryAttributes={state.categoryAttributes} setCategoryAttributes={state.setCategoryAttributes}
            categoryOptions={state.categoryOptions} setCategoryOptions={state.setCategoryOptions}
            categoryTree={state.categoryTree} setCategoryTree={state.setCategoryTree}
            brandOptions={state.brandOptions} setBrandOptions={state.setBrandOptions}
            categoryMainDraft={state.categoryMainDraft} setCategoryMainDraft={state.setCategoryMainDraft}
            categorySubDraft={state.categorySubDraft} setCategorySubDraft={state.setCategorySubDraft}
            brandDraft={state.brandDraft} setBrandDraft={state.setBrandDraft}
            error={state.error} saving={state.saving}
            onSave={state.handleSave}
            onCancel={() => { state.setShowForm(false); state.resetForm(); }}
            onImageChange={state.handleImageChange}
            addCategoryMain={state.addCategoryMain}
            addCategorySub={state.addCategorySub}
            addBrand={state.addBrand}
          />
        )}

        {/* Tab Content */}
        {state.activeTab === "DB" ? (
          <>
            <div className="flex flex-wrap gap-3">
              <input type="text" value={state.search} onChange={(e) => { state.setSearch(e.target.value); state.setPage(1); }}
                placeholder="Ürün, marka, barkod veya SKU ara..."
                className="w-72 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-[#ff6000]" />
              <select value={state.categoryFilter} onChange={(e) => { state.setCategoryFilter(e.target.value); state.setPage(1); }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#ff6000]">
                {state.categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            {state.selectedIds.size > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
                <span className="text-sm font-black text-[#ff5000]">{state.selectedIds.size} ürün seçildi</span>
                <button onClick={() => state.setBulkPriceModal(true)} disabled={bulkUpdating} className="px-3 py-1.5 bg-[#ff5000] text-white rounded-lg text-xs font-black hover:bg-[#e04800] transition-colors disabled:opacity-50">⚙️ Toplu İşlemler</button>
                <button onClick={() => handleBulkStatus(true)} disabled={bulkUpdating} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-emerald-600 hover:border-emerald-400 transition-colors disabled:opacity-50">✅ Aktif Yap</button>
                <button onClick={() => handleBulkStatus(false)} disabled={bulkUpdating} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-amber-600 hover:border-amber-400 transition-colors disabled:opacity-50">⏸️ Pasif Yap</button>
                <button onClick={handleBulkDelete} disabled={bulkUpdating} className="px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-bold text-red-600 hover:border-red-400 transition-colors disabled:opacity-50">🗑️ Toplu Sil</button>
                <button onClick={() => state.setSelectedIds(new Set())} disabled={bulkUpdating} className="ml-auto text-xs font-bold text-slate-500 hover:text-slate-700 disabled:opacity-50">Seçimi Kaldır</button>
              </div>
            )}

            <InventoryTable
              products={state.paginated}
              loading={state.loading}
              togglingId={state.togglingId}
              page={state.page}
              totalPages={state.totalPages}
              selectedIds={state.selectedIds}
              onToggleSelect={(id) => {
                state.setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id); else next.add(id);
                  return next;
                });
              }}
              onToggleSelectAll={() => {
                if (state.selectedIds.size === state.paginated.length) state.setSelectedIds(new Set());
                else state.setSelectedIds(new Set(state.paginated.map((p) => p._id)));
              }}
              onEdit={state.openEditForm}
              onDuplicate={(p) => { state.setDuplicateTarget(p); state.setDuplicateCount("1"); state.setDuplicateError(null); }}
              onDelete={state.setDeleteTarget}
              onToggleActive={state.handleToggleActive}
              onPageChange={state.setPage}
            />
          </>
        ) : (
          <XmlTab state={state} />
        )}
      </div>
    </ErrorBoundary>
  );
}
