"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useSellerAuthStore } from "@/stores/sellerAuthStore";
import { FileText, Download, CheckCircle2, ShieldCheck, Upload, Clock, XCircle, Send } from "lucide-react";
import { ContractReaderModal } from "@/components/seller/ContractReaderModal";
import { contractsFor, documentsFor, type SellerContract } from "@/lib/sellerContracts";
import { fileToDataUrl } from "@/lib/documentUpload";

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
  acceptedContracts?: Array<{ key: string; title: string; version: string; acceptedAt: string }>;
  uploadedDocuments?: string[];
  missing?: { contracts: string[]; documents: string[] };
  onboardingStatus?: string;
  onboardingNote?: string;
  onboardingSubmittedAt?: string;
  onboardingReviewedAt?: string;
}

const STATUS_CARD: Record<string, { label: string; detail: string; cls: string; Icon: typeof Clock }> = {
  CONTRACTS_PENDING: {
    label: "Sözleşmeler tamamlanmadı",
    detail: "Aşağıdaki sözleşmeleri okuyup onaylayın ve zorunlu belgeleri yükleyin. Tamamlandığında başvurunuz otomatik olarak onaya gönderilir.",
    cls: "border-amber-200 bg-amber-50 text-amber-800",
    Icon: FileText,
  },
  REVIEW_PENDING: {
    label: "Başvurunuz onay bekliyor",
    detail: "Belgeleriniz onay ekibimize iletildi. Onaylandığı anda panelinizdeki tüm menüler açılır.",
    cls: "border-blue-200 bg-blue-50 text-blue-800",
    Icon: Clock,
  },
  APPROVED: {
    label: "Satıcı hesabınız onaylı",
    detail: "Tüm panel özellikleri kullanımınıza açık.",
    cls: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Icon: CheckCircle2,
  },
  REJECTED: {
    label: "Başvurunuz reddedildi",
    detail: "Gerekçeyi inceleyip belgelerinizi güncelleyin ve tekrar gönderin.",
    cls: "border-red-200 bg-red-50 text-red-800",
    Icon: XCircle,
  },
};

const maskTc = (tc?: string) => (tc && tc.length === 11 ? `${tc.slice(0, 3)}*****${tc.slice(-3)}` : tc || "—");
const maskIban = (i?: string) => (i && i.length > 10 ? `${i.slice(0, 8)}••••••••${i.slice(-4)}` : i || "—");

export default function SozlesmelerimPage() {
  const { token } = useSellerAuthStore();
  const [p, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Eksik sözleşme/belgeleri buradan tamamlayıp onaya gönderilebilir
  const [openContract, setOpenContract] = useState<SellerContract | null>(null);
  const [newlyAccepted, setNewlyAccepted] = useState<
    Record<string, { key: string; title: string; version: string; acceptedAt: string }>
  >({});
  const [newDocs, setNewDocs] = useState<Record<string, string>>({});
  const [newDocNames, setNewDocNames] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadProfile = () =>
    apiClient
      .get("/auth/seller/profile")
      .then((res) => setProfile(res.data?.data))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!token) return;
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const pickDoc = async (key: string, file?: File | null) => {
    if (!file) return;
    setFeedback(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      setNewDocs((prev) => ({ ...prev, [key]: dataUrl }));
      setNewDocNames((prev) => ({ ...prev, [key]: file.name }));
    } catch (err) {
      setFeedback({ ok: false, msg: err instanceof Error ? err.message : "Dosya yüklenemedi." });
    }
  };

  const submitOnboarding = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await apiClient.post("/auth/seller/onboarding", {
        acceptedContracts: Object.values(newlyAccepted),
        documents: newDocs,
      });
      setFeedback({ ok: true, msg: res.data?.message || "Kaydedildi." });
      setNewlyAccepted({});
      setNewDocs({});
      setNewDocNames({});
      await loadProfile();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setFeedback({ ok: false, msg: e.response?.data?.message || "Gönderilemedi." });
    } finally {
      setSubmitting(false);
    }
  };

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

  const status = p.onboardingStatus || "APPROVED";
  const statusCard = STATUS_CARD[status] || STATUS_CARD.APPROVED;
  const sellerType = isTuzel ? "TUZEL" : "BIREYSEL";
  const allContracts = contractsFor(sellerType);
  const allDocs = documentsFor(sellerType);
  const acceptedKeys = new Set([
    ...(p.acceptedContracts || []).map((c) => c.key),
    ...Object.keys(newlyAccepted),
  ]);
  const uploadedKeys = new Set([...(p.uploadedDocuments || []), ...Object.keys(newDocs)]);
  const pendingChanges = Object.keys(newlyAccepted).length + Object.keys(newDocs).length;
  const allComplete =
    allContracts.every((c) => acceptedKeys.has(c.key)) &&
    allDocs.filter((d) => d.required).every((d) => uploadedKeys.has(d.key));

  return (
    <div className="space-y-6">
      {/* Onay durumu + eksikleri tamamlama */}
      <div className={`no-print rounded-2xl border p-5 ${statusCard.cls}`}>
        <div className="flex items-start gap-3">
          <statusCard.Icon className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black">{statusCard.label}</p>
            <p className="text-xs font-semibold opacity-90 mt-0.5">{statusCard.detail}</p>
            {p.onboardingNote && (
              <p className="mt-2 text-xs font-bold bg-white/70 rounded-lg px-3 py-2">
                Onay ekibi notu: {p.onboardingNote}
              </p>
            )}
          </div>
        </div>
      </div>

      {status !== "APPROVED" && (
        <div className="no-print grid gap-5 lg:grid-cols-2">
          {/* Sözleşmeler */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-black text-slate-800 mb-3">Sözleşmeler</h3>
            <div className="space-y-2">
              {allContracts.map((c) => {
                const ok = acceptedKeys.has(c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => setOpenContract(c)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                      ok ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 hover:border-[#ff6000]"
                    }`}
                  >
                    <span className={`text-base shrink-0 ${ok ? "text-emerald-600" : "text-slate-300"}`}>
                      {ok ? "✔" : "○"}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-black text-slate-800 truncate">{c.title}</span>
                      <span className="block text-[10px] font-semibold text-slate-400">
                        {ok ? `Onaylandı · sürüm ${c.version}` : "Okumak ve onaylamak için tıklayın"}
                      </span>
                    </span>
                    {!ok && <span className="text-[10px] font-black text-[#ff6000] shrink-0">OKU →</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Belgeler */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-black text-slate-800 mb-3">
              {isTuzel ? "Şirket Evrakları" : "Kimlik Doğrulama"}
            </h3>
            <div className="space-y-2">
              {allDocs.map((d) => {
                const ok = uploadedKeys.has(d.key);
                return (
                  <div
                    key={d.key}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${
                      ok ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200"
                    }`}
                  >
                    <span className={`text-base shrink-0 ${ok ? "text-emerald-600" : "text-slate-300"}`}>
                      {ok ? "✔" : "○"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800">
                        {d.label}
                        {d.required && <span className="text-red-500"> *</span>}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 truncate">
                        {newDocNames[d.key] || (ok ? "Yüklendi" : d.hint)}
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-1 text-[10px] font-black text-[#ff6000] hover:underline cursor-pointer shrink-0">
                      <Upload className="w-3 h-3" />
                      {ok ? "DEĞİŞTİR" : "YÜKLE"}
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => pickDoc(d.key, e.target.files?.[0])}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
            <button
              onClick={submitOnboarding}
              disabled={submitting || pendingChanges === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#ff6000] px-6 py-3 text-xs font-black text-white hover:bg-[#e05500] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {submitting
                ? "Gönderiliyor..."
                : allComplete
                  ? "Kaydet ve Onaya Gönder"
                  : `Kaydet (${pendingChanges} değişiklik)`}
            </button>
            {!allComplete && (
              <span className="text-xs font-bold text-slate-500">
                Tüm sözleşmeler onaylanıp zorunlu belgeler yüklendiğinde başvurunuz onaya gider.
              </span>
            )}
            {feedback && (
              <span className={`text-xs font-black ${feedback.ok ? "text-emerald-600" : "text-red-600"}`}>
                {feedback.msg}
              </span>
            )}
          </div>
        </div>
      )}

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

      {openContract && (
        <ContractReaderModal
          contract={openContract}
          alreadyAccepted={acceptedKeys.has(openContract.key)}
          onClose={() => setOpenContract(null)}
          onAccept={(c) => {
            setNewlyAccepted((prev) => ({
              ...prev,
              [c.key]: { key: c.key, title: c.title, version: c.version, acceptedAt: new Date().toISOString() },
            }));
            setOpenContract(null);
          }}
        />
      )}
    </div>
  );
}
