"use client";

import Link from "next/link";

export default function OrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Siparişlerim</h1>
      <p className="mt-2 text-slate-500">Tüm siparişlerinizi ve durumlarını burada görebilirsiniz.</p>

      <div className="mt-8 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-8 py-12 text-center">
        <p className="text-3xl mb-2">📦</p>
        <p className="text-slate-500">Henüz bir siparişin yok.</p>
        <Link
          href="/"
          className="mt-4 inline-flex rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-orange transition-colors"
        >
          Alışverişe Başla
        </Link>
      </div>
    </div>
  );
}
