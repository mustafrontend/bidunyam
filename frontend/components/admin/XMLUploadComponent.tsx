"use client";

import React, { useState, useRef } from "react";
import { apiClient } from "@/lib/api";

interface PreviewData {
  totalProducts: number;
  validProducts: number;
  invalidProducts: number;
  errors: Record<string, string[]>;
  preview: any[];
}

export const XMLUploadComponent: React.FC = () => {
  const [xmlUrl, setXmlUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Örnek XML dosyası indir
  const handleDownloadSample = async () => {
    try {
      const response = await apiClient.get("/product/admin/xml/sample", {
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
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  // Preview yapılması
  const handlePreview = async () => {
    if (!validateXmlUrl(xmlUrl)) {
      setError("Lütfen geçerli bir XML linki giriniz");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post("/product/admin/xml/preview-url", {
        url: xmlUrl.trim(),
      });

      const data = response.data;

      if (!data.success) {
        setError(data.error || "Preview oluşturulamadı");
        return;
      }

      setPreview(data);
    } catch (err: any) {
      setError("Preview oluşturulamadı: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Upload yapılması
  const handleUpload = async () => {
    if (!preview) {
      setError("Lütfen önce preview yapınız");
      return;
    }

    if (!validateXmlUrl(xmlUrl)) {
      setError("Lütfen geçerli bir XML linki giriniz");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.post("/product/admin/xml/import-url", {
        url: xmlUrl.trim(),
      });

      const data = response.data;

      if (!data.success) {
        setError(data.message || "Upload başarısız");
        return;
      }

      setSuccess(`${data.totalProducts} ürün başarıyla yüklendi!`);
      setXmlUrl("");
      setPreview(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err: any) {
      setError("Upload sırasında hata oluştu: " + err.message);
    } finally {
      setLoading(false);
    }
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
                    Kod: {product.urunKodu} • Fiyat: {product.fiyat} TL • Stok: {product.stok}
                  </p>
                </div>
              ))}
            </div>
          </div>
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
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          <p className="font-semibold mb-1">✅ Başarı</p>
          <p>{success}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handlePreview}
          disabled={!validateXmlUrl(xmlUrl) || loading}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {loading ? "⏳ Yükleniyor..." : "👁️ Önizle"}
        </button>
        <button
          onClick={handleUpload}
          disabled={!preview || loading}
          className="flex-1 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "⏳ Yükleniyor..." : "🚀 Yükle"}
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
