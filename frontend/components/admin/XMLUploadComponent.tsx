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
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File seçildiğinde
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // XML dosya kontrolü
      if (!selectedFile.name.endsWith(".xml")) {
        setError("Lütfen XML dosyası seçiniz");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("Dosya boyutu 10MB'den küçük olmalıdır");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setPreview(null);
    }
  };

  // Örnek XML dosyası indir
  const handleDownloadSample = async () => {
    try {
      const response = await fetch("http://localhost:8080/product/admin/xml/sample");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sample-urunler.xml";
      a.click();
    } catch (err) {
      setError("Örnek dosya indirilenemedi");
    }
  };

  // Preview yapılması
  const handlePreview = async () => {
    if (!file) {
      setError("Lütfen dosya seçiniz");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8080/product/admin/xml/preview", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
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
    if (!file) {
      setError("Lütfen dosya seçiniz");
      return;
    }

    if (!preview) {
      setError("Lütfen önce preview yapınız");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8080/product/admin/xml/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Upload başarısız");
        return;
      }

      setSuccess(`${data.totalProducts} ürün başarıyla yüklendi!`);
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
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
          XML dosyası kullanarak toplu ürün yüklemeleri yapabilirsiniz.
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

      {/* File Upload Section */}
      <div className="rounded-lg border border-slate-200 p-6">
        <label className="block text-sm font-semibold text-slate-900 mb-3">
          XML Dosyası Seç
        </label>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            onChange={handleFileSelect}
            disabled={loading}
            className="flex-1 text-sm text-slate-500 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
          />
          {file && (
            <span className="text-sm font-medium text-green-600">
              ✓ {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </span>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {preview && (
        <div className="rounded-lg border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">📊 Dosya Özeti</h3>

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
          disabled={!file || loading}
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
          <li>Maksimum dosya boyutu: 10MB</li>
          <li>Fiyat ve stok sayısal değerler olmalıdır</li>
        </ul>
      </div>
    </div>
  );
};
