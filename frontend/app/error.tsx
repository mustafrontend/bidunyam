"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[NextJS Route Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-xl font-black tracking-tight text-slate-900">
          Bir şeyler ters gitti
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          {error.message || "Sayfa yüklenirken beklenmeyen bir hata oluştu."}
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-[10px] text-slate-300">
            Hata kodu: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-black text-white transition-all hover:bg-[#ff6000] active:scale-[0.98]"
          >
            Tekrar Dene
          </button>
          <a
            href="/"
            className="w-full rounded-xl border border-slate-200 py-3.5 text-sm font-black text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    </div>
  );
}
