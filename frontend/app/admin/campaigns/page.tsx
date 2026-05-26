"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { Package, Plus, Megaphone, Trash2, ImageIcon, X, Pencil } from "lucide-react";

type Campaign = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "INACTIVE" | "ENDED";
  _count?: { products: number };
};

/** Converts a relative imageUrl stored in DB (/uploads/…) to a URL
 *  reachable from the browser through Next.js → gateway → product-service. */
function getCampaignImageSrc(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  // /uploads/campaigns/xxx.jpg → /api/products/uploads/campaigns/xxx.jpg
  return `/api/products${imageUrl}`;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "10",
    startDate: "",
    endDate: "",
  });

  const fetchCampaigns = async () => {
    try {
      const res = await apiClient.get("/products/campaigns/admin");
      setCampaigns(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditingId(null);
    setForm({ title: "", description: "", discountType: "PERCENTAGE", discountValue: "10", startDate: "", endDate: "" });
  };

  const handleEdit = (camp: Campaign) => {
    setEditingId(camp.id);
    setForm({
      title: camp.title,
      description: camp.description || "",
      discountType: camp.discountType,
      discountValue: camp.discountValue.toString(),
      startDate: new Date(camp.startDate).toISOString().slice(0, 16),
      endDate: new Date(camp.endDate).toISOString().slice(0, 16),
    });
    setPreviewUrl(getCampaignImageSrc(camp.imageUrl));
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("discountType", form.discountType);
      formData.append("discountValue", form.discountValue);
      formData.append("startDate", form.startDate);
      formData.append("endDate", form.endDate);
      if (selectedFile) formData.append("image", selectedFile);

      const token = useAuthStore.getState().token;
      const deviceId = localStorage.getItem("bidunyam_device_id");
      const headers = { Authorization: `Bearer ${token}`, "x-device-id": deviceId };

      if (editingId) {
        await axios.put(`http://localhost:8080/products/campaigns/admin/${editingId}`, formData, { headers });
      } else {
        await axios.post("http://localhost:8080/products/campaigns/admin", formData, { headers });
      }
      closeModal();
      fetchCampaigns();
    } catch (err) {
      console.error(err);
      alert("Kampanya oluşturulurken bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kampanyalar</h1>
          <p className="text-sm font-semibold text-slate-500">Sistemdeki tüm kampanyaları yönetin.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#ff5000] text-white font-bold text-sm rounded-xl hover:bg-[#e64800] transition-all shadow-md shadow-[#ff5000]/20"
        >
          <Plus size={18} strokeWidth={3} />
          Yeni Kampanya
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-white rounded-2xl border border-slate-100" />
          <div className="h-20 bg-white rounded-2xl border border-slate-100" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((camp) => {
            const imgSrc = getCampaignImageSrc(camp.imageUrl);
            return (
              <div key={camp.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="h-40 bg-slate-100 relative">
                  {imgSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgSrc} alt={camp.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Megaphone size={48} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-black text-slate-700 shadow-sm">
                    {camp.status}
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-black text-lg text-slate-900 truncate">{camp.title}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1 line-clamp-2">{camp.description}</p>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-b border-slate-100">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">İndirim</p>
                      <p className="font-black text-emerald-600">
                        {camp.discountType === "PERCENTAGE" ? `%${camp.discountValue}` : `${camp.discountValue} TL`}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Katılımcı</p>
                      <p className="font-black text-blue-600">{camp._count?.products || 0} Ürün</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all">
                      Detaylar
                    </button>
                    <button onClick={() => handleEdit(camp)} className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all" title="Düzenle">
                      <Pencil size={16} />
                    </button>
                    <button className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all" title="Sil">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {campaigns.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 font-medium border-2 border-dashed border-slate-200 rounded-3xl">
              Henüz oluşturulmuş bir kampanya bulunmuyor.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-black text-slate-800">{editingId ? "Kampanyayı Düzenle" : "Yeni Kampanya Oluştur"}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Kampanya Adı</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff5000]/20 focus:border-[#ff5000] font-medium" placeholder="Örn: Yılbaşı İndirimi" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Açıklama</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff5000]/20 focus:border-[#ff5000] font-medium resize-none" rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">İndirim Tipi</label>
                  <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff5000]/20 focus:border-[#ff5000] font-medium appearance-none bg-white">
                    <option value="PERCENTAGE">Yüzdelik (%)</option>
                    <option value="FIXED_AMOUNT">Sabit Tutar (TL)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Kural Değeri</label>
                  <input required type="number" min="1" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff5000]/20 focus:border-[#ff5000] font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Başlangıç</label>
                  <input required type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff5000]/20 focus:border-[#ff5000] font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Bitiş</label>
                  <input required type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff5000]/20 focus:border-[#ff5000] font-medium" />
                </div>
              </div>

              {/* Image Upload with Live Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Kampanya Görseli</label>

                {previewUrl ? (
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-[#ff5000]/30 bg-slate-50 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Önizleme" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <button
                        type="button"
                        onClick={clearFile}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-rose-500 text-white rounded-full p-2 shadow-lg"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      {selectedFile?.name}
                    </span>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#ff5000] hover:bg-[#ff5000]/5 transition-all cursor-pointer group">
                    <ImageIcon size={28} className="text-slate-300 group-hover:text-[#ff5000] transition-colors mb-2" />
                    <span className="text-xs font-bold text-slate-400 group-hover:text-[#ff5000] transition-colors">Görsel seçmek için tıklayın</span>
                    <span className="text-[10px] text-slate-300 mt-1">PNG, JPG, WEBP — maks. 5MB</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all">
                  İptal
                </button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl font-bold bg-[#ff5000] text-white shadow-md shadow-[#ff5000]/20 hover:bg-[#e64800] transition-all disabled:opacity-50">
                  {submitting ? "İşleniyor..." : editingId ? "Değişiklikleri Kaydet" : "Kampanyayı Yarat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
