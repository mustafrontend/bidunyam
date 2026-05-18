"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "#", label: "Gizlilik Politikası" },
  { href: "#", label: "Kullanım Koşulları" },
  { href: "#", label: "Site Haritası" },
  { href: "#", label: "Güvenlik Merkezi" },
  { href: "#", label: "Hakkımızda" },
];

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // Admin routes should not display the storefront footer
  if (pathname?.startsWith("/yonetim")) {
    return null;
  }

  return (
    <footer className="w-full py-12 px-6 mt-16 flex flex-col items-center gap-6 bg-white border-t border-slate-100 select-none pb-24 md:pb-12">
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 font-semibold text-xs text-slate-500">
        {LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="hover:text-[#ff5000] hover:underline underline-offset-4 transition-colors duration-200"
          >
            {link.label}
          </Link>
        ))}
      </div>
      
      <p className="text-xs font-medium text-slate-400 opacity-80 text-center leading-relaxed">
        © {new Date().getFullYear()} biDunyam Marketplace. Tüm hakları saklıdır.
      </p>
      
      <div className="text-4xl md:text-5xl font-black text-slate-900 opacity-5 select-none font-sans tracking-[0.25em] mt-2">
        BİDÜNYAM
      </div>
    </footer>
  );
};
