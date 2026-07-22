"use client";

import { useEffect, useRef, useState } from "react";
import { X, Printer, CheckCircle2, ArrowDown } from "lucide-react";
import type { SellerContract } from "@/lib/sellerContracts";

interface Props {
  contract: SellerContract;
  /** Daha önce onaylandıysa modal salt okunur açılır */
  alreadyAccepted?: boolean;
  onAccept: (contract: SellerContract) => void;
  onClose: () => void;
}

/**
 * Sözleşmeyi okutan modal. Onay kutusu, metin sonuna kadar kaydırılmadan
 * aktifleşmez — böylece "okudum" beyanı gerçekten okumaya dayanır.
 */
export function ContractReaderModal({ contract, alreadyAccepted = false, onAccept, onClose }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [reachedEnd, setReachedEnd] = useState(alreadyAccepted);
  const [checked, setChecked] = useState(false);

  // Metin ekrana sığıyorsa kaydırma olmayacağı için sonu görülmüş sayılır
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 8) setReachedEnd(true);
  }, [contract.key]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setReachedEnd(true);
  };

  const scrollToEnd = () => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const print = () => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    const body = contract.sections
      .map(
        (s) =>
          `<h2>${s.heading}</h2>${s.paragraphs.map((p) => `<p>${p}</p>`).join("")}`
      )
      .join("");
    w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8">
      <title>${contract.title}</title>
      <style>
        body{font-family:ui-sans-serif,system-ui,Segoe UI,Arial;max-width:760px;margin:40px auto;color:#0f172a;line-height:1.7}
        h1{font-size:20px;border-bottom:2px solid #0f172a;padding-bottom:10px}
        h2{font-size:14px;margin-top:26px;color:#1e293b}
        p{font-size:12.5px;text-align:justify;margin:8px 0}
        .meta{font-size:11px;color:#64748b;margin-bottom:24px}
      </style></head><body>
      <h1>${contract.title}</h1>
      <div class="meta">Sürüm ${contract.version} · biDünyam Elektronik Ticaret A.Ş. · Yazdırma: ${new Date().toLocaleString("tr-TR")}</div>
      ${body}
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">{contract.title}</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Sürüm {contract.version} · {contract.summary}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={print}
              title="Yazdır / PDF olarak kaydet"
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-7 py-6 bg-slate-50/60">
          <article className="space-y-6">
            {contract.sections.map((s) => (
              <section key={s.heading}>
                <h3 className="text-sm font-black text-slate-900 mb-2">{s.heading}</h3>
                <div className="space-y-2">
                  {s.paragraphs.map((p, i) => (
                    <p key={i} className="text-[13px] leading-relaxed text-slate-700 text-justify">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
            <p className="text-[11px] font-semibold text-slate-400 pt-4 border-t border-slate-200">
              — Sözleşme metninin sonu —
            </p>
          </article>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-white space-y-3">
          {!reachedEnd && (
            <button
              onClick={scrollToEnd}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black hover:bg-amber-100 transition-colors"
            >
              <ArrowDown className="w-4 h-4" />
              Onaylayabilmek için sözleşmeyi sonuna kadar okuyun
            </button>
          )}

          {alreadyAccepted ? (
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-xs font-black text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> Bu sözleşmeyi daha önce onayladınız
              </span>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800"
              >
                Kapat
              </button>
            </div>
          ) : (
            <>
              <label
                className={`flex items-start gap-3 p-3 rounded-2xl border transition-colors ${
                  reachedEnd ? "border-slate-200 bg-white cursor-pointer" : "border-slate-100 bg-slate-50 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!reachedEnd}
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#ff6000] shrink-0"
                />
                <span className="text-xs font-semibold text-slate-700 leading-relaxed">
                  <strong className="font-black">{contract.title}</strong> metnini eksiksiz okudum, anladım ve
                  elektronik ortamda onaylıyorum. Onayımın ıslak imza ile aynı hukuki sonucu doğurduğunu kabul
                  ediyorum.
                </span>
              </label>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  disabled={!checked}
                  onClick={() => onAccept(contract)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#ff6000] text-white text-xs font-black hover:bg-[#e05600] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" /> Okudum, Onaylıyorum
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
