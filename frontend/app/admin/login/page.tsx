"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api";
import { Lock, Phone, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Remove any formatting from phone
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      
      const res = await apiClient.post("/auth/admin/login", {
        phone: cleanPhone,
        password,
      });

      if (res.data?.success) {
        setAuth(res.data.data.user, res.data.data.token);
        router.push("/admin");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="px-8 pt-10 pb-8 text-center space-y-2">
          <div className="w-16 h-16 bg-[#ff5000]/10 text-[#ff5000] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Super Admin</h1>
          <p className="text-sm font-semibold text-slate-500">
            Sisteme giriş yapmak için telefon numaranızı ve şifrenizi girin.
          </p>
        </div>

        <form onSubmit={handleLogin} className="px-8 pb-10 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Phone size={20} />
              </div>
              <input
                type="tel"
                placeholder="05XX XXX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ff5000]/20 focus:border-[#ff5000] transition-all"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={20} />
              </div>
              <input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#ff5000]/20 focus:border-[#ff5000] transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff5000] hover:bg-[#ff5000]/90 disabled:opacity-50 text-white font-black text-sm py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2"
          >
            {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            {!loading && <ArrowRight size={18} strokeWidth={3} />}
          </button>
        </form>
      </div>
    </div>
  );
}
