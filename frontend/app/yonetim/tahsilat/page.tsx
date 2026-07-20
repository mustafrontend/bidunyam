"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api";
import { useSellerAuthStore } from "@/stores/sellerAuthStore";
import { Wallet, Banknote, Clock, TrendingUp, Save, Percent, CalendarClock } from "lucide-react";

const TL = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL";
const COMMISSION = 0.10; // biDünyam komisyonu %10

export default function TahsilatPage() {
  const { token } = useSellerAuthStore();
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [iban, setIban] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiClient.get("/auth/seller/profile", authHeaders),
      apiClient.get("/products?myProducts=true&limit=500", authHeaders).catch(() => null),
    ]).then(([pRes, prRes]) => {
      const p = pRes.data?.data || {};
      setProfile(p);
      setIban(p.accountType === "TUZEL" ? (p.companyIban || "") : (p.iban || ""));
      setProducts(prRes?.data?.data?.products || []);
    }).finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [token]);

  const isTuzel = profile?.accountType === "TUZEL";

  // Kazanç: ürünlerin satış adedi × fiyat (mock hakediş)
  const gross = useMemo(() => products.reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.sales) || 0), 0), [products]);
  const commission = gross * COMMISSION;
  const net = gross - commission;
  const pending = net * 0.35;   // kargo/iade vadesindeki tutar
  const available = net - pending;

  const saveIban = async () => {
    setSaving(true);
    try {
      await apiClient.put("/auth/seller/profile", isTuzel ? { companyIban: iban } : { iban }, authHeaders);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-20 text-center font-bold text-slate-400">Yükleniyor…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-800">Tahsilat & Hakediş</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isTuzel ? "Faturalı satışlarınızın hakedişi 15 günlük vade ile şirket hesabınıza aktarılır." : "Satışlarınız kargo teslimi sonrası haftalık olarak IBAN'ınıza aktarılır."}
        </p>
      </div>

      {/* Özet kartları */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-5 text-white">
          <Wallet size={20} className="mb-2 opacity-80" />
          <p className="text-xs font-bold uppercase text-white/80">Ödenebilir Bakiye</p>
          <p className="mt-1 text-2xl font-black">{TL(available)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Clock size={20} className="mb-2 text-amber-500" />
          <p className="text-xs font-bold uppercase text-slate-400">Vadedeki (Bekleyen)</p>
          <p className="mt-1 text-2xl font-black text-slate-800">{TL(pending)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <TrendingUp size={20} className="mb-2 text-indigo-500" />
          <p className="text-xs font-bold uppercase text-slate-400">Toplam Ciro</p>
          <p className="mt-1 text-2xl font-black text-slate-800">{TL(gross)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Percent size={20} className="mb-2 text-rose-500" />
          <p className="text-xs font-bold uppercase text-slate-400">biDünyam Komisyonu</p>
          <p className="mt-1 text-2xl font-black text-slate-800">{TL(commission)}</p>
          <p className="text-[10px] font-bold text-slate-400">%{(COMMISSION * 100).toFixed(0)} hizmet bedeli</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* IBAN / Ödeme hesabı */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-black text-slate-800"><Banknote size={16} /> Ödeme Hesabı</h3>
          <p className="mb-4 text-xs text-slate-400">
            {isTuzel ? "Şirket IBAN'ınız (hakediş bu hesaba yatar)." : "Kişisel IBAN'ınız (ödemeleriniz bu hesaba yatar)."}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input value={iban} onChange={(e) => setIban(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 26))}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#ff6000]" />
            <button onClick={saveIban} disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#ff6000] px-5 py-2.5 text-sm font-black text-white disabled:opacity-60">
              <Save size={15} /> {saving ? "…" : saved ? "Kaydedildi ✓" : "Kaydet"}
            </button>
          </div>
          {(isTuzel ? profile?.taxNo : profile?.tcNo) && (
            <p className="mt-3 text-xs font-semibold text-slate-400">
              {isTuzel ? `Vergi No: ${profile.taxNo} · ${profile.taxOffice || ""}` : `T.C. No: ${String(profile.tcNo).replace(/(\d{3})\d{5}(\d{3})/, "$1*****$2")}`}
            </p>
          )}
        </div>

        {/* Ödeme takvimi */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-800"><CalendarClock size={16} /> Ödeme Takvimi</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Ödeme Sıklığı</span>
              <span className="font-black text-slate-800">{isTuzel ? "15 gün vade" : "Haftalık"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Sonraki Ödeme</span>
              <span className="font-black text-slate-800">
                {new Date(Date.now() + (isTuzel ? 15 : 7) * 86400000).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Hesap Tipi</span>
              <span className="font-black text-slate-800">{isTuzel ? "Kurumsal (Faturalı)" : "Bireysel"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
