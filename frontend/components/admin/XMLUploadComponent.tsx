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
      const response = await apiClient.post("/products/admin/xml/preview-url", {
        url: xmlUrl.trim(),
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
        message: "Entegrasyon başarıyla kaydedildi! İlk senkronizasyon arka planda başlatıldı. Birazdan ürünler kataloğa eklenecektir.",
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

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">XML ile Ürün İçeri Aktar</h1>
        <p className="mt-2 text-slate-500">
          XML linki kullanarak toplu ürün yüklemeleri yapabilirsiniz.
        </p>
      </div>

      {/* Sample XML Download */}
      <div className="rounded-lg border border-slate-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900 font-medium mb-2">📋 XML Format Örneği</p>
        <p className="text-xs text-blue-700 mb-3">
          Doğru formatı kullanmak için örnek XML dosyasını indirebilirsiniz.
        </p>
        <button
          onClick={handleDownloadSample}
          className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          📥 Örnek XML İndir
        </button>
      </div>

      {/* XML URL Section */}
      <div className="rounded-lg border border-slate-200 p-6">
        <label className="block text-sm font-semibold text-slate-900 mb-3">
          XML Linki
        </label>
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="url"
            value={xmlUrl}
            onChange={(e) => {
              setXmlUrl(e.target.value);
              setError(null);
              setPreview(null);
            }}
            placeholder="https://www.dropsepetim.com/012546xml.php?mid=91"
            disabled={loading}
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]"
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Örnek: https://www.dropsepetim.com/012546xml.php?mid=91
        </p>
      </div>

      {/* Preview Section */}
      {preview && (
        <div className="rounded-lg border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">📊 XML Özeti</h3>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-600">Toplam Ürün</p>
              <p className="text-2xl font-bold text-slate-900">{preview.totalProducts}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-xs text-green-600">Geçerli Ürün</p>
              <p className="text-2xl font-bold text-green-600">{preview.validProducts}</p>
            </div>
            <div className={`rounded-lg p-4 ${preview.invalidProducts > 0 ? "bg-red-50" : "bg-green-50"}`}>
              <p className={`text-xs ${preview.invalidProducts > 0 ? "text-red-600" : "text-green-600"}`}>
                Hatalı Ürün
              </p>
              <p className={`text-2xl font-bold ${preview.invalidProducts > 0 ? "text-red-600" : "text-green-600"}`}>
                {preview.invalidProducts}
              </p>
            </div>
          </div>

          {/* Errors */}
          {Object.keys(preview.errors).length > 0 && (
            <div className="rounded-lg bg-red-50 p-4">
              <p className="font-medium text-red-900 mb-2">⚠️ Hatalı Ürünler</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(preview.errors).map(([index, errors]) => (
                  <div key={index} className="text-xs text-red-700">
                    <p className="font-semibold">Ürün {parseInt(index) + 1}:</p>
                    <ul className="list-disc list-inside ml-2">
                      {errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Products */}
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-3">Ürün Önizlemesi (İlk 10)</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {preview.preview.map((product, idx) => (
                <div key={idx} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-900">{product.urunAdi}</p>
                  <p className="text-xs text-slate-600">
                    Barkod: {product.barkodno} • Fiyat: {product.fiyat} TL • Stok: {product.stok}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Mapping Section */}
      {preview && (
        <div className="rounded-lg border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">⚙️ XML Alan Eşleştirme & Otomatik Güncelleme (Opsiyonel)</h3>
          <p className="text-xs text-slate-500">
            Eğer XML dosyanız varsayılan alan adlarını kullanmıyorsa, aşağıdaki alanlara XML etiketlerinizi yazarak eşleştirebilirsiniz. Saatlik otomatik senkronizasyon başlatmak için entegrasyon adı belirleyip "Otomatik Görev Oluştur" butonuna basınız.
          </p>

          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700">Entegrasyon Adı (Örn: Tedarikçi A)</label>
              <input type="text" value={feedName} onChange={(e) => setFeedName(e.target.value)} className="mt-1 w-1/2 rounded border px-2 py-1 text-sm outline-none" />
            </div>
            {preview.rawProduct && Object.keys(preview.rawProduct).length > 0 && (
              <button
                onClick={handleAutoMatch}
                className="ml-4 inline-flex items-center gap-2 rounded-lg bg-[#ff6000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e05500] transition-colors"
              >
                ✨ Akıllı Eşleştir
              </button>
            )}
          </div>

          {preview.rawProduct && Object.keys(preview.rawProduct).length > 0 && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mt-4">
              <p className="text-xs font-semibold text-blue-900 mb-2">📋 XML Dosyasında Bulunan Örnek Ürün Verisi (Kopyalayabilirsiniz):</p>
              <div className="max-h-64 overflow-y-auto bg-white rounded border border-blue-200 p-3 shadow-inner text-xs font-mono space-y-1">
                {Object.entries(preview.rawProduct).map(([k, v]) => (
                  <div key={k} className="flex border-b border-slate-100 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                    <span className="w-1/3 text-blue-800 font-semibold select-all break-all pr-2">{k}</span>
                    <span className="w-2/3 text-slate-600 truncate" title={String(v)}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 bg-slate-50 p-4 rounded-lg">
            {Object.keys(fieldMapping).map((key) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-slate-700 capitalize">{key}</label>
                <input
                  type="text"
                  placeholder="XML etiketi (örn: price)"
                  value={(fieldMapping as any)[key]}
                  onChange={(e) => setFieldMapping({ ...fieldMapping, [key]: e.target.value })}
                  className="mt-1 w-full rounded border px-2 py-1 text-sm outline-none focus:border-blue-500"
                />
              </div>
            ))}
          </div>
          
          <button
            onClick={handleCreateFeed}
            disabled={loading || !feedName.trim()}
            className="w-full rounded-lg bg-[#ff6000] px-6 py-3 text-sm font-black text-white hover:bg-[#e05500] disabled:opacity-50 transition-colors"
          >
            {loading ? "⏳ İşleniyor..." : "🚀 Kaydet & Otomatik Güncellemeyi Başlat"}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold mb-1">❌ Hata</p>
          <p>{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="rounded-lg bg-green-50 p-6 space-y-4 border border-green-200">
          <div>
            <p className="font-semibold mb-1 text-green-900">✅ {success.message}</p>
            <p className="text-xs text-green-700">
              XML Adı: <strong>{success.xmlFileName}</strong> • Tarihi: <strong>{new Date(success.importedAt).toLocaleString('tr-TR')}</strong>
            </p>
            {success.data?.publication && (
              <p className="mt-1 text-xs text-green-800">
                Yayın İsteği: <strong>{success.data.publication.requestId}</strong> • Durum: <strong>{success.data.publication.status}</strong> • Satışa Açılan Ürün: <strong>{success.data.publication.totalProducts}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handlePreview}
          disabled={!validateXmlUrl(xmlUrl) || loading}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {loading ? "⏳ Yükleniyor..." : "👁️ XML Bağlantısını Önizle"}
        </button>
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-600 space-y-1">
        <p>📝 <strong>XML Format Gereksinimleri:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Tüm ürünler &lt;urunler&gt; tag'ı altında &lt;urun&gt; elemanları olmalıdır</li>
          <li>Gerekli alanlar: urunKodu, urunAdi, fiyat, stok</li>
          <li>Opsiyonel alanlar: kategori, aciklama, resim, marka</li>
          <li>Link https/http olmalı ve XML döndürmelidir</li>
          <li>Maksimum dosya boyutu: 10MB</li>
          <li>Fiyat ve stok sayısal değerler olmalıdır</li>
        </ul>
      </div>
    </div>
  );
};
