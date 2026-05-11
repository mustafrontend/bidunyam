"use client";

import { useAuthStore } from "@/stores/authStore";

export default function InfoPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Kullanıcı Bilgilerim</h1>
      <p className="mt-2 text-slate-500">Profil ve hesap bilgilerinizi yönetin.</p>

      <div className="mt-8 space-y-6">
        {/* Basic Info */}
        <div className="rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Temel Bilgiler</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Ad Soyad</label>
              <p className="mt-2 text-slate-900 font-medium">{user?.name || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">E-Posta</label>
              <p className="mt-2 text-slate-900 font-medium">{user?.email || "—"}</p>
            </div>
            <button className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              Bilgileri Düzenle
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Güvenlik</h2>
          <div className="mt-4">
            <button className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">
              Şifre Değiştir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
