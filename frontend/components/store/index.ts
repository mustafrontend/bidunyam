import type { ComponentType } from "react";
import { AuroraStorefront } from "./AuroraStorefront";
import { AtelierStorefront } from "./AtelierStorefront";
import { PulseStorefront } from "./PulseStorefront";
import type { StorefrontProps } from "./types";

export interface StoreTemplate {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  /** Seçim ekranındaki minyatür önizleme renkleri */
  preview: { bg: string; surface: string; text: string; muted: string };
  bestFor: string;
  Component: ComponentType<StorefrontProps>;
}

export const STORE_TEMPLATES: StoreTemplate[] = [
  {
    id: "aurora",
    name: "Aurora",
    tagline: "Yumuşak, sıcak, davetkâr",
    desc: "Degrade hero, cam efektli menü ve yuvarlak kartlar. Renginizi seçin, tüm sayfa ona göre uyum sağlar.",
    preview: { bg: "#fbfaff", surface: "#ffffff", text: "#0f172a", muted: "#94a3b8" },
    bestFor: "Moda, kozmetik, el yapımı ürünler",
    Component: AuroraStorefront,
  },
  {
    id: "atelier",
    name: "Atelier",
    tagline: "Editoryal ve sakin lüks",
    desc: "Serif başlıklar, bölünmüş hero, sol kategori sütunu ve ince çizgiler. Az ürünle bile dolu görünür.",
    preview: { bg: "#faf9f7", surface: "#f4f1ec", text: "#1c1917", muted: "#a8a29e" },
    bestFor: "Takı, sanat, tasarım, koleksiyon",
    Component: AtelierStorefront,
  },
  {
    id: "pulse",
    name: "Pulse",
    tagline: "Koyu, iddialı, yüksek kontrast",
    desc: "Kayan duyuru şeridi, iri tipografi ve neon vurgular. Kampanya ve indirimler öne çıkar.",
    preview: { bg: "#08080c", surface: "#17171f", text: "#ffffff", muted: "#6b7280" },
    bestFor: "Sneaker, teknoloji, streetwear",
    Component: PulseStorefront,
  },
];

/**
 * Eski tema kimlikleri (minimal/dark/elegant/bold/pastel) yeni şablonlara
 * eşlenir; hiçbir mağaza bozulmadan yeni tasarımlara geçer.
 */
const LEGACY_MAP: Record<string, string> = {
  minimal: "aurora",
  pastel: "aurora",
  elegant: "atelier",
  dark: "pulse",
  bold: "pulse",
};

export function getTemplate(id?: string | null): StoreTemplate {
  const key = LEGACY_MAP[id || ""] || id || "aurora";
  return STORE_TEMPLATES.find((t) => t.id === key) || STORE_TEMPLATES[0];
}

export * from "./types";
