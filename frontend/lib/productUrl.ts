/**
 * SEO dostu ürün URL'leri.
 *
 * XML kataloğundan gelen ürünlerin kimlikleri `xml-req-1784668099439-3` gibi
 * anlamsız değerler. Bu kimlikler kataloğun kaydı olduğu için değişmiyor;
 * bunun yerine URL'i `/product/<slug>-p-<id>` biçimine taşıyoruz:
 *
 *   /product/apple-iphone-14-128-gb-yildiz-isigi-p-xml-req-1784668099439-3
 *
 * `-p-` ayracından sonrası her zaman kimliktir; ayraç yoksa (eski linkler)
 * parametrenin tamamı kimlik kabul edilir, böylece eski bağlantılar çalışmaya
 * devam eder.
 */

const SEPARATOR = "-p-";

const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
  ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
};

export function slugify(input: string): string {
  return (input || "")
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => TR_MAP[ch] || ch)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " ve ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** URL parametresinden gerçek ürün kimliğini çıkarır. */
export function extractProductId(param: string): string {
  const value = decodeURIComponent(param || "");
  const at = value.lastIndexOf(SEPARATOR);
  return at === -1 ? value : value.slice(at + SEPARATOR.length);
}

/** Ürün için kanonik yolu üretir. İsim yoksa düz kimliğe düşer. */
export function productPath(product: { _id?: string; id?: string; name?: string } | null | undefined): string {
  if (!product) return "/";
  const id = product._id || product.id || "";
  const slug = slugify(product.name || "");
  return slug ? `/product/${slug}${SEPARATOR}${id}` : `/product/${id}`;
}

/** Sunucu tarafında (id + isim elde varken) kanonik yol. */
export function productPathFrom(id: string, name?: string): string {
  const slug = slugify(name || "");
  return slug ? `/product/${slug}${SEPARATOR}${id}` : `/product/${id}`;
}
