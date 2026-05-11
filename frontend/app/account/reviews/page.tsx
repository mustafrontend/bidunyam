"use client";

export default function ReviewsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Değerlendirmelerim</h1>
      <p className="mt-2 text-slate-500">Aldığınız ve verdiğiniz değerlendirmeleri görüntüleyin.</p>

      <div className="mt-8 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-8 py-12 text-center">
        <p className="text-3xl mb-2">⭐</p>
        <p className="text-slate-500">Henüz değerlendirme yapmadınız.</p>
        <p className="mt-1 text-sm text-slate-400">Aldığınız ürünleri değerlendirerek diğer alıcılara yardımcı olun.</p>
      </div>
    </div>
  );
}
