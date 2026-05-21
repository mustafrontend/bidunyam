"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function YonetimError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Yönetim Panel Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="text-base font-black text-slate-800">Panel Hatası</h2>
      <p className="mt-1 text-sm font-medium text-slate-500 max-w-xs">
        {error.message || "Bu sayfa yüklenirken bir sorun oluştu."}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-[#ff6000] px-6 py-2.5 text-sm font-black text-white transition-all hover:bg-[#d85000] active:scale-95"
        >
          Tekrar Dene
        </button>
        <Link
          href="/yonetim"
          className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-black text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
        >
          Panele Dön
        </Link>
      </div>
    </div>
  );
}
