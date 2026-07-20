"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { useSellerAuthStore } from "@/stores/sellerAuthStore";
import { useCartStore } from "@/stores/cartStore";

type Tab = "giris" | "kayit";

export default function YonetimGirisPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useSellerAuthStore();
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
  
  // Bireysel ödeme/tahsilat alanları
  const [regTc, setRegTc] = useState("");
  const [regIban, setRegIban] = useState("");

  // Tüzel ek alanlar
  const [companyName, setCompanyName] = useState("");
  const [taxNo, setTaxNo] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [companyIban, setCompanyIban] = useState("");

  // Sözleşme onayları (bireysel/tüzel'e göre farklılaşır)
  const [agreeTerms, setAgreeTerms] = useState(false);   // Üyelik & Kullanım Koşulları
  const [agreeKvkk, setAgreeKvkk] = useState(false);     // KVKK Aydınlatma Metni
  const [agreeSeller, setAgreeSeller] = useState(false); // Pazaryeri Satıcı Sözleşmesi (tüzel için zorunlu)

  const contractsOk = accountType === "tüzel"
    ? agreeTerms && agreeKvkk && agreeSeller
    : agreeTerms && agreeKvkk;

  useEffect(() => {
    if (isAuthenticated()) router.replace("/yonetim");
  }, [isAuthenticated, router]);

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
    if (!contractsOk) {
      setError("Devam etmek için sözleşmeleri onaylamanız gerekmektedir.");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string | boolean> = {
        accountType: accountType === "tüzel" ? "TUZEL" : "BIREYSEL",
        email: regEmail,
        password: regPassword,
        acceptedKvkk: agreeKvkk,
        acceptedSellerAgreement: accountType === "tüzel" ? agreeSeller : agreeTerms,
        ...(accountType === "bireysel"
          ? { fullName: regName, tcNo: regTc, iban: regIban }
          : { companyName, taxNo, taxOffice, companyIban }),
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased font-sans">
      <div className="w-full max-w-[420px] space-y-6">
        <div className="flex justify-center pb-2">
          <Link href="/" className="text-[11px] font-black uppercase tracking-wider text-slate-400 hover:text-[#ff6000] transition-all flex items-center gap-1.5 hover:-translate-x-1 duration-300">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Pazaryerine Git
          </Link>
        </div>

        {/* Title / Logo Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center space-x-1.5 leading-none">
            <span className="text-[#ff6000] font-black text-4xl tracking-tight">bidunyam</span>
            <span className="rounded-[4px] bg-[#ff6000]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#ff6000]">
              Partner
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 tracking-wide">Satıcı Portalı ve Yönetim Paneli</p>
        </div>

        {/* Card Component */}
        <div className="bg-white rounded-2xl border-[0.5px] border-slate-200/80 shadow-sm overflow-hidden">
          {/* Tab Selection */}
          <div className="grid grid-cols-2 border-b-[0.5px] border-slate-100">
            {(["giris", "kayit"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                className={`py-4 text-xs font-black tracking-wider uppercase transition-all duration-200 active:scale-[0.98] ${
                  tab === t
                    ? "text-[#ff6000] border-b-2 border-[#ff6000]"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                }`}
              >
                {t === "giris" ? "Giriş Yap" : "Kayıt Ol"}
              </button>
            ))}
          </div>

          <div className="p-7">
            {/* Feedback Banners */}
            {error && (
              <div className="mb-5 rounded-xl bg-red-50 border-[0.5px] border-red-200/80 px-4 py-3 text-xs font-black text-red-600">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="mb-5 rounded-xl bg-emerald-50 border-[0.5px] border-emerald-200/80 px-4 py-3 text-xs font-black text-emerald-700">
                ✅ {success}
              </div>
            )}

            {/* Giriş Tab */}
            {tab === "giris" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">E-Posta Adresi</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="isim@sirket.com"
                    className="w-full rounded-xl border-[0.5px] border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-semibold outline-none focus:border-[#ff6000] focus:bg-white transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Şifre</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border-[0.5px] border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-semibold outline-none focus:border-[#ff6000] focus:bg-white transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-xl bg-[#ff6000] py-3.5 text-xs font-black text-white hover:bg-[#ff6000]/95 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 uppercase tracking-wider"
                >
                  {loading ? "Giriş yapılıyor..." : "Güvenli Giriş Yap"}
                </button>

                <div className="pt-3 border-t-[0.5px] border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Demo Seller:</span>
                  <span className="font-bold text-slate-600">mustafa@demo.com / 123</span>
                </div>
              </form>
            )}

            {/* Kayıt Tab */}
            {tab === "kayit" && (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Account Type Toggle */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Hesap Türü</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["bireysel", "tüzel"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAccountType(type)}
                        className={`rounded-xl border-[0.5px] py-2.5 text-xs font-black transition-all duration-200 active:scale-[0.97] ${
                          accountType === type
                            ? "border-[#ff6000] bg-[#ff6000]/5 text-[#ff6000]"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {type === "bireysel" ? "Bireysel" : "Tüzel (Şirket)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account-specific Fields */}
                {accountType === "bireysel" ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Ad Soyad</label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        minLength={2}
                        placeholder="Mustafa Öztürk"
                        className="w-full rounded-xl border-[0.5px] border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-semibold outline-none focus:border-[#ff6000] focus:bg-white transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">T.C. Kimlik No</label>
                      <input
                        type="text"
                        value={regTc}
                        onChange={(e) => setRegTc(e.target.value.replace(/\D/g, "").slice(0, 11))}
                        placeholder="11 haneli (tahsilat için gerekli)"
                        maxLength={11}
                        className="w-full rounded-xl border-[0.5px] border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-semibold outline-none focus:border-[#ff6000] focus:bg-white transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">IBAN (Ödemelerinizin yatacağı hesap)</label>
                      <input
                        type="text"
                        value={regIban}
                        onChange={(e) => setRegIban(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 26))}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        className="w-full rounded-xl border-[0.5px] border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-semibold outline-none focus:border-[#ff6000] focus:bg-white transition-all duration-200"
                      />
                      <p className="text-[9px] font-semibold text-slate-400">Satışlarınız kargo teslimi sonrası bu IBAN'a haftalık aktarılır.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Şirket Ticari Unvanı</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        placeholder="Örnek A.Ş."
                        className="w-full rounded-xl border-[0.5px] border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-semibold outline-none focus:border-[#ff6000] focus:bg-white transition-all duration-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Vergi Numarası</label>
                        <input
                          type="text"
                          value={taxNo}
                          onChange={(e) => setTaxNo(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          required
                          placeholder="10 Haneli No"
                          maxLength={10}
                          className="w-full rounded-xl border-[0.5px] border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-semibold outline-none focus:border-[#ff6000] focus:bg-white transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Vergi Dairesi</label>
                        <input
                          type="text"
                          value={taxOffice}
                          onChange={(e) => setTaxOffice(e.target.value)}
                          required
                          placeholder="Mecidiyeköy VD"
                          className="w-full rounded-xl border-[0.5px] border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-semibold outline-none focus:border-[#ff6000] focus:bg-white transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Şirket IBAN (Hakediş hesabı)</label>
                      <input
                        type="text"
                        value={companyIban}
                        onChange={(e) => setCompanyIban(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 26))}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        className="w-full rounded-xl border-[0.5px] border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-semibold outline-none focus:border-[#ff6000] focus:bg-white transition-all duration-200"
                      />
                      <p className="text-[9px] font-semibold text-slate-400">Faturalı satışlarınızın hakedişi 15 günlük vade ile bu hesaba aktarılır.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">E-Posta Adresi</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="isim@sirket.com"
                    className="w-full rounded-xl border-[0.5px] border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-semibold outline-none focus:border-[#ff6000] focus:bg-white transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Şifre</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Min. 8 Karakter"
                      className="w-full rounded-xl border-[0.5px] border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-semibold outline-none focus:border-[#ff6000] focus:bg-white transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Şifre Tekrarı</label>
                    <input
                      type="password"
                      value={regPasswordConfirm}
                      onChange={(e) => setRegPasswordConfirm(e.target.value)}
                      required
                      placeholder="••••••••"
                      className={`w-full rounded-xl border-[0.5px] bg-slate-50/60 px-4 py-3 text-xs font-semibold outline-none transition-all duration-200 ${
                        regPasswordConfirm && regPassword !== regPasswordConfirm
                          ? "border-red-400 focus:border-red-500 focus:bg-white"
                          : "border-slate-200 focus:border-[#ff6000] focus:bg-white"
                      }`}
                    />
                  </div>
                </div>

                {/* Password strength bar */}
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
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i < strength
                                ? strength === 1 ? "bg-red-400" : strength === 2 ? "bg-amber-400" : strength === 3 ? "bg-[#ff6000]/60" : "bg-emerald-500"
                                : "bg-slate-100"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold">
                      Şifre gücü: {regPassword.length < 8 ? "Zayıf" : regPassword.length < 12 ? "Orta" : "Güçlü"}
                    </p>
                  </div>
                )}

                {/* Sözleşme Onayları */}
                <div className="space-y-2.5 rounded-xl border-[0.5px] border-slate-200 bg-slate-50/50 p-3.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {accountType === "tüzel" ? "Kurumsal Satıcı Sözleşmeleri" : "Bireysel Satıcı Sözleşmeleri"}
                  </p>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#ff6000]" />
                    <span className="text-[11px] font-semibold leading-snug text-slate-600">
                      <Link href="/sozlesmeler/kullanim-kosullari" target="_blank" className="text-[#ff6000] hover:underline">Üyelik ve Kullanım Koşulları</Link>'nı okudum, onaylıyorum.
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={agreeKvkk} onChange={(e) => setAgreeKvkk(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#ff6000]" />
                    <span className="text-[11px] font-semibold leading-snug text-slate-600">
                      <Link href="/sozlesmeler/kvkk" target="_blank" className="text-[#ff6000] hover:underline">KVKK Aydınlatma Metni</Link>'ni okudum, kişisel verilerimin işlenmesini kabul ediyorum.
                    </span>
                  </label>
                  {accountType === "tüzel" && (
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={agreeSeller} onChange={(e) => setAgreeSeller(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#ff6000]" />
                      <span className="text-[11px] font-semibold leading-snug text-slate-600">
                        <Link href="/sozlesmeler/mesafeli-satis-sozlesmesi" target="_blank" className="text-[#ff6000] hover:underline">Pazaryeri Satıcı Sözleşmesi</Link>'ni okudum, tüzel kişi olarak onaylıyorum.
                      </span>
                    </label>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !contractsOk}
                  className="w-full mt-2 rounded-xl bg-slate-800 py-3.5 text-xs font-black text-white hover:bg-slate-900 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  {loading ? "Kaydediliyor..." : "Partner Hesabı Oluştur"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Dynamic device-security confirmation card */}
        <div className="bg-[#ff6000]/5 rounded-xl border-[0.5px] border-[#ff6000]/25 p-4 text-center space-y-1">
          <p className="text-[10px] font-black text-[#ff6000] uppercase tracking-wider">🔒 BİLGİSAYAR TABANLI GÜVENLİK SİSTEMİ</p>
          <p className="text-[9px] text-slate-500 leading-relaxed font-semibold">
            Oturumunuz bu tarayıcıya/bilgisayara özel şifreli bir kimlikle bağlanır. Token çalınsa dahi başka bir bilgisayardan yönetim paneline erişim sağlanamaz.
          </p>
        </div>
      </div>
    </div>
  );
}
