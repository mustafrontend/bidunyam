/**
 * Satıcı evraklarının (vergi levhası, imza sirküleri vb.) istemci tarafında
 * data URL'e çevrilmesi. Görseller yeniden boyutlandırılır; PDF'ler olduğu
 * gibi gönderilir. Backend 4 MB üzerini reddeder.
 */

export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1600;

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export class DocumentError extends Error {}

async function readAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new DocumentError("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
}

/** Büyük fotoğrafları küçültür; kalite kademeli düşürülerek boyut hedefi tutturulur. */
async function compressImage(file: File): Promise<string> {
  const dataUrl = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new DocumentError("Görsel açılamadı."));
    el.src = dataUrl;
  });

  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  for (const quality of [0.85, 0.7, 0.55, 0.4]) {
    const out = canvas.toDataURL("image/jpeg", quality);
    if (out.length * 0.75 <= MAX_DOCUMENT_BYTES) return out;
  }
  throw new DocumentError("Görsel çok büyük. Lütfen daha düşük çözünürlüklü bir dosya yükleyin.");
}

export async function fileToDataUrl(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) {
    throw new DocumentError("Yalnızca PDF, JPG, PNG veya WEBP yükleyebilirsiniz.");
  }
  if (file.type.startsWith("image/")) return compressImage(file);

  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new DocumentError("PDF 4 MB'tan küçük olmalıdır.");
  }
  return readAsDataUrl(file);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
