"use client";

import { useCallback, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/api";
import { User, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

interface ProfileForm {
  name: string;
  email: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type FormStatus = "idle" | "loading" | "success" | "error";

export default function InfoPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [profileStatus, setProfileStatus] = useState<FormStatus>("idle");
  const [profileError, setProfileError] = useState("");

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStatus, setPasswordStatus] = useState<FormStatus>("idle");
  const [passwordError, setPasswordError] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const handleProfileSave = useCallback(async () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setProfileError("Ad ve e-posta boş bırakılamaz.");
      return;
    }
    setProfileStatus("loading");
    setProfileError("");
    try {
      const res = await apiClient.patch(
        "/auth/profile",
        { name: profileForm.name.trim(), email: profileForm.email.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = res.data?.data?.user;
      if (updatedUser && user) {
        setAuth({ ...user, name: updatedUser.name, email: updatedUser.email }, token!);
      }
      setProfileStatus("success");
      setTimeout(() => setProfileStatus("idle"), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bilgiler güncellenemedi.";
      setProfileError(msg);
      setProfileStatus("error");
    }
  }, [profileForm, token, user, setAuth]);

  const handlePasswordChange = useCallback(async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError("Tüm şifre alanları doldurulmalıdır.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Yeni şifreler eşleşmiyor.");
      return;
    }
    setPasswordStatus("loading");
    setPasswordError("");
    try {
      await apiClient.patch(
        "/auth/change-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordStatus("success");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordStatus("idle"), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Şifre değiştirilemedi.";
      setPasswordError(msg);
      setPasswordStatus("error");
    }
  }, [passwordForm, token]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kullanıcı Bilgilerim</h1>
        <p className="mt-1 text-slate-400 text-sm font-medium">Profil ve hesap bilgilerinizi yönetin.</p>
      </div>

      {/* Profile Info Section */}
      <div className="rounded-2xl border border-slate-100 p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
            <User size={18} className="text-slate-600" />
          </div>
          <h2 className="text-base font-black text-slate-900">Temel Bilgiler</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">Ad Soyad</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
              placeholder="Adınız Soyadınız"
            />
          </div>
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">E-Posta</label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
              placeholder="eposta@ornek.com"
            />
          </div>
        </div>

        {profileError && (
          <div className="flex items-center gap-2 text-red-500 text-sm font-bold">
            <AlertCircle size={14} />
            {profileError}
          </div>
        )}
        {profileStatus === "success" && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
            <CheckCircle2 size={14} />
            Bilgiler başarıyla güncellendi.
          </div>
        )}

        <button
          onClick={handleProfileSave}
          disabled={profileStatus === "loading"}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-[#ff5000] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {profileStatus === "loading" ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      {/* Password Change Section */}
      <div className="rounded-2xl border border-slate-100 p-6 space-y-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Lock size={18} className="text-slate-600" />
            </div>
            <h2 className="text-base font-black text-slate-900">Şifre Değiştir</h2>
          </div>
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1"
          >
            {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}
            {showPasswords ? "Gizle" : "Göster"}
          </button>
        </div>

        <div className="space-y-4">
          {(["currentPassword", "newPassword", "confirmPassword"] as const).map((field) => {
            const labels: Record<typeof field, string> = {
              currentPassword: "Mevcut Şifre",
              newPassword: "Yeni Şifre",
              confirmPassword: "Yeni Şifre (Tekrar)",
            };
            return (
              <div key={field}>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                  {labels[field]}
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={passwordForm[field]}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                  placeholder="••••••••"
                />
              </div>
            );
          })}
        </div>

        {passwordError && (
          <div className="flex items-center gap-2 text-red-500 text-sm font-bold">
            <AlertCircle size={14} />
            {passwordError}
          </div>
        )}
        {passwordStatus === "success" && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-bold">
            <CheckCircle2 size={14} />
            Şifreniz başarıyla değiştirildi.
          </div>
        )}

        <button
          onClick={handlePasswordChange}
          disabled={passwordStatus === "loading"}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-[#ff5000] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {passwordStatus === "loading" ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
        </button>
      </div>
    </div>
  );
}
