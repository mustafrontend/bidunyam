import React from "react";
import { notFound } from "next/navigation";

const LEGAL_PAGES: Record<string, { title: string; content: React.ReactNode }> = {
  "mesafeli-satis-sozlesmesi": {
    title: "Mesafeli Satış Sözleşmesi",
    content: (
      <div className="space-y-4 text-sm text-slate-600">
        <p><strong>MADDE 1 - TARAFLAR</strong></p>
        <p>SATICI: ART RUE</p>
        <p>Adres: Yeşilköy Mah. Atatürk Cad. Egs Business Park B2 Blok Bakırköy, İstanbul / Türkiye</p>
        <p>Vergi Dairesi: BAKIRKÖY</p>
        <p>Vergi No: 4910110358</p>
        <p>ALICI: Müşteri</p>
        <p><strong>MADDE 2 - KONU</strong></p>
        <p>İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait internet sitesinden elektronik ortamda siparişini yaptığı aşağıda nitelikleri ve satış fiyatı belirtilen ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmelere Dair Yönetmelik hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.</p>
        <p><strong>MADDE 3 - SÖZLEŞME KONUSU ÜRÜN, ÖDEME VE TESLİMAT</strong></p>
        <p>Sipariş edilen ürünlerin türü ve cinsi, miktarı, marka/modeli, rengi, satış bedeli sitede belirtildiği gibidir. Ödeme Iyzico altyapısı ile kredi kartı üzerinden güvenli bir şekilde tahsil edilmektedir.</p>
      </div>
    ),
  },
  "iptal-iade-kosullari": {
    title: "İptal ve İade Şartları",
    content: (
      <div className="space-y-4 text-sm text-slate-600">
        <p><strong>CAYMA HAKKI</strong></p>
        <p>ALICI, sözleşme konusu ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa tesliminden itibaren 14 (on dört) gün içinde hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin malı reddederek sözleşmeden cayma hakkına sahiptir.</p>
        <p>İade edilecek ürünlerin kutusu, ambalajı, varsa standart aksesuarları ile birlikte eksiksiz ve hasarsız olarak teslim edilmesi gerekmektedir.</p>
        <p>ART RUE (Vergi No: 4910110358, BAKIRKÖY VD.) iade talebi onaylandığında ilgili tutarı ALICI'nın kredi kartına Iyzico güvencesiyle 10 gün içinde iade eder.</p>
      </div>
    ),
  },
  "gizlilik-politikasi": {
    title: "Gizlilik Politikası ve KVKK",
    content: (
      <div className="space-y-4 text-sm text-slate-600">
        <p><strong>GİZLİLİK VE GÜVENLİK</strong></p>
        <p>ART RUE (Vergi No: 4910110358), müşterilerine daha iyi hizmet verebilmek amacıyla bazı kişisel bilgilerinizi (isim, yaş, ilgi alanları, e-posta vb.) sizlerden talep etmektedir.</p>
        <p>Toplanan bu bilgiler, dönemsel kampanya çalışmaları, müşteri profillerine yönelik özel promosyon faaliyetlerinin kurgulanması ve istenmeyen e-postaların iletilmemesine yönelik müşteri "sınıflandırma" çalışmalarında sadece ART RUE bünyesinde kullanılmaktadır.</p>
        <p>Ödeme sayfasında istenen kredi kartı bilgileriniz, siteden alışveriş yapan siz değerli müşterilerimizin güvenliğini en üst seviyede tutmak amacıyla hiçbir şekilde ART RUE veya ona hizmet veren şirketlerin sunucularında tutulmamaktadır. Tüm ödeme işlemleri Iyzico altyapısı üzerinden gerçekleşmektedir.</p>
      </div>
    ),
  },
  "teslimat-sartlari": {
    title: "Kargo ve Teslimat Süreçleri",
    content: (
      <div className="space-y-4 text-sm text-slate-600">
        <p><strong>TESLİMAT ŞARTLARI</strong></p>
        <p>Satın alınan ürünler, sipariş onayından itibaren en geç 3 iş günü içerisinde kargo firmasına teslim edilmektedir.</p>
        <p>Ürünlerinizin teslimatı Türkiye'nin her yerine kargo şirketleri aracılığıyla yapılmaktadır. Teslimat süresi, bulunduğunuz konuma göre 1 ila 5 iş günü arasında değişiklik gösterebilir.</p>
        <p>Teslimat adresi: Yeşilköy Mah. Atatürk Cad. Egs Business Park B2 Blok Bakırköy, İstanbul / Türkiye adresinden gönderim sağlanmaktadır.</p>
      </div>
    ),
  },
  "kullanim-kosullari": {
    title: "Kullanım Koşulları",
    content: (
      <div className="space-y-4 text-sm text-slate-600">
        <p><strong>GENEL KULLANIM ŞARTLARI</strong></p>
        <p>Bu internet sitesine girmeniz veya bu internet sitesindeki herhangi bir bilgiyi kullanmanız aşağıdaki koşulları kabul ettiğiniz anlamına gelir.</p>
        <p>Bu internet sitesine girilmesi, sitenin ya da sitedeki bilgilerin ve diğer verilerin programların vs. kullanılması sebebiyle, sözleşmenin ihlali, haksız fiil, ya da başkaca sebeplere binaen, doğabilecek doğrudan ya da dolaylı hiçbir zarardan ART RUE sorumlu değildir.</p>
        <p>ART RUE (Vergi No: 4910110358), dilediği zaman site üzerindeki bilgileri, tasarımı veya kullanım koşullarını önceden haber vermeksizin değiştirme hakkını saklı tutar.</p>
      </div>
    ),
  },
};

export default function LegalPage({ params }: { params: { slug: string } }) {
  const page = LEGAL_PAGES[params.slug];

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4">
            {page.title}
          </h1>
          <div className="prose prose-slate max-w-none">
            {page.content}
          </div>
        </div>
      </div>
    </div>
  );
}
