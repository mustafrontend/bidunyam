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

  // Upload yapılması
  const handleUpload = async () => {
    if (!preview) {
      setError("Lütfen önce preview yapınız");
      return;
    }

    if (!validateXmlUrl(xmlUrl)) {
      setError("Lütfen geçerli ve herkese açık bir XML linki giriniz (localhost/private link olmaz)");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.post("/products/admin/xml/import-url", {
        url: xmlUrl.trim(),
      });

      const data = response.data;

      if (!data.success) {
        setError(data.message || "Upload başarısız");
        return;
      }

      setSuccess(data as ImportResponse);
      setXmlUrl("");
      setPreview(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err: any) {
      const backendError = err?.response?.data?.error || err?.response?.data?.message;
      setError("Upload sırasında hata oluştu: " + (backendError || err.message));
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
                    Barkod: {product.barkodno} • Fiyat: {product.fiyat} TL • Stok: {product.stok}
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

          {/* Mock Database Orders */}
          {success.data?.mockDatabase && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-green-900">
                🔄 Veritabanına Yazılan {success.data.mockDatabase.ordersCreated} Sipariş:
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {success.data.mockDatabase.orders.map((order, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-green-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-bold text-slate-600">Sipariş ID</p>
                        <p className="text-sm font-mono text-green-700">{order._id}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                        {order.status}
                      </span>
                    </div>

                    {/* Order Items with Barcode */}
                    <div className="text-xs text-slate-600 mb-2">
                      <p className="font-semibold text-slate-900 mb-1">Ürünler ({order.items.length}):</p>
                      <div className="space-y-1 ml-2">
                        {order.items.map((item: any, i: number) => (
                          <div key={i} className="bg-slate-50 p-2 rounded">
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-slate-600">
                                📦 Barkod: <strong>{item.barcode || 'N/A'}</strong>
                              </span>
                              <span className="text-slate-600">
                                💰 Fiyat: <strong>{item.price} TL</strong>
                              </span>
                              <span className="text-slate-600">
                                🔢 Miktar: <strong>{item.quantity}</strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t border-green-100 pt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-600">
                        Toplam Tutar: <strong className="text-green-700">{order.totalAmount} TL</strong>
                      </span>
                      <span className="text-xs text-slate-600">
                        XML Adı: <strong>{order.xmlFileName}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Details */}
          {success.data?.productDetails && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-green-900">📦 Ürün Detayları (İlk 5):</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {success.data.productDetails.map((p: any, idx: number) => (
                  <div key={idx} className="text-xs bg-white p-2 rounded border border-green-100">
                    <p className="font-semibold text-slate-900">{p.urunAdi}</p>
                    <div className="text-slate-600 mt-1">
                      📦 {p.barkodno} • 💰 {p.fiyat} TL • 🏷️ {p.marka}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
