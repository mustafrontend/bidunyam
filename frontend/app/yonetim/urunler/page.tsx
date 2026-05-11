"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

interface Product {
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

type VariantGroup = {
  name: string;
  type: "COLOR" | "SIZE" | "CUSTOM";
  valuesText: string;
};

type ExtraService = {
  name: string;
  price: string;
  description: string;
};

type CategoryTree = Record<string, string[]>;

type FormState = {
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

const EMPTY_FORM: FormState = {
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

const EMPTY_IMAGES = Array.from({ length: 5 }, () => "");

const DEFAULT_VARIANTS: VariantGroup[] = [
  { name: "Renk", type: "COLOR", valuesText: "Siyah|0|10\nBeyaz|0|8" },
  { name: "Beden", type: "SIZE", valuesText: "S|0|4\nM|0|6\nL|0|5" },
];

const DEFAULT_EXTRA_SERVICES: ExtraService[] = [
  { name: "Kurulum Hizmeti", price: "0", description: "Ürün tesliminde kurulum desteği" },
];

function parseBullets(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean)
    .slice(0, 5);
}

function parseVariants(groups: VariantGroup[]) {
  return groups
    .map((group) => ({
      name: group.name.trim(),
      type: group.type,
      values: group.valuesText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [label = "", price = "0", stock = "0"] = line.split("|").map((part) => part.trim());
          return {
            label,
            price: Number(price || 0),
            stock: Number(stock || 0),
          };
        })
        .filter((item) => item.label),
    }))
    .filter((group) => group.name && group.values.length > 0);
}

function parseExtraServices(rows: ExtraService[]) {
  return rows
    .map((row) => ({
      name: row.name.trim(),
      price: Number(row.price || 0),
      description: row.description.trim(),
    }))
    .filter((row) => row.name);
}

function splitCategoryPath(path?: string) {
  const [main = "", sub = ""] = (path || "").split(">").map((part) => part.trim());
  return {
    main: main || "Genel",
    sub,
  };
}

function buildCategoryTree(products: Product[]) {
  const tree: CategoryTree = {};

  products.forEach((product) => {
    const { main, sub } = splitCategoryPath(product.categoryPath || product.category);
    if (!tree[main]) {
      tree[main] = [];
    }
    if (sub && !tree[main].includes(sub)) {
      tree[main].push(sub);
    }
  });

  return Object.fromEntries(
    Object.entries(tree).map(([main, subs]) => [main, subs.sort((a, b) => a.localeCompare(b, "tr"))])
  );
}

function getUniqueValues(products: Product[], selector: (product: Product) => string | undefined) {
  return Array.from(
    new Set(products.map(selector).map((value) => value?.trim()).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b, "tr"));
}

function toCategoryTree(categories: Array<{ name: string; subCategories: string[] }>): CategoryTree {
  return Object.fromEntries(
    categories.map((item) => [
      item.name,
      [...item.subCategories].sort((a, b) => a.localeCompare(b, "tr")),
    ])
  );
}

const MAX_UPLOAD_DIMENSION = 1400;
const IMAGE_QUALITY = 0.78;
const MAX_IMAGE_PAYLOAD_CHARS = 14_000_000;

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

async function compressImageToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return fileToDataUrl(file);
  }

  const sourceDataUrl = await fileToDataUrl(file);
  const sourceImage = await loadImage(sourceDataUrl);

  const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(sourceImage.width, sourceImage.height));
  const width = Math.max(1, Math.round(sourceImage.width * scale));
  const height = Math.max(1, Math.round(sourceImage.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return sourceDataUrl;
  }

  context.drawImage(sourceImage, 0, 0, width, height);

  const compressedDataUrl = canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
  return compressedDataUrl.length < sourceDataUrl.length ? compressedDataUrl : sourceDataUrl;
}

export default function UrunlerPage() {
  const { token } = useAuthStore();
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
  const [duplicateTarget, setDuplicateTarget] = useState<Product | null>(null);
  const [duplicateCount, setDuplicateCount] = useState("1");
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchProducts = async () => {
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
        setCategoryOptions(getUniqueValues(nextProducts, (product) => splitCategoryPath(product.categoryPath || product.category).main));
        setCategoryTree(buildCategoryTree(nextProducts));
        setBrandOptions(getUniqueValues(nextProducts, (product) => product.brand));
      }
    } catch (err: any) {
      console.error("Ürünleri yüklerken hata oluştu:", err?.response?.data || err?.message || err);
      setError(`Ürünler yüklenemedi: ${err?.response?.data?.message || err?.message || "Bilinmeyen hata"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(
    () => ["Tumu", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))],
    [products]
  );

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      (p.brand || "").toLowerCase().includes(q) ||
      (p.sku || "").toLowerCase().includes(q) ||
      (p.barcode || "").toLowerCase().includes(q);
    const matchCat = categoryFilter === "Tumu" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const activeSubCategories = categoryTree[form.categoryMain] || [];

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImageSlots(EMPTY_IMAGES);
    setVariantGroups(DEFAULT_VARIANTS);
    setExtraServices(DEFAULT_EXTRA_SERVICES);
    setCategoryMainDraft("");
    setCategorySubDraft("");
    setBrandDraft("");
    setError(null);
    setEditingProduct(null);
  };

  const openEditForm = async (product: Product) => {
    try {
      let p: any = product;
      try {
        const res = await apiClient.get(`/products/admin/${product._id}`);
        p = res.data?.data || product;
      } catch {
        // fallback to local product data if admin endpoint not reachable yet
        p = product;
      }
      const { main, sub } = splitCategoryPath(p.categoryPath || p.category);
      setForm({
        barcode: p.barcode || "",
        modelCode: p.modelCode || "",
        sku: p.sku || "",
        name: p.name || "",
        categoryMain: main,
        categorySub: sub,
        brand: p.brand || "",
        originalPrice: String(p.originalPrice ?? ""),
        price: String(p.price ?? ""),
        vatRate: (String(p.vatRate ?? "20") as FormState["vatRate"]) || "20",
        purchasePrice: String(p.purchasePrice ?? "0"),
        stock: String(p.stock ?? ""),
        shortDescription: p.shortDescription || "",
        description: p.description || "",
        bulletPoints: Array.isArray(p.bulletPoints) ? p.bulletPoints.join("\n") : "",
        desi: String(p.desi ?? "0"),
        preparationDays: String(p.preparationDays ?? "1"),
        shippingType: (p.shippingType as FormState["shippingType"]) || "MARKETPLACE_LOGISTICS",
        saleStatus: p.isActive ? "ACTIVE" : "PASSIVE",
        approvalStatus: (p.approvalStatus as FormState["approvalStatus"]) || "PENDING",
      });
      const slots = Array.from({ length: 5 }, (_, i) => (p.imageUrls?.[i] || (i === 0 ? p.imageUrl : "")) || "");
      setImageSlots(slots);
      setVariantGroups(
        Array.isArray(p.variants) && p.variants.length > 0
          ? p.variants.map((g: any) => ({
              name: g.name,
              type: g.type,
              valuesText: (g.values || []).map((v: any) => `${v.label}|${v.price}|${v.stock}`).join("\n"),
            }))
          : DEFAULT_VARIANTS
      );
      setExtraServices(
        Array.isArray(p.extraServices) && p.extraServices.length > 0
          ? p.extraServices.map((s: any) => ({ name: s.name, price: String(s.price), description: s.description }))
          : DEFAULT_EXTRA_SERVICES
      );
      setEditingProduct(product);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError("Ürün bilgileri yüklenemedi.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/products/${deleteTarget._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteTarget(null);
      await fetchProducts();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Silme sırasında hata oluştu.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    if (togglingId) return;
    setTogglingId(product._id);
    try {
      const newStatus = product.isActive ? "PASSIVE" : "ACTIVE";
      await apiClient.patch(`/products/${product._id}`, { saleStatus: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((prev) =>
        prev.map((p) => p._id === product._id ? { ...p, isActive: !p.isActive } : p)
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || "Durum güncellenemedi.");
    } finally {
      setTogglingId(null);
    }
  };

  const addCategoryMain = async () => {
    const value = categoryMainDraft.trim();
    if (!value) {
      return;
    }

    try {
      const res = await apiClient.post("/products/meta/category", { mainCategory: value });
      const categories = res.data?.data?.categories as Array<{ name: string; subCategories: string[] }> | undefined;
      if (categories) {
        setCategoryOptions(categories.map((item) => item.name).sort((a, b) => a.localeCompare(b, "tr")));
        setCategoryTree(toCategoryTree(categories));
      }
    } catch (err) {
      console.error(err);
      setError("Kategori kaydedilemedi.");
      return;
    }

    setCategoryOptions((prev) => (prev.includes(value) ? prev : [...prev, value].sort((a, b) => a.localeCompare(b, "tr"))));
    setForm((prev) => ({ ...prev, categoryMain: value, categorySub: "" }));
    setCategoryTree((prev) => (prev[value] ? prev : { ...prev, [value]: [] }));
    setCategoryMainDraft("");
  };

  const addCategorySub = async () => {
    const main = form.categoryMain.trim();
    const value = categorySubDraft.trim();
    if (!main || !value) {
      return;
    }

    try {
      const res = await apiClient.post("/products/meta/category", {
        mainCategory: main,
        subCategory: value,
      });
      const categories = res.data?.data?.categories as Array<{ name: string; subCategories: string[] }> | undefined;
      if (categories) {
        setCategoryOptions(categories.map((item) => item.name).sort((a, b) => a.localeCompare(b, "tr")));
        setCategoryTree(toCategoryTree(categories));
      }
    } catch (err) {
      console.error(err);
      setError("Alt kategori kaydedilemedi.");
      return;
    }

    setCategoryTree((prev) => ({
      ...prev,
      [main]: prev[main]?.includes(value) ? prev[main] : [...(prev[main] || []), value].sort((a, b) => a.localeCompare(b, "tr")),
    }));
    setForm((prev) => ({ ...prev, categorySub: value }));
    setCategorySubDraft("");
  };

  const addBrand = async () => {
    const value = brandDraft.trim();
    if (!value) {
      return;
    }

    try {
      const res = await apiClient.post("/products/meta/brand", { name: value });
      const brands = res.data?.data?.brands as string[] | undefined;
      if (brands) {
        setBrandOptions([...brands].sort((a, b) => a.localeCompare(b, "tr")));
      }
    } catch (err) {
      console.error(err);
      setError("Marka kaydedilemedi.");
      return;
    }

    setBrandOptions((prev) => (prev.includes(value) ? prev : [...prev, value].sort((a, b) => a.localeCompare(b, "tr"))));
    setForm((prev) => ({ ...prev, brand: value }));
    setBrandDraft("");
  };

  const handleImageChange = async (index: number, file?: File | null) => {
    if (!file) return;
    const dataUrl = await compressImageToDataUrl(file);
    setImageSlots((prev) => prev.map((item, i) => (i === index ? dataUrl : item)));
  };

  const handleDuplicate = async () => {
    if (!duplicateTarget) return;
    const count = parseInt(duplicateCount, 10);
    if (!count || count < 1 || count > 50) {
      setDuplicateError("1 ile 50 arasında bir sayı girin.");
      return;
    }
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
        await apiClient.post("/products", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setDuplicateTarget(null);
      setDuplicateCount("1");
      await fetchProducts();
    } catch (err: any) {
      setDuplicateError(err?.response?.data?.message || "Çoğaltma sırasında hata oluştu.");
    } finally {
      setDuplicating(false);
    }
  };

  const handleSave = async () => {
    setError(null);

    const imageUrls = imageSlots.filter(Boolean).slice(0, 5);
    const variants = parseVariants(variantGroups);
    const services = parseExtraServices(extraServices);

    if (imageUrls.length === 0) {
      setError("En az 1 fotoğraf yükleyin.");
      return;
    }
    const imagePayloadChars = imageUrls.reduce((sum, item) => sum + item.length, 0);
    if (imagePayloadChars > MAX_IMAGE_PAYLOAD_CHARS) {
      setError("Fotoğraf boyutu cok buyuk. Daha dusuk cozunurlukte gorsel yukleyin.");
      return;
    }
    // Validate required fields and their minimum lengths
    if (!form.name || form.name.trim().length < 3) {
      setError("Ürün adı en az 3 karakter olmalı.");
      return;
    }
    if (!form.barcode || form.barcode.trim().length < 8) {
      setError("Barkod en az 8 karakter olmalı.");
      return;
    }
    if (!form.modelCode || form.modelCode.trim().length < 1) {
      setError("Model kodu zorunlu.");
      return;
    }
    if (!form.sku || form.sku.trim().length < 1) {
      setError("SKU zorunlu.");
      return;
    }
    if (!form.categoryMain || !form.categorySub) {
      setError("Kategori ve alt kategori zorunlu.");
      return;
    }
    if (!form.brand) {
      setError("Marka zorunlu.");
      return;
    }
    if (!form.description || form.description.trim().length < 5) {
      setError("Ürün açıklaması en az 5 karakter olmalı.");
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      setError("Satış fiyatı 0'dan büyük olmalı.");
      return;
    }
    if (!form.originalPrice || Number(form.originalPrice) <= 0) {
      setError("Normal fiyat 0'dan büyük olmalı.");
      return;
    }
    if (!form.stock || Number(form.stock) < 0) {
      setError("Stok sayısı en az 0 olmalı.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        barcode: form.barcode.trim(),
        modelCode: form.modelCode.trim(),
        sku: form.sku.trim(),
        name: form.name.trim(),
        categoryPath: `${form.categoryMain.trim()} > ${form.categorySub.trim()}`,
        brand: form.brand.trim(),
        category: form.categoryMain.trim() || "Genel",
        originalPrice: Number(form.originalPrice),
        price: Number(form.price),
        vatRate: Number(form.vatRate),
        purchasePrice: Number(form.purchasePrice),
        stock: Number(form.stock),
        imageUrls,
        imageUrl: imageUrls[0],
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        bulletPoints: parseBullets(form.bulletPoints),
        desi: Number(form.desi),
        preparationDays: Number(form.preparationDays),
        shippingType: form.shippingType,
        saleStatus: form.saleStatus,
        approvalStatus: form.approvalStatus,
        variants,
        extraServices: services,
      };

      if (editingProduct) {
        await apiClient.patch(`/products/${editingProduct._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await apiClient.post("/products", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      resetForm();
      setShowForm(false);
      await fetchProducts();
    } catch (err: any) {
      console.error("Save failed:", err?.response?.data);
      setError(err?.response?.data?.message || "Kayıt sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Duplicate Modal */}
      {duplicateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="mb-1 text-base font-black text-slate-800">Ürün Çoğalt</h3>
            <p className="mb-4 text-sm text-slate-500 line-clamp-1">{duplicateTarget.name}</p>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Kaç kopya oluşturulsun?</label>
            <input
              type="number"
              min={1}
              max={50}
              value={duplicateCount}
              onChange={(e) => setDuplicateCount(e.target.value)}
              className="mb-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#ff6000]"
              autoFocus
            />
            <p className="mb-4 text-[11px] text-slate-400">Maksimum 50 kopya oluşturabilirsiniz.</p>
            {duplicateError && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{duplicateError}</div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="flex-1 rounded-lg bg-[#ff6000] py-2 text-sm font-black text-white disabled:opacity-60"
              >
                {duplicating ? "Çoğaltılıyor..." : `${duplicateCount} Kopya Oluştur`}
              </button>
              <button
                onClick={() => { setDuplicateTarget(null); setDuplicateCount("1"); setDuplicateError(null); }}
                disabled={duplicating}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="mb-1 text-base font-black text-slate-800">Ürünü Sil</h3>
            <p className="mb-4 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{deleteTarget.name}</span> ürününü kalıcı olarak silmek istediğinize emin misiniz?
            </p>
            <p className="mb-4 text-xs text-red-500 font-semibold">Bu işlem geri alınamaz.</p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-black text-white disabled:opacity-60"
              >
                {deleting ? "Siliniyor..." : "Evet, Sil"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">Ürün Yönetimi</h2>
          <p className="mt-1 text-sm text-slate-500">{filtered.length} ürün listelendi</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-[#ff6000] px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-[#d85000]"
        >
          + Yeni Ürün Ekle
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-base font-black text-slate-700">
            {editingProduct ? `Ürün Düzenle — ${editingProduct.name}` : "Sade Ürün Kartı"}
          </h3>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <section>
              <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">Temel Bilgiler</h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <InputField label="Ürün Adı" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                <InputField label="Barkod" value={form.barcode} onChange={(v) => setForm((f) => ({ ...f, barcode: v }))} />
                <InputField label="Model Kodu" value={form.modelCode} onChange={(v) => setForm((f) => ({ ...f, modelCode: v }))} />
                <InputField label="SKU" value={form.sku} onChange={(v) => setForm((f) => ({ ...f, sku: v }))} />
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Kategori</label>
                  <div className="flex gap-2">
                    <select
                      value={form.categoryMain}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          categoryMain: e.target.value,
                          categorySub: "",
                        }))
                      }
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]"
                    >
                      <option value="" disabled>
                        Ana kategori seç
                      </option>
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <input
                      value={categoryMainDraft}
                      onChange={(e) => setCategoryMainDraft(e.target.value)}
                      placeholder="Yeni kategori"
                      className="w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]"
                    />
                    <button
                      type="button"
                      onClick={addCategoryMain}
                      className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-black text-slate-600 hover:border-[#ff6000] hover:text-[#ff6000]"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Alt Kategori</label>
                  <div className="flex gap-2">
                    <select
                      value={form.categorySub}
                      onChange={(e) => setForm((f) => ({ ...f, categorySub: e.target.value }))}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]"
                      disabled={!form.categoryMain}
                    >
                      <option value="" disabled>
                        Alt kategori seç
                      </option>
                      {activeSubCategories.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <input
                      value={categorySubDraft}
                      onChange={(e) => setCategorySubDraft(e.target.value)}
                      placeholder="Yeni alt kategori"
                      className="w-40 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]"
                      disabled={!form.categoryMain}
                    />
                    <button
                      type="button"
                      onClick={addCategorySub}
                      disabled={!form.categoryMain}
                      className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-black text-slate-600 hover:border-[#ff6000] hover:text-[#ff6000] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Marka</label>
                  <div className="flex gap-2">
                    <select
                      value={form.brand}
                      onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]"
                    >
                      <option value="" disabled>
                        Marka seç
                      </option>
                      {brandOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <input
                      value={brandDraft}
                      onChange={(e) => setBrandDraft(e.target.value)}
                      placeholder="Yeni marka"
                      className="w-36 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]"
                    />
                    <button
                      type="button"
                      onClick={addBrand}
                      className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-black text-slate-600 hover:border-[#ff6000] hover:text-[#ff6000]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">Fotoğraflar</h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {imageSlots.map((src, idx) => (
                  <label key={idx} className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 transition-colors hover:border-[#ff6000]">
                    <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">Fotoğraf {idx + 1}</span>
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white">
                      {src ? (
                        <img src={src} alt={`Fotoğraf ${idx + 1}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center text-xs font-semibold text-slate-400">Yüklemek için tıkla</div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageChange(idx, e.target.files?.[0] ?? null)}
                    />
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">Fiyat ve Stok</h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <InputField type="number" label="Piyasa Fiyatı" value={form.originalPrice} onChange={(v) => setForm((f) => ({ ...f, originalPrice: v }))} />
                <InputField type="number" label="Satış Fiyatı" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: v }))} />
                <InputField type="number" label="Alış Fiyatı" value={form.purchasePrice} onChange={(v) => setForm((f) => ({ ...f, purchasePrice: v }))} />
                <SelectField
                  label="KDV"
                  value={form.vatRate}
                  onChange={(v) => setForm((f) => ({ ...f, vatRate: v as FormState["vatRate"] }))}
                  options={["1", "10", "20"]}
                />
                <InputField type="number" label="Stok" value={form.stock} onChange={(v) => setForm((f) => ({ ...f, stock: v }))} />
                <InputField type="number" label="Desi" value={form.desi} onChange={(v) => setForm((f) => ({ ...f, desi: v }))} />
                <InputField type="number" label="Hazırlık Süresi (gün)" value={form.preparationDays} onChange={(v) => setForm((f) => ({ ...f, preparationDays: v }))} />
                <SelectField
                  label="Gönderim Tipi"
                  value={form.shippingType}
                  onChange={(v) => setForm((f) => ({ ...f, shippingType: v as FormState["shippingType"] }))}
                  options={["MARKETPLACE_LOGISTICS", "SELF_SHIPPING"]}
                />
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-black uppercase tracking-wide text-slate-700">Varyant Kutuları</h4>
                <button
                  type="button"
                  onClick={() => setVariantGroups((prev) => [...prev, { name: "", type: "CUSTOM", valuesText: "" }])}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:border-[#ff6000] hover:text-[#ff6000]"
                >
                  + Grup Ekle
                </button>
              </div>

              <div className="space-y-3">
                {variantGroups.map((group, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_180px_1fr_auto]">
                      <InputField
                        label="Grup Adı"
                        value={group.name}
                        onChange={(v) => setVariantGroups((prev) => prev.map((item, i) => (i === idx ? { ...item, name: v } : item)))}
                      />
                      <SelectField
                        label="Tip"
                        value={group.type}
                        onChange={(v) => setVariantGroups((prev) => prev.map((item, i) => (i === idx ? { ...item, type: v as VariantGroup["type"] } : item)))}
                        options={["COLOR", "SIZE", "CUSTOM"]}
                      />
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Değerler</label>
                        <textarea
                          value={group.valuesText}
                          onChange={(e) => setVariantGroups((prev) => prev.map((item, i) => (i === idx ? { ...item, valuesText: e.target.value } : item)))}
                          placeholder="30 GB|12000|3\n50 GB|60000|1"
                          rows={3}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setVariantGroups((prev) => prev.filter((_, i) => i !== idx))}
                        className="self-end rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:border-red-300 hover:text-red-600"
                      >
                        Sil
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.valuesText.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
                        const [label, price, stock] = line.split("|").map((part) => part.trim());
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

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-black uppercase tracking-wide text-slate-700">Ek Hizmet Kartları</h4>
                <button
                  type="button"
                  onClick={() => setExtraServices((prev) => [...prev, { name: "", price: "0", description: "" }])}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:border-[#ff6000] hover:text-[#ff6000]"
                >
                  + Hizmet Ekle
                </button>
              </div>

              <div className="space-y-3">
                {extraServices.map((service, idx) => (
                  <div key={idx} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_160px_1fr_auto]">
                    <InputField
                      label="Hizmet Adı"
                      value={service.name}
                      onChange={(v) => setExtraServices((prev) => prev.map((item, i) => (i === idx ? { ...item, name: v } : item)))}
                    />
                    <InputField
                      type="number"
                      label="Fiyat"
                      value={service.price}
                      onChange={(v) => setExtraServices((prev) => prev.map((item, i) => (i === idx ? { ...item, price: v } : item)))}
                    />
                    <InputField
                      label="Açıklama"
                      value={service.description}
                      onChange={(v) => setExtraServices((prev) => prev.map((item, i) => (i === idx ? { ...item, description: v } : item)))}
                    />
                    <button
                      type="button"
                      onClick={() => setExtraServices((prev) => prev.filter((_, i) => i !== idx))}
                      className="self-end rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:border-red-300 hover:text-red-600"
                    >
                      Sil
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">İçerik</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Kısa Açıklama</label>
                  <textarea
                    rows={2}
                    value={form.shortDescription}
                    onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Bullet Points (satır satır)</label>
                  <textarea
                    rows={2}
                    value={form.bulletPoints}
                    onChange={(e) => setForm((f) => ({ ...f, bulletPoints: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]"
                    placeholder="- Özellik 1\n- Özellik 2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Detaylı Açıklama</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]"
                  />
                </div>
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">Durum</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <SelectField
                  label="Satış Durumu"
                  value={form.saleStatus}
                  onChange={(v) => setForm((f) => ({ ...f, saleStatus: v as FormState["saleStatus"] }))}
                  options={["ACTIVE", "PASSIVE"]}
                />
                <SelectField
                  label="Onay Durumu"
                  value={form.approvalStatus}
                  onChange={(v) => setForm((f) => ({ ...f, approvalStatus: v as FormState["approvalStatus"] }))}
                  options={["PENDING", "APPROVED", "REJECTED"]}
                />
              </div>
            </section>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[#ff6000] px-5 py-2 text-sm font-black text-white disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : editingProduct ? "Güncelle" : "Kaydet"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Ürün, marka, barkod veya SKU ara..."
          className="w-72 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-[#ff6000]"
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#ff6000]"
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {[
                  "Ürün",
                  "Barkod",
                  "SKU",
                  "Marka",
                  "Kategori",
                  "Fiyat",
                  "Stok",
                  "Durum",
                  "İşlem",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center font-semibold text-slate-400">
                    Ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-lg bg-slate-100 object-cover" />
                        <span className="max-w-55 truncate font-semibold text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.barcode || "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.sku || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.brand}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{p.category}</span></td>
                    <td className="px-4 py-3 font-black text-[#ff6000]">{p.price.toLocaleString("tr-TR")} TL</td>
                    <td className="px-4 py-3"><span className={`font-bold ${p.stock < 10 ? "text-red-500" : "text-slate-700"}`}>{p.stock}</span></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(p)}
                        disabled={togglingId === p._id}
                        title={p.isActive ? "Pasife al" : "Aktife al"}
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
                          onClick={() => openEditForm(p)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:border-[#ff6000] hover:text-[#ff6000]"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => { setDuplicateTarget(p); setDuplicateCount("1"); setDuplicateError(null); }}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:border-[#ff6000] hover:text-[#ff6000]"
                        >
                          Çoğalt
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
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
                  onClick={() => setPage(page - 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  Önceki
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-lg bg-[#ff6000] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ff6000]"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
