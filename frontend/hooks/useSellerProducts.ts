"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { useSellerAuthStore } from "@/stores/sellerAuthStore";

export interface Product {
  _id: string;
  barcode?: string;
  sku?: string;
  modelCode?: string;
  name: string;
  brand: string;
  category: string;
  categoryPath?: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  isActive: boolean;
  imageUrl: string;
  imageUrls?: string[];
  rating: number;
  reviewCount: number;
}

export type VariantGroup = {
  name: string;
  type: "COLOR" | "SIZE" | "CUSTOM";
  valuesText: string;
};

export type ExtraService = {
  name: string;
  price: string;
  description: string;
};

export type CategoryTree = Record<string, string[]>;

export type CategoryAttribute = { key: string; value: string };

export type FormState = {
  barcode: string;
  modelCode: string;
  sku: string;
  name: string;
  categoryMain: string;
  categorySub: string;
  brand: string;
  originalPrice: string;
  price: string;
  vatRate: "1" | "10" | "20";
  purchasePrice: string;
  stock: string;
  shortDescription: string;
  description: string;
  bulletPoints: string;
  desi: string;
  preparationDays: string;
  shippingType: "SELF_SHIPPING" | "MARKETPLACE_LOGISTICS";
  saleStatus: "ACTIVE" | "PASSIVE";
  approvalStatus: "APPROVED" | "REJECTED" | "PENDING";
};

export interface XmlCatalogData {
  request: {
    xmlFileName: string;
    sourceUrl: string;
    createdAt: string;
  } | null;
  products: XmlProduct[];
}

export interface XmlProduct {
  _id: string;
  name: string;
  barcode?: string;
  brand?: string;
  category?: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export interface XmlHistoryItem {
  xmlFileName: string;
  createdAt: string;
  totalProducts: number;
}

export const EMPTY_FORM: FormState = {
  barcode: "",
  modelCode: "",
  sku: "",
  name: "",
  categoryMain: "",
  categorySub: "",
  brand: "",
  originalPrice: "",
  price: "",
  vatRate: "20",
  purchasePrice: "",
  stock: "",
  shortDescription: "",
  description: "",
  bulletPoints: "",
  desi: "0",
  preparationDays: "1",
  shippingType: "MARKETPLACE_LOGISTICS",
  saleStatus: "ACTIVE",
  approvalStatus: "PENDING",
};

export const EMPTY_IMAGES = Array.from({ length: 5 }, () => "");

export const DEFAULT_VARIANTS: VariantGroup[] = [
  { name: "Renk", type: "COLOR", valuesText: "Siyah|0|10\nBeyaz|0|8" },
  { name: "Beden", type: "SIZE", valuesText: "S|0|4\nM|0|6\nL|0|5" },
];

export const DEFAULT_EXTRA_SERVICES: ExtraService[] = [
  { name: "Kurulum Hizmeti", price: "0", description: "Ürün tesliminde kurulum desteği" },
];

export function parseBullets(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean)
    .slice(0, 5);
}

export function parseVariants(groups: VariantGroup[]) {
  return groups
    .map((group) => ({
      name: group.name.trim(),
      type: group.type,
      values: group.valuesText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [label = "", price = "0", stock = "0"] = line.split("|").map((p) => p.trim());
          return { label, price: Number(price || 0), stock: Number(stock || 0) };
        })
        .filter((item) => item.label),
    }))
    .filter((group) => group.name && group.values.length > 0);
}

export function parseExtraServices(rows: ExtraService[]) {
  return rows
    .map((row) => ({ name: row.name.trim(), price: Number(row.price || 0), description: row.description.trim() }))
    .filter((row) => row.name);
}

export function splitCategoryPath(path?: string) {
  const [main = "", sub = ""] = (path || "").split(">").map((p) => p.trim());
  return { main: main || "Genel", sub };
}

function buildCategoryTree(products: Product[]): CategoryTree {
  const tree: CategoryTree = {};
  products.forEach((product) => {
    const { main, sub } = splitCategoryPath(product.categoryPath || product.category);
    if (!tree[main]) tree[main] = [];
    if (sub && !tree[main].includes(sub)) tree[main].push(sub);
  });
  return Object.fromEntries(
    Object.entries(tree).map(([main, subs]) => [main, subs.sort((a, b) => a.localeCompare(b, "tr"))])
  );
}

function toCategoryTree(categories: Array<{ name: string; subCategories: string[] }>): CategoryTree {
  return Object.fromEntries(
    categories.map((item) => [item.name, [...item.subCategories].sort((a, b) => a.localeCompare(b, "tr"))])
  );
}

function getUniqueValues(products: Product[], selector: (p: Product) => string | undefined): string[] {
  return Array.from(
    new Set(products.map(selector).map((v) => v?.trim()).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b, "tr"));
}

const MAX_UPLOAD_DIMENSION = 1400;
const IMAGE_QUALITY = 0.78;

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

export async function compressImageToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) return fileToDataUrl(file);
  const sourceDataUrl = await fileToDataUrl(file);
  const sourceImage = await loadImage(sourceDataUrl);
  const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(sourceImage.width, sourceImage.height));
  const width = Math.max(1, Math.round(sourceImage.width * scale));
  const height = Math.max(1, Math.round(sourceImage.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return sourceDataUrl;
  context.drawImage(sourceImage, 0, 0, width, height);
  const compressed = canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
  return compressed.length < sourceDataUrl.length ? compressed : sourceDataUrl;
}

export function useSellerProducts() {
  const { token } = useSellerAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Tumu");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTree>({});
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [categoryMainDraft, setCategoryMainDraft] = useState("");
  const [categorySubDraft, setCategorySubDraft] = useState("");
  const [brandDraft, setBrandDraft] = useState("");
  const [imageSlots, setImageSlots] = useState<string[]>(EMPTY_IMAGES);
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>(DEFAULT_VARIANTS);
  const [extraServices, setExtraServices] = useState<ExtraService[]>(DEFAULT_EXTRA_SERVICES);
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
  const [duplicateTarget, setDuplicateTarget] = useState<Product | null>(null);
  const [duplicateCount, setDuplicateCount] = useState("1");
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Bulk operation states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPriceModal, setBulkPriceModal] = useState(false);

  // XML States
  const [activeTab, setActiveTab] = useState<"DB" | "XML">("DB");
  const [xmlLoading, setXmlLoading] = useState(false);
  const [xmlData, setXmlData] = useState<XmlCatalogData | null>(null);
  const [xmlHistory, setXmlHistory] = useState<XmlHistoryItem[]>([]);
  const [xmlFeeds, setXmlFeeds] = useState<any[]>([]);
  const [xmlSearch, setXmlSearch] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiClient.get("/products?limit=500&includeAll=true");
      const nextProducts: Product[] = res.data?.data?.products || [];
      setProducts(nextProducts);
      const metaRes = await apiClient.get("/products/meta/options");
      const metaCategories = metaRes.data?.data?.categories as Array<{ name: string; subCategories: string[] }> | undefined;
      const metaBrands = metaRes.data?.data?.brands as string[] | undefined;
      if (metaCategories && metaBrands) {
        setCategoryOptions(metaCategories.map((item) => item.name).sort((a, b) => a.localeCompare(b, "tr")));
        setCategoryTree(toCategoryTree(metaCategories));
        setBrandOptions([...metaBrands].sort((a, b) => a.localeCompare(b, "tr")));
      } else {
        setCategoryOptions(getUniqueValues(nextProducts, (p) => splitCategoryPath(p.categoryPath || p.category).main));
        setCategoryTree(buildCategoryTree(nextProducts));
        setBrandOptions(getUniqueValues(nextProducts, (p) => p.brand));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      setError(`Ürünler yüklenemedi: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchXmlCatalog = useCallback(async () => {
    setXmlLoading(true);
    try {
      const [catalogRes, requestsRes, feedsRes] = await Promise.all([
        apiClient.get("/products/xml/catalog?limit=50000"),
        apiClient.get("/products/admin/xml/requests"),
        apiClient.get("/products/admin/xml/feeds").catch(() => ({ data: { feeds: [] } }))
      ]);
      setXmlData({
        request: catalogRes.data?.data?.request || null,
        products: catalogRes.data?.data?.products || [],
      });
      setXmlHistory(requestsRes.data?.data?.requests || []);
      setXmlFeeds(feedsRes.data?.feeds || []);
    } catch (err: unknown) {
      console.error("Failed to fetch XML catalog", err);
    } finally {
      setXmlLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { if (activeTab === "XML") fetchXmlCatalog(); }, [activeTab, fetchXmlCatalog]);

  const categories = useMemo(
    () => ["Tumu", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))],
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.barcode || "").toLowerCase().includes(q);
      const matchCat = categoryFilter === "Tumu" || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, categoryFilter]);

  const filteredXmlProducts = useMemo(() => {
    if (!xmlData?.products) return [];
    const q = xmlSearch.toLowerCase().trim();
    if (!q) return xmlData.products;
    return xmlData.products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode || "").toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q)
    );
  }, [xmlData?.products, xmlSearch]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const activeSubCategories = categoryTree[form.categoryMain] || [];

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setImageSlots(EMPTY_IMAGES);
    setVariantGroups(DEFAULT_VARIANTS);
    setExtraServices(DEFAULT_EXTRA_SERVICES);
    setCategoryAttributes([]);
    setCategoryMainDraft("");
    setCategorySubDraft("");
    setBrandDraft("");
    setError(null);
    setEditingProduct(null);
  }, []);

  const openEditForm = useCallback(async (product: Product) => {
    try {
      let p: Product & Record<string, unknown> = { ...product };
      try {
        const res = await apiClient.get(`/products/admin/${product._id}`);
        p = res.data?.data || product;
      } catch { /* fallback to local product data */ }
      const { main, sub } = splitCategoryPath((p.categoryPath as string | undefined) || p.category);
      setForm({
        barcode: (p.barcode as string) || "",
        modelCode: (p.modelCode as string) || "",
        sku: (p.sku as string) || "",
        name: p.name,
        categoryMain: main,
        categorySub: sub,
        brand: p.brand,
        originalPrice: String(p.originalPrice ?? ""),
        price: String(p.price ?? ""),
        vatRate: (String((p.vatRate as number) ?? "20") as FormState["vatRate"]) || "20",
        purchasePrice: String((p.purchasePrice as number) ?? "0"),
        stock: String(p.stock ?? ""),
        shortDescription: (p.shortDescription as string) || "",
        description: (p.description as string) || "",
        bulletPoints: Array.isArray(p.bulletPoints) ? (p.bulletPoints as string[]).join("\n") : "",
        desi: String((p.desi as number) ?? "0"),
        preparationDays: String((p.preparationDays as number) ?? "1"),
        shippingType: (p.shippingType as FormState["shippingType"]) || "MARKETPLACE_LOGISTICS",
        saleStatus: p.isActive ? "ACTIVE" : "PASSIVE",
        approvalStatus: (p.approvalStatus as FormState["approvalStatus"]) || "PENDING",
      });
      const slots = Array.from({ length: 5 }, (_, i) => ((p.imageUrls as string[] | undefined)?.[i] || (i === 0 ? p.imageUrl : "")) || "");
      setImageSlots(slots);
      type RawVariant = { name: string; type: VariantGroup["type"]; values: Array<{ label: string; price: number; stock: number }> };
      type RawService = { name: string; price: number; description: string };
      setVariantGroups(
        Array.isArray(p.variants) && (p.variants as RawVariant[]).length > 0
          ? (p.variants as RawVariant[]).map((g) => ({
              name: g.name,
              type: g.type,
              valuesText: (g.values || []).map((v) => `${v.label}|${v.price}|${v.stock}`).join("\n"),
            }))
          : DEFAULT_VARIANTS
      );
      setExtraServices(
        Array.isArray(p.extraServices) && (p.extraServices as RawService[]).length > 0
          ? (p.extraServices as RawService[]).map((s) => ({ name: s.name, price: String(s.price), description: s.description }))
          : DEFAULT_EXTRA_SERVICES
      );
      setCategoryAttributes(
        p.categoryAttributes && typeof p.categoryAttributes === 'object'
          ? Object.entries(p.categoryAttributes).map(([k, v]) => ({ key: k, value: String(v) }))
          : []
      );
      setEditingProduct(product);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Ürün bilgileri yüklenemedi.");
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/products/${deleteTarget._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteTarget(null);
      await fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Silme sırasında hata oluştu.";
      setError(msg);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, token, fetchProducts]);

  const handleToggleActive = useCallback(async (product: Product) => {
    if (togglingId) return;
    setTogglingId(product._id);
    try {
      const newStatus = product.isActive ? "PASSIVE" : "ACTIVE";
      await apiClient.patch(`/products/${product._id}`, { saleStatus: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((prev) => prev.map((p) => p._id === product._id ? { ...p, isActive: !p.isActive } : p));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Durum güncellenemedi.";
      setError(msg);
    } finally {
      setTogglingId(null);
    }
  }, [togglingId, token]);

  const addCategoryMain = useCallback(async () => {
    const value = categoryMainDraft.trim();
    if (!value) { setError("Kategori adı boş olamaz!"); return; }
    try {
      const res = await apiClient.post("/products/meta/category", { mainCategory: value });
      const cats = res.data?.data?.categories as Array<{ name: string; subCategories: string[] }> | undefined;
      if (cats) {
        setCategoryOptions(cats.map((item) => item.name).sort((a, b) => a.localeCompare(b, "tr")));
        setCategoryTree(toCategoryTree(cats));
        setForm((prev) => ({ ...prev, categoryMain: value, categorySub: "" }));
      }
    } catch { setError("Kategori kaydedilemedi."); return; }
    setCategoryMainDraft("");
  }, [categoryMainDraft]);

  const addCategorySub = useCallback(async () => {
    const main = form.categoryMain.trim();
    const value = categorySubDraft.trim();
    if (!main) { setError("Önce ana kategori seçin!"); return; }
    if (!value) { setError("Alt kategori adı boş olamaz!"); return; }
    try {
      const res = await apiClient.post("/products/meta/category", { mainCategory: main, subCategory: value });
      const cats = res.data?.data?.categories as Array<{ name: string; subCategories: string[] }> | undefined;
      if (cats) {
        setCategoryOptions(cats.map((item) => item.name).sort((a, b) => a.localeCompare(b, "tr")));
        setCategoryTree(toCategoryTree(cats));
        setForm((prev) => ({ ...prev, categorySub: value }));
      }
    } catch { setError("Alt kategori kaydedilemedi."); return; }
    setCategorySubDraft("");
  }, [form.categoryMain, categorySubDraft]);

  const addBrand = useCallback(async () => {
    const value = brandDraft.trim();
    if (!value) { setError("Marka adı boş olamaz!"); return; }
    try {
      const res = await apiClient.post("/products/meta/brand", { name: value });
      const brands = res.data?.data?.brands as string[] | undefined;
      if (brands) {
        setBrandOptions([...brands].sort((a, b) => a.localeCompare(b, "tr")));
        setForm((prev) => ({ ...prev, brand: value }));
      }
    } catch { setError("Marka kaydedilemedi."); return; }
    setBrandDraft("");
  }, [brandDraft]);

  const handleImageChange = useCallback(async (index: number, file?: File | null) => {
    if (!file) return;
    const dataUrl = await compressImageToDataUrl(file);
    setImageSlots((prev) => prev.map((item, i) => (i === index ? dataUrl : item)));
  }, []);

  const handleDuplicate = useCallback(async () => {
    if (!duplicateTarget) return;
    const count = parseInt(duplicateCount, 10);
    if (!count || count < 1 || count > 50) { setDuplicateError("1 ile 50 arasında bir sayı girin."); return; }
    setDuplicating(true);
    setDuplicateError(null);
    try {
      for (let i = 1; i <= count; i++) {
        const suffix = `-K${i}`;
        const payload = {
          barcode: (duplicateTarget.barcode || "00000000") + suffix,
          modelCode: (duplicateTarget.modelCode || "MODEL") + suffix,
          sku: (duplicateTarget.sku || "SKU") + suffix,
          name: duplicateTarget.name + ` (Kopya ${i})`,
          categoryPath: duplicateTarget.categoryPath || duplicateTarget.category,
          brand: duplicateTarget.brand,
          category: duplicateTarget.category,
          originalPrice: duplicateTarget.originalPrice,
          price: duplicateTarget.price,
          purchasePrice: 0,
          vatRate: 20,
          stock: duplicateTarget.stock,
          imageUrls: (duplicateTarget.imageUrls?.filter(Boolean) ?? [duplicateTarget.imageUrl]).filter(Boolean).slice(0, 5),
          imageUrl: duplicateTarget.imageUrl,
          description: duplicateTarget.name + " - kopya ürün",
          shortDescription: "",
          bulletPoints: [],
          desi: 0,
          preparationDays: 1,
          shippingType: "MARKETPLACE_LOGISTICS",
          saleStatus: "ACTIVE",
          approvalStatus: "PENDING",
          variants: [],
          extraServices: [],
        };
        await apiClient.post("/products", payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setDuplicateTarget(null);
      setDuplicateCount("1");
      await fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Çoğaltma sırasında hata oluştu.";
      setDuplicateError(msg);
    } finally {
      setDuplicating(false);
    }
  }, [duplicateTarget, duplicateCount, token, fetchProducts]);

  const MAX_IMAGE_PAYLOAD_CHARS = 14_000_000;

  const handleSave = useCallback(async () => {
    setError(null);
    const imageUrls = imageSlots.filter(Boolean).slice(0, 5);
    const variants = parseVariants(variantGroups);
    const services = parseExtraServices(extraServices);
    const attributesObj = Object.fromEntries(
      categoryAttributes.filter((a) => a.key.trim() && a.value.trim()).map((a) => [a.key.trim(), a.value.trim()])
    );
    if (imageUrls.length === 0) { setError("En az 1 fotoğraf yükleyin."); return; }
    if (imageUrls.reduce((sum, item) => sum + item.length, 0) > MAX_IMAGE_PAYLOAD_CHARS) {
      setError("Fotoğraf boyutu cok buyuk. Daha dusuk cozunurlukte gorsel yukleyin."); return;
    }
    if (!form.name || form.name.trim().length < 3) { setError("Ürün adı en az 3 karakter olmalı."); return; }
    if (!form.barcode || form.barcode.trim().length < 8) { setError("Barkod en az 8 karakter olmalı."); return; }
    if (!form.modelCode || form.modelCode.trim().length < 1) { setError("Model kodu zorunlu."); return; }
    if (!form.sku || form.sku.trim().length < 1) { setError("SKU zorunlu."); return; }
    if (!form.categoryMain || !form.categorySub) { setError("Kategori ve alt kategori zorunlu."); return; }
    if (!form.brand) { setError("Marka zorunlu."); return; }
    if (!form.description || form.description.trim().length < 5) { setError("Ürün açıklaması en az 5 karakter olmalı."); return; }
    if (!form.price || Number(form.price) <= 0) { setError("Satış fiyatı 0'dan büyük olmalı."); return; }
    if (!form.originalPrice || Number(form.originalPrice) <= 0) { setError("Normal fiyat 0'dan büyük olmalı."); return; }
    if (!form.stock || Number(form.stock) < 0) { setError("Stok sayısı en az 0 olmalı."); return; }
    setSaving(true);
    try {
      const payload = {
        barcode: form.barcode.trim(), modelCode: form.modelCode.trim(), sku: form.sku.trim(),
        name: form.name.trim(),
        categoryPath: `${form.categoryMain.trim()} > ${form.categorySub.trim()}`,
        brand: form.brand.trim(), category: form.categoryMain.trim() || "Genel",
        originalPrice: Number(form.originalPrice), price: Number(form.price),
        vatRate: Number(form.vatRate), purchasePrice: Number(form.purchasePrice),
        stock: Number(form.stock), imageUrls, imageUrl: imageUrls[0],
        shortDescription: form.shortDescription.trim(), description: form.description.trim(),
        bulletPoints: parseBullets(form.bulletPoints),
        desi: Number(form.desi), preparationDays: Number(form.preparationDays),
        shippingType: form.shippingType, saleStatus: form.saleStatus,
        approvalStatus: form.approvalStatus, variants, extraServices: services,
        categoryAttributes: attributesObj,
      };
      if (editingProduct) {
        await apiClient.patch(`/products/${editingProduct._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await apiClient.post("/products", payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      resetForm();
      setShowForm(false);
      await fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kayıt sırasında hata oluştu.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [form, imageSlots, variantGroups, extraServices, categoryAttributes, editingProduct, token, resetForm, fetchProducts]);

  const deleteXmlFeed = async (id: string) => {
    try {
      await apiClient.delete(`/products/admin/xml/feeds/${id}`);
      setXmlFeeds((prev) => prev.filter((f) => f.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      setError(`Feed silinemedi: ${msg}`);
    }
  };

  return {
    // State
    products, loading, search, setSearch, categoryFilter, setCategoryFilter,
    showForm, setShowForm, form, setForm, categoryOptions, setCategoryOptions,
    categoryTree, setCategoryTree, brandOptions, setBrandOptions,
    categoryMainDraft, setCategoryMainDraft, categorySubDraft, setCategorySubDraft,
    brandDraft, setBrandDraft, imageSlots, setImageSlots, variantGroups, setVariantGroups,
    extraServices, setExtraServices, categoryAttributes, setCategoryAttributes, saving, error, setError, page, setPage,
    PAGE_SIZE, duplicateTarget, setDuplicateTarget, duplicateCount, setDuplicateCount,
    duplicating, duplicateError, setDuplicateError, editingProduct, setEditingProduct,
    deleteTarget, setDeleteTarget, deleting, togglingId, activeTab, setActiveTab,
    xmlLoading, xmlData, xmlHistory, xmlFeeds, xmlSearch, setXmlSearch,
    // Computed
    categories, filtered, paginated, totalPages, activeSubCategories, filteredXmlProducts,
    // Actions
    fetchProducts, fetchXmlCatalog, resetForm, openEditForm, handleDelete,
    handleToggleActive, addCategoryMain, addCategorySub, addBrand,
    handleDuplicate,
    handleDelete,
    deleteXmlFeed,
    selectedIds,
    setSelectedIds,
    bulkPriceModal,
    setBulkPriceModal,
  };
}
