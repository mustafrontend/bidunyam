"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useSellerAuthStore } from "@/stores/sellerAuthStore";
import { FileText, Download, CheckCircle2, ShieldCheck } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  accountType: "BIREYSEL" | "TUZEL";
  fullName?: string;
  tcNo?: string;
  iban?: string;
  companyName?: string;
  taxNo?: string;
  taxOffice?: string;
  companyIban?: string;
  acceptedKvkk?: boolean;
  acceptedSellerAgreement?: boolean;
  contractAcceptedAt?: string;
  contractVersion?: string;
  createdAt?: string;
}

const maskTc = (tc?: string) => (tc && tc.length === 11 ? `${tc.slice(0, 3)}*****${tc.slice(-3)}` : tc || "—");
const maskIban = (i?: string) => (i && i.length > 10 ? `${i.slice(0, 8)}••••••••${i.slice(-4)}` : i || "—");

export default function SozlesmelerimPage() {
  const { token } = useSellerAuthStore();
  const [p, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    apiClient
      .get("/auth/seller/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setProfile(res.data?.data))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="py-20 text-center font-bold text-slate-400">Yükleniyor…</div>;
  if (!p) return <div className="py-20 text-center font-bold text-slate-400">Profil bulunamadı.</div>;

  const isTuzel = p.accountType === "TUZEL";
  const acceptedAt = p.contractAcceptedAt || p.createdAt;
  const dateStr = acceptedAt
    ? new Date(acceptedAt).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })
    : "—";
  const docNo = `BD-SZL-${p.id.slice(0, 8).toUpperCase()}`;

  const contracts = [
    { key: "terms", name: "Üyelik ve Kullanım Koşulları", slug: "kullanim-kosullari", accepted: true },
    { key: "kvkk", name: "KVKK Aydınlatma Metni", slug: "kvkk", accepted: !!p.acceptedKvkk },
    ...(isTuzel
      ? [{ key: "seller", name: "Pazaryeri Satıcı Sözleşmesi", slug: "mesafeli-satis-sozlesmesi", accepted: !!p.acceptedSellerAgreement }]
      : [{ key: "seller", name: "Bireysel Satıcı Sözleşmesi", slug: "mesafeli-satis-sozlesmesi", accepted: !!p.acceptedSellerAgreement }]),
  ];

  return (
    <div className="space-y-6">
      {/* Yazdırılmayan başlık */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">Sözleşmelerim</h2>
          <p className="mt-1 text-sm text-slate-500">
            Kayıt sırasında elektronik ortamda onayladığınız sözleşmeler. Belgeyi PDF olarak indirebilirsiniz.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-[#ff6000] px-5 py-2.5 text-sm font-black text-white hover:bg-[#e05500]"
        >
          <Download size={16} /> PDF Olarak İndir
        </button>
      </div>

      {/* Belge */}
      <div id="contract-doc" className="rounded-2xl border border-slate-200 bg-white p-8 md:p-10">
        {/* Belge başlığı */}
        <div className="mb-8 flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-[#ff6000]">bidunyam</span>
              <span className="rounded bg-[#ff6000]/10 px-2 py-0.5 text-[10px] font-black uppercase text-[#ff6000]">Partner</span>
            </div>
            <h1 className="mt-3 text-xl font-black text-slate-900">
              Satıcı Sözleşmesi ve Onay Belgesi
            </h1>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {isTuzel ? "Tüzel Kişi (Kurumsal) Satıcı" : "Bireysel Satıcı"} · Sürüm {p.contractVersion || "1.0"}
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold text-slate-400">Belge No</p>
            <p className="font-mono font-black text-slate-700">{docNo}</p>
            <p className="mt-2 font-bold text-slate-400">Onay Tarihi</p>
            <p className="font-semibold text-slate-700">{dateStr}</p>
          </div>
        </div>

        {/* 1. Taraflar */}
        <section className="mb-7">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">1. Taraflar</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-1 text-[11px] font-black uppercase text-slate-400">Platform (Hizmet Sağlayıcı)</p>
              <p className="text-sm font-bold text-slate-800">biDünyam · ART RUE</p>
              <p className="text-xs text-slate-500">Vergi No: 4910110358</p>
              <p className="text-xs text-slate-500">info@bidunyam.com</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="mb-1 text-[11px] font-black uppercase text-slate-400">Satıcı</p>
              {isTuzel ? (
                <>
                  <p className="text-sm font-bold text-slate-800">{p.companyName || "—"}</p>
                  <p className="text-xs text-slate-500">Vergi No: {p.taxNo || "—"} · {p.taxOffice || "—"}</p>
                  <p className="text-xs text-slate-500">IBAN: {maskIban(p.companyIban)}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-800">{p.fullName || "—"}</p>
                  <p className="text-xs text-slate-500">T.C. No: {maskTc(p.tcNo)}</p>
                  <p className="text-xs text-slate-500">IBAN: {maskIban(p.iban)}</p>
                </>
              )}
              <p className="text-xs text-slate-500">{p.email}</p>
            </div>
          </div>
        </section>

        {/* 2. Onaylanan sözleşmeler */}
        <section className="mb-7">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">2. Onaylanan Sözleşmeler</h3>
          <div className="space-y-2">
            {contracts.map((c) => (
              <div key={c.key} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className={c.accepted ? "text-emerald-600" : "text-slate-300"} />
                  <span className="text-sm font-bold text-slate-800">{c.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-black ${c.accepted ? "text-emerald-600" : "text-slate-400"}`}>
                    {c.accepted ? "Onaylandı" : "Onaylanmadı"}
                  </span>
                  <a href={`/sozlesmeler/${c.slug}`} target="_blank" rel="noreferrer"
                    className="no-print flex items-center gap-1 text-xs font-bold text-[#ff6000] hover:underline">
                    <FileText size={12} /> Metni Gör
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Temel hükümler */}
        <section className="mb-7">
          <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">3. Temel Hükümler</h3>
          <ol className="list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-slate-600">
            <li>
              Satıcı, platformda yayınladığı ürünlerin doğruluğundan, yasal uygunluğundan ve teslimatından sorumludur.
            </li>
            <li>
              Platform hizmet bedeli (komisyon) <strong>%10</strong> olarak uygulanır ve satış tutarından mahsup edilir.
            </li>
            <li>
              Hakediş ödemeleri {isTuzel ? "faturalandırmayı takiben 15 (on beş) gün vade ile" : "kargo teslimini takiben haftalık olarak"} Satıcı'nın
              beyan ettiği IBAN hesabına aktarılır.
            </li>
            <li>
              Alıcı, teslim tarihinden itibaren 14 (on dört) gün içinde cayma hakkını kullanabilir; iade süreci platform üzerinden yürütülür.
            </li>
            <li>
              {isTuzel
                ? "Tüzel kişi satıcılar yalnızca sıfır (yeni) ürün satışı yapabilir ve her satış için fatura düzenlemekle yükümlüdür."
                : "Bireysel satıcılar ikinci el ürün satabilir; ürün durumunu (Sıfır / Az Kullanılmış / İkinci El) doğru beyan etmekle yükümlüdür."}
            </li>
            <li>
              Kişisel veriler 6698 sayılı KVKK kapsamında işlenir; Satıcı, aydınlatma metnini okuduğunu kabul eder.
            </li>
            <li>
              Taraflar arasındaki uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
            </li>
          </ol>
        </section>

        {/* Onay kutusu */}
        <section className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={20} />
            <div>
              <p className="text-sm font-black text-emerald-800">Elektronik Onay Kaydı</p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
                İşbu sözleşme, <strong>{dateStr}</strong> tarihinde{" "}
                <strong>{isTuzel ? p.companyName : p.fullName}</strong> tarafından{" "}
                <strong>{p.email}</strong> hesabı üzerinden elektronik ortamda onaylanmıştır.
                6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun uyarınca ıslak imza aranmaksızın geçerlidir.
              </p>
              <p className="mt-2 font-mono text-[11px] font-bold text-slate-500">
                Belge No: {docNo} · Sürüm: {p.contractVersion || "1.0"} · Hesap: {p.id}
              </p>
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-[10px] font-semibold text-slate-400">
          Bu belge biDünyam sistemleri tarafından otomatik oluşturulmuştur. · bidunyam.com
        </p>
      </div>

      {/* Yazdırma stilleri — PDF çıktısı için */}
      <style jsx global>{`
        @media print {
          .no-print,
          header,
          footer,
          aside,
          nav {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
          #contract-doc {
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4;
            margin: 16mm;
          }
        }
      `}</style>
    </div>
  );
}
