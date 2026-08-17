"use client";

import React, { useState, useRef } from "react";
import { apiClient } from "@/lib/api";

interface PreviewData {
  totalProducts: number;
  validProducts: number;
  invalidProducts: number;
  errors: Record<string, string[]>;
  rawProduct?: Record<string, string>;
  preview: any[];
}

interface ImportResponse {
  success: boolean;
  message: string;
  totalProducts: number;
  xmlFileName: string;
  importedAt: string;
  data: {
    publication?: {
      requestId: string;
      status: string;
      totalProducts: number;
      buyerCatalogUrl: string;
    };
    mockDatabase: {
      ordersCreated: number;
      orders: any[];
    };
    productDetails: any[];
  };
}

// Hedef alanların Türkçe etiketleri + zorunluluk (dinamik eşleme UI'ı için)
const FIELD_META: Record<string, { label: string; hint: string; required?: boolean }> = {
  urunKodu: { label: "Ürün Kodu / Barkod", hint: "Benzersiz kimlik", required: true },
  urunAdi: { label: "Ürün Adı", hint: "Başlık", required: true },
  fiyat: { label: "Fiyat", hint: "Satış fiyatı", required: true },
  stok: { label: "Stok", hint: "Adet" },
  kategori: { label: "Kategori", hint: "Kategori adı" },
  marka: { label: "Marka", hint: "Üretici" },
  resim: { label: "Görsel URL", hint: "Ürün fotoğrafı" },
  aciklama: { label: "Açıklama", hint: "Ürün detayı" },
  tax: { label: "KDV Oranı", hint: "Vergi %" },
  desi: { label: "Desi", hint: "Kargo desi" },
};

export const XMLUploadComponent: React.FC = () => {
  const [xmlUrl, setXmlUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ImportResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Yeni eklentiler: Dinamik Mapping ve Cron Görevi
  const [feedName, setFeedName] = useState("");
  const [fieldMapping, setFieldMapping] = useState({
    urunKodu: "",
    urunAdi: "",
    kategori: "",
    fiyat: "",
    stok: "",
    aciklama: "",
    resim: "",
    marka: "",
    tax: "",
    desi: "",
  });

  // Örnek XML dosyası indir
  const handleDownloadSample = async () => {
    try {
      const response = await apiClient.get("/products/admin/xml/sample", {
        responseType: "blob",
      });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sample-urunler.xml";
      a.click();
    } catch (err) {
      setError("Örnek dosya indirilenemedi");
    }
  };

  const validateXmlUrl = (value: string) => {
    try {
      const parsed = new URL(value.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) return false;

      const host = parsed.hostname.toLowerCase();
      const isLocalhost = host === "localhost" || host === "127.0.0.1" || host === "::1";
      const isPrivateIpv4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host);

      return !(isLocalhost || isPrivateIpv4);
    } catch {
      return false;
    }
  };

  // Preview yapılması
  const handlePreview = async () => {
    if (!validateXmlUrl(xmlUrl)) {
      setError("Lütfen geçerli ve herkese açık bir XML linki giriniz (localhost/private link olmaz)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Seçili alan eşlemesini de gönder → önizleme eşlemeyi yansıtsın
      const cleanedMapping: Record<string, string> = {};
      Object.entries(fieldMapping).forEach(([k, v]) => {
        if (v && String(v).trim() !== "") cleanedMapping[k] = String(v).trim();
      });

      const response = await apiClient.post("/products/admin/xml/preview-url", {
        url: xmlUrl.trim(),
        ...(Object.keys(cleanedMapping).length > 0 ? { fieldMapping: cleanedMapping } : {}),
      });

      const data = response.data;

      if (!data.success) {
        setError(data.error || "Preview oluşturulamadı");
        return;
      }

      setPreview(data);
    } catch (err: any) {
      const backendError = err?.response?.data?.error || err?.response?.data?.message;
      setError("Preview oluşturulamadı: " + (backendError || err.message));
    } finally {
      setLoading(false);
    }
  };



  const handleCreateFeed = async () => {
    if (!validateXmlUrl(xmlUrl)) {
      setError("Lütfen geçerli bir XML linki giriniz");
      return;
    }
    if (!feedName.trim()) {
      setError("Lütfen bir entegrasyon adı belirleyin (Örn: Tedarikçi X)");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    // Boş olan eşleştirmeleri temizle
    const cleanedMapping: Record<string, string> = {};
    Object.entries(fieldMapping).forEach(([k, v]) => {
      if (v.trim()) cleanedMapping[k] = v.trim();
    });

    try {
      const response = await apiClient.post("/products/admin/xml/feeds", {
        name: feedName,
        url: xmlUrl.trim(),
        syncInterval: 60,
        fieldMapping: cleanedMapping,
      });

      const data = response.data;

      if (!data.success) {
        setError(data.message || "Feed oluşturulamadı");
        return;
      }

      setSuccess({
        success: true,
        // Satıcı feed'leri admin onayına düşer; admin'in eklediği feed anında senkronlanır
        message:
          data.message ||
          "Entegrasyon başarıyla kaydedildi! İlk senkronizasyon arka planda başlatıldı. Birazdan ürünler kataloğa eklenecektir.",
        xmlFileName: feedName,
        importedAt: new Date().toISOString(),
      } as any);
      setXmlUrl("");
      setPreview(null);
      setFeedName("");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err: any) {
      const backendError = err?.response?.data?.error || err?.response?.data?.message;
      setError("Görev oluşturulamadı: " + (backendError || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAutoMatch = () => {
    if (!preview || !preview.rawProduct) return;

    const keywords: Record<string, string[]> = {
      urunKodu: ['barcode', 'barkod', 'productcode', 'urun_kodu', 'item_code', 'sku', 'id'],
      urunAdi: ['name', 'title', 'urunadi', 'urun_adi', 'productname', 'baslik'],
      kategori: ['category', 'kategori', 'maincategory', 'kategori_adi', 'cat'],
      fiyat: ['price', 'fiyat', 'satis_fiyati', 'listprice', 'amount', 'peşin_fiyat'],
      stok: ['stock', 'stok', 'quantity', 'miktar', 'adet'],
      aciklama: ['description', 'aciklama', 'detail', 'detay', 'icerik', 'info'],
      resim: ['image', 'resim', 'picture', 'photo', 'img', 'gorsel', 'link', 'resim_1'],
      marka: ['brand', 'marka', 'brandname', 'manufacturer'],
      tax: ['tax', 'kdv', 'vergi', 'taxrate'],
      desi: ['desi', 'weight', 'agirlik', 'hacim']
    };

    const rawKeys = Object.keys(preview.rawProduct);
    const newMapping = { ...fieldMapping };

    Object.keys(keywords).forEach((targetField) => {
      const syns = keywords[targetField];
      // Try to find a matching raw key
      const match = rawKeys.find(rk => {
        const lowerKey = rk.toLowerCase();
        return syns.some(syn => lowerKey.includes(syn));
      });
      if (match) {
        (newMapping as any)[targetField] = match;
      }
    });

    setFieldMapping(newMapping);
  };

  const priceTL = (n: number) =>
    Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL";

  // Akış durumu: hangi adımdayız?
  const urlValid = validateXmlUrl(xmlUrl);
  const step = success ? 4 : preview ? 2 : 1;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Başlık + adım göstergesi */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">XML ile Toplu Ürün Ekle</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tedarikçinizin XML linkini yapıştırın; ürünler otomatik okunur, onaydan sonra mağazanıza eklenir.
        </p>

        <ol className="mt-5 flex flex-wrap items-center gap-2 text-xs font-black">
          {[
            { n: 1, label: "Linki Yapıştır" },
            { n: 2, label: "Önizle & Kontrol Et" },
            { n: 3, label: "Kaydet" },
          ].map((s, i) => (
            <li key={s.n} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  step > s.n || step === 4
                    ? "bg-emerald-500 text-white"
                    : step === s.n
                      ? "bg-[#ff6000] text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {step > s.n || step === 4 ? "✓" : s.n}
              </span>
              <span className={step >= s.n ? "text-slate-800" : "text-slate-400"}>{s.label}</span>
              {i < 2 && <span className="mx-1 h-px w-6 bg-slate-200" />}
            </li>
          ))}
        </ol>
      </div>

      {/* ADIM 1 — XML linki + büyük Önizle butonu */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-black text-slate-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ff6000] text-xs text-white">1</span>
            XML Linkini Yapıştırın
          </label>
          <button onClick={handleDownloadSample} className="text-xs font-bold text-blue-600 hover:underline">
            📥 Örnek XML indir
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            ref={inputRef}
            type="url"
            value={xmlUrl}
            onChange={(e) => {
              setXmlUrl(e.target.value);
              setError(null);
              setPreview(null);
              setSuccess(null);
            }}
            placeholder="https://tedarikci.com/xml.php?id=91"
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-[#ff6000] focus:bg-white"
          />
          <button
            onClick={handlePreview}
            disabled={!urlValid || loading}
            className="shrink-0 rounded-xl bg-[#ff6000] px-6 py-3 text-sm font-black text-white transition-colors hover:bg-[#e05500] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading && !preview ? "⏳ Okunuyor…" : "👁️ Ürünleri Önizle"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {xmlUrl && !urlValid
            ? "⚠️ Geçerli, herkese açık bir http/https linki girin (localhost olmaz)."
            : "Linki yapıştırıp “Ürünleri Önizle”ye basın — hiçbir şey kaydedilmez, önce görürsünüz."}
        </p>
      </div>

      {/* ADIM 2 — Önizleme */}
      {preview && (
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ff6000] text-xs text-white">2</span>
            <h3 className="text-sm font-black text-slate-900">Ürünleri Kontrol Edin</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">Toplam Ürün</p>
              <p className="text-2xl font-black text-slate-900">{preview.totalProducts}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-bold text-emerald-600">Geçerli</p>
              <p className="text-2xl font-black text-emerald-600">{preview.validProducts}</p>
            </div>
            <div className={`rounded-xl p-4 ${preview.invalidProducts > 0 ? "bg-red-50" : "bg-slate-50"}`}>
              <p className={`text-xs font-bold ${preview.invalidProducts > 0 ? "text-red-600" : "text-slate-500"}`}>Hatalı</p>
              <p className={`text-2xl font-black ${preview.invalidProducts > 0 ? "text-red-600" : "text-slate-400"}`}>
                {preview.invalidProducts}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
            💡 Aşağıdaki <b>fiyatların doğru</b> geldiğini kontrol edin. Yanlışsa “Alan eşleştirme”den fiyat alanını düzeltin.
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["", "Ürün", "Barkod", "Kategori", "Fiyat", "Stok"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-[11px] font-black uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {preview.preview.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2.5">
                      {p.resim ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.resim} alt="" className="h-10 w-10 rounded-lg bg-slate-100 object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">📦</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="max-w-[220px] truncate font-bold text-slate-800">{p.urunAdi}</p>
                      {p.marka && p.marka !== "N/A" && <p className="text-[11px] text-slate-400">{p.marka}</p>}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{p.barkodno}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">
                      {p.kategori}
                      {p.altKategori && p.altKategori !== "N/A" ? ` › ${p.altKategori}` : ""}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className="font-black text-slate-900">{priceTL(p.fiyat)}</span>
                      {p.listeFiyati > 0 && (
                        <span className="ml-1 text-[11px] text-slate-400 line-through">{priceTL(p.listeFiyati)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`font-bold ${p.stok < 5 ? "text-red-500" : "text-slate-700"}`}>{p.stok}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400">
            İlk {preview.preview.length} ürün gösteriliyor. Kaydettiğinizde tüm {preview.totalProducts} ürün aktarılır.
          </p>

          {Object.keys(preview.errors).length > 0 && (
            <details className="rounded-xl bg-red-50 p-4">
              <summary className="cursor-pointer text-sm font-black text-red-800">
                ⚠️ {Object.keys(preview.errors).length} hatalı ürün (tıklayıp görün)
              </summary>
              <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
                {Object.entries(preview.errors).map(([index, errs]) => (
                  <div key={index} className="text-xs text-red-700">
                    <b>Ürün {parseInt(index) + 1}:</b> {(errs as string[]).join(", ")}
                  </div>
                ))}
              </div>
            </details>
          )}

          <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-black text-slate-800">
              ⚙️ Fiyat/kategori yanlış mı geliyor? Alan eşleştirmeyi aç
            </summary>
            <p className="mt-2 text-xs text-slate-500">
              XML’iniz farklı etiket adları kullanıyorsa (örn. fiyat yerine <code>satis</code>), doğru XML alanını seçip
              yeniden önizleyin.
            </p>
            {preview.rawProduct && Object.keys(preview.rawProduct).length > 0 && (
              <button
                onClick={handleAutoMatch}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#ff6000] px-4 py-2 text-sm font-bold text-white hover:bg-[#e05500]"
              >
                ✨ Otomatik Eşleştir
              </button>
            )}
            {(() => {
              const detected = preview.rawProduct ? Object.keys(preview.rawProduct) : [];
              const sample = (k: string) => {
                const v = (preview.rawProduct as any)?.[k];
                const str = v === undefined || v === null ? "" : String(v);
                return str.length > 40 ? str.slice(0, 40) + "…" : str;
              };
              if (detected.length === 0) return null;
              return (
                <>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.keys(fieldMapping).map((key) => {
                      const meta = FIELD_META[key] || { label: key, hint: "" };
                      const selected = (fieldMapping as any)[key] as string;
                      return (
                        <div key={key} className="rounded-lg border border-slate-200 bg-white p-2.5">
                          <label className="mb-1 flex items-center gap-1 text-xs font-black text-slate-700">
                            {meta.label}
                            {meta.required && <span className="text-red-500">*</span>}
                          </label>
                          <select
                            value={selected}
                            onChange={(e) => setFieldMapping({ ...fieldMapping, [key]: e.target.value })}
                            className={`w-full rounded border px-2 py-1.5 text-sm outline-none focus:border-[#ff6000] ${
                              !selected && meta.required ? "border-red-200 bg-red-50/40" : "border-slate-200"
                            }`}
                          >
                            <option value="">— Otomatik / Yok —</option>
                            {detected.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 truncate text-[11px] text-slate-400" title={selected ? sample(selected) : meta.hint}>
                            {selected ? (
                              <>
                                <span className="font-semibold text-emerald-600">örnek:</span> {sample(selected) || "(boş)"}
                              </>
                            ) : (
                              meta.hint
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={handlePreview}
                    disabled={loading}
                    className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition-colors hover:border-[#ff6000] hover:text-[#ff6000] disabled:opacity-50"
                  >
                    {loading ? "⏳ Uygulanıyor…" : "🔄 Eşlemeyi Uygula ve Yeniden Önizle"}
                  </button>
                </>
              );
            })()}
          </details>
        </div>
      )}

      {/* ADIM 3 — Kaydet */}
      {preview && !success && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ff6000] text-xs text-white">3</span>
            <h3 className="text-sm font-black text-slate-900">Kaydet ve Otomatik Güncellemeyi Başlat</h3>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700">Bu entegrasyona bir ad verin</label>
            <input
              type="text"
              value={feedName}
              onChange={(e) => setFeedName(e.target.value)}
              placeholder="Örn: Tedarikçi A — Elektronik"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000] focus:bg-white sm:w-2/3"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Kaydedince bu XML her saat otomatik kontrol edilir; fiyat ve stok kendiliğinden güncellenir.
            </p>
          </div>
          <button
            onClick={handleCreateFeed}
            disabled={loading || !feedName.trim()}
            className="w-full rounded-xl bg-[#ff6000] px-6 py-3.5 text-sm font-black text-white transition-colors hover:bg-[#e05500] disabled:opacity-50"
          >
            {loading ? "⏳ Kaydediliyor..." : "🚀 Kaydet & Ürünleri Aktar"}
          </button>
        </div>
      )}

      {/* Hata */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <p className="mb-0.5 font-bold">❌ Bir sorun oldu</p>
          <p>{error}</p>
        </div>
      )}

      {/* BAŞARILI — toplu işleme yönlendir */}
      {success && (
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div>
            <p className="text-base font-black text-emerald-900">✅ {success.message}</p>
            <p className="mt-1 text-xs text-emerald-700">
              Entegrasyon: <strong>{success.xmlFileName}</strong>
              {success.data?.publication && (
                <>
                  {" "}
                  • Aktarılan ürün: <strong>{success.data.publication.totalProducts}</strong>
                </>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-white p-4">
            <p className="text-sm font-black text-slate-800">💰 Şimdi toplu fiyat işlemi yapın</p>
            <p className="mt-1 text-xs text-slate-500">
              Bu XML’den gelen tüm ürünlere tek seferde kâr marjı ekleyebilir, indirim uygulayabilir veya fiyatları
              toptan güncelleyebilirsiniz. Kurallarınız her senkronda korunur.
            </p>
            <a
              href="/yonetim/urunler?tab=xml"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800"
            >
              ⚙️ Ürünleri Gör & Toplu Fiyat Uygula →
            </a>
          </div>

          <button
            onClick={() => {
              setSuccess(null);
              setPreview(null);
              setXmlUrl("");
              setFeedName("");
            }}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            + Yeni bir XML daha ekle
          </button>
        </div>
      )}

      {/* Yardım kutusu */}
      {!preview && !success && (
        <div className="space-y-1.5 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
          <p className="font-bold text-slate-700">📝 Nasıl çalışır?</p>
          <ul className="ml-1 list-inside list-disc space-y-1">
            <li>Tedarikçinizin verdiği XML linkini yukarı yapıştırın.</li>
            <li>“Ürünleri Önizle” ile fiyat, stok ve kategorilerin doğru geldiğini görün.</li>
            <li>Doğruysa bir ad verip kaydedin — ürünler onaydan sonra mağazanıza eklenir.</li>
            <li>
              Sonra tüm ürünlere <b>toptan fiyat/kâr işlemi</b> uygulayabilirsiniz.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
