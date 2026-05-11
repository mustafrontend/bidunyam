import Link from "next/link";

const launchSteps = [
  "Arayuz tasarimi tamamlanacak",
  "Katalog ve urun deneyimi optimize edilecek",
  "Canli odeme ve siparis akis testleri bitecek",
];

export default function Home() {
  return (
    <section className="relative isolate min-h-[calc(100vh-80px)] overflow-hidden bg-[#0f1428] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#f06543]/35 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#3F4095]/40 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-6xl items-center px-4 py-16 md:px-8 md:py-20">
        <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
          <div className="space-y-8">
            <p className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">
              bidunyam.com
            </p>

            <div className="space-y-5">
              <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                YENI DENEYIM
                <br />
                <span className="text-[#ffd4c8]">YAPIM ASAMASINDA</span>
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-slate-200 md:text-base">
                biDunyam icin daha hizli, daha net ve daha akici bir ana sayfa hazirliyoruz.
                Cok yakinda yeni yuzumuzle yayinda olacagiz.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/cart"
                className="rounded-xl bg-[#f06543] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#d85536]"
              >
                Sepete Git
              </Link>
              <a
                href="mailto:info@bidunyam.com"
                className="rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                Bilgi Al
              </a>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-200">Lansman Adimlari</h2>
            <ul className="mt-6 space-y-4">
              {launchSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm text-slate-100">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-orange-200">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Sunucu Durumu</p>
              <p className="mt-2 text-2xl font-black text-emerald-300">AKTIF</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Altyapi calisiyor. Tasarim bitince ana sayfa yeni haliyle yayina alinacak.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
