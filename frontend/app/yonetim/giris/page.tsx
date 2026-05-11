"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";

type Tab = "giris" | "kayit";

export default function YonetimGirisPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState<Tab>("giris");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Giriş formu
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Kayıt formu
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [accountType, setAccountType] = useState<"bireysel" | "tüzel">("bireysel");
  // Tüzel ek alanlar
  const [companyName, setCompanyName] = useState("");
  const [taxNo, setTaxNo] = useState("");
  const [taxOffice, setTaxOffice] = useState("");

  useEffect(() => {
    if (isAuthenticated()) router.replace("/yonetim");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/seller/login", { email: loginEmail, password: loginPassword });
      setAuth(res.data.data.user, res.data.data.token);
      await useCartStore.getState().fetchCart(res.data.data.token);
      router.push("/yonetim");
    } catch (err: any) {
      setError(err.response?.data?.message || "E-posta veya şifre hatalı.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (regPassword !== regPasswordConfirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (regPassword.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }
    if (accountType === "tüzel" && (!companyName || !taxNo || !taxOffice)) {
      setError("Tüzel kişi bilgileri eksiksiz doldurulmalıdır.");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        accountType: accountType === "tüzel" ? "TUZEL" : "BIREYSEL",
        email: regEmail,
        password: regPassword,
        ...(accountType === "bireysel"
          ? { fullName: regName }
          : { companyName, taxNo, taxOffice }),
      };

      await apiClient.post("/auth/seller/register", payload);
      setSuccess("Hesabınız oluşturuldu! Şimdi giriş yapabilirsiniz.");
      setTab("giris");
      setLoginEmail(regEmail);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Kayıt başarısız.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex flex-col leading-none">
            <span className="text-[#ff6000] font-black text-4xl tracking-tight">bidunyam</span>
            <span className="text-[11px] font-bold text-[#1b1c57] tracking-widest uppercase mt-0.5">Yönetim Paneli</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
          {/* Tab Header */}
          <div className="grid grid-cols-2 border-b border-slate-100">
            {(["giris", "kayit"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                className={`py-4 text-sm font-black tracking-wide transition-colors ${
                  tab === t
                    ? "text-[#ff6000] border-b-2 border-[#ff6000]"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t === "giris" ? "Giriş Yap" : "Kayıt Ol"}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* Bildirimler */}
            {error && (
              <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs font-bold text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-xs font-bold text-green-700">
                {success}
              </div>
            )}

            {/* ──── GİRİŞ FORMU ──── */}
            {tab === "giris" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">E-Posta</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="ornek@sirket.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#ff6000] transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Şifre</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#ff6000] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-xl bg-[#ff6000] py-3.5 text-sm font-black text-white hover:bg-[#d85000] transition-colors disabled:opacity-60"
                >
                  {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </button>
                <p className="text-center text-xs text-slate-400 pt-2">
                  Demo: <span className="font-bold text-slate-600">mustafa@demo.com</span> / <span className="font-bold text-slate-600">123456</span>
                </p>
              </form>
            )}

            {/* ──── KAYIT FORMU ──── */}
            {tab === "kayit" && (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Hesap Türü */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Hesap Türü</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["bireysel", "tüzel"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAccountType(type)}
                        className={`rounded-xl border py-3 text-sm font-black transition-colors ${
                          accountType === type
                            ? "border-[#ff6000] bg-[#ff6000]/5 text-[#ff6000]"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {type === "bireysel" ? "Bireysel" : "Tüzel Kişi"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bireysel: Ad Soyad */}
                {accountType === "bireysel" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Ad Soyad</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      minLength={2}
                      placeholder="Mustafa Öztürk"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#ff6000] transition-colors"
                    />
                  </div>
                )}

                {/* Tüzel: Şirket Bilgileri */}
                {accountType === "tüzel" && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Şirket / Ticaret Unvanı</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        placeholder="Örnek A.Ş."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#ff6000] transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Vergi No</label>
                        <input
                          type="text"
                          value={taxNo}
                          onChange={(e) => setTaxNo(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          required
                          placeholder="1234567890"
                          maxLength={10}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#ff6000] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Vergi Dairesi</label>
                        <input
                          type="text"
                          value={taxOffice}
                          onChange={(e) => setTaxOffice(e.target.value)}
                          required
                          placeholder="Kadıköy VD"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#ff6000] transition-colors"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">E-Posta</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="ornek@sirket.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#ff6000] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Şifre</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Min. 8 karakter"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#ff6000] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Şifre Tekrar</label>
                    <input
                      type="password"
                      value={regPasswordConfirm}
                      onChange={(e) => setRegPasswordConfirm(e.target.value)}
                      required
                      placeholder="••••••••"
                      className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm outline-none transition-colors ${
                        regPasswordConfirm && regPassword !== regPasswordConfirm
                          ? "border-red-400 focus:border-red-500"
                          : "border-slate-200 focus:border-[#ff6000]"
                      }`}
                    />
                  </div>
                </div>

                {/* Şifre gücü göstergesi */}
                {regPassword && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => {
                        const strength = regPassword.length >= 8
                          ? regPassword.length >= 12
                            ? /[A-Z]/.test(regPassword) && /[0-9]/.test(regPassword) ? 4 : 3
                            : 2
                          : 1;
                        return (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i < strength
                                ? strength === 1 ? "bg-red-400" : strength === 2 ? "bg-amber-400" : strength === 3 ? "bg-blue-400" : "bg-green-500"
                                : "bg-slate-200"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {regPassword.length < 8 ? "Çok kısa" : regPassword.length < 12 ? "Zayıf" : /[A-Z]/.test(regPassword) && /[0-9]/.test(regPassword) ? "Güçlü" : "Orta"}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-xl bg-[#1b1c57] py-3.5 text-sm font-black text-white hover:bg-[#ff6000] transition-colors disabled:opacity-60"
                >
                  {loading ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
                </button>

                <p className="text-center text-[10px] text-slate-400 leading-relaxed">
                  Kayıt olarak <span className="underline cursor-pointer">Kullanıcı Sözleşmesi</span>'ni ve{" "}
                  <span className="underline cursor-pointer">Gizlilik Politikası</span>'nı kabul etmiş olursunuz.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
