"use client";

export default function RequestsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Soru ve Taleplerim</h1>
      <p className="mt-2 text-slate-500">Satıcılara gönderdiğiniz soruları ve istekleri yönetin.</p>

      <div className="mt-8 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-8 py-12 text-center">
        <p className="text-3xl mb-2">💬</p>
        <p className="text-slate-500">Henüz bir soru veya talebin yok.</p>
        <p className="mt-1 text-sm text-slate-400">Ürün sayfalarından satıcılara soru sorabilirsiniz.</p>
      </div>
    </div>
  );
}
