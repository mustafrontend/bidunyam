import React from "react";
import { notFound } from "next/navigation";

const LEGAL_PAGES: Record<string, { title: string; content: React.ReactNode }> = {
  "mesafeli-satis-sozlesmesi": {
    title: "Mesafeli Satış Sözleşmesi",
    content: (
      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">MADDE 1 – TARAFLAR</h2>
          <p><strong>SATICI:</strong> ART RUE</p>
          <p>Adres: Yeşilköy Mah. Atatürk Cad. Egs Business Park B2 Blok Bakırköy, İstanbul / Türkiye</p>
          <p>Vergi Dairesi: BAKIRKÖY | Vergi No: 4910110358</p>
          <p className="mt-2"><strong>ALICI:</strong> Sipariş veren müşteri</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">MADDE 2 – KONU</h2>
          <p>İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait internet sitesinden elektronik ortamda siparişini yaptığı aşağıda nitelikleri ve satış fiyatı belirtilen ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmelere Dair Yönetmelik hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">MADDE 3 – SÖZLEŞME KONUSU ÜRÜN, ÖDEME VE TESLİMAT</h2>
          <p>Sipariş edilen ürünlerin türü ve cinsi, miktarı, marka/modeli, rengi, satış bedeli sitede belirtildiği gibidir. Ödeme Iyzico altyapısı ile kredi kartı üzerinden güvenli bir şekilde tahsil edilmektedir.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">MADDE 4 – CAYMA HAKKI</h2>
          <p>ALICI, sözleşme konusu ürünün kendisine tesliminden itibaren 14 (on dört) gün içinde hiçbir hukuki ve cezai sorumluluk üstlenmeksizin cayma hakkına sahiptir. İade için ürünün kutusu, ambalajı ve aksesuarları ile birlikte eksiksiz ve hasarsız olması gerekmektedir.</p>
        </section>
      </div>
    ),
  },
  "iptal-iade-kosullari": {
    title: "İptal ve İade Şartları",
    content: (
      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">CAYMA HAKKI</h2>
          <p>ALICI, sözleşme konusu ürünün kendisine veya gösterdiği adresteki kişi/kuruluşa tesliminden itibaren <strong>14 (on dört) gün</strong> içinde hiçbir hukuki ve cezai sorumluluk üstlenmeksizin ve hiçbir gerekçe göstermeksizin malı reddederek sözleşmeden cayma hakkına sahiptir.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">İADE KOŞULLARI</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>İade edilecek ürünlerin kutusu, ambalajı, varsa standart aksesuarları ile birlikte eksiksiz ve hasarsız olarak teslim edilmesi gerekmektedir.</li>
            <li>Kullanılmış, yıpranmış veya tahrip edilmiş ürünler iade kapsamı dışındadır.</li>
            <li>Gıda, kozmetik ve iç giyim ürünleri, hijyen koşulları gereği iade kapsamı dışındadır.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">PARA İADESİ</h2>
          <p>ART RUE (Vergi No: 4910110358, BAKIRKÖY VD.) iade talebi onaylandığında ilgili tutarı ALICI'nın ödeme yöntemine Iyzico güvencesiyle en geç <strong>10 iş günü</strong> içinde iade eder.</p>
        </section>
      </div>
    ),
  },
  "gizlilik-politikasi": {
    title: "Gizlilik Politikası ve KVKK",
    content: (
      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">GİZLİLİK VE GÜVENLİK</h2>
          <p>ART RUE (Vergi No: 4910110358), müşterilerine daha iyi hizmet verebilmek amacıyla bazı kişisel bilgilerinizi (isim, yaş, ilgi alanları, e-posta vb.) sizlerden talep etmektedir. Toplanan bu bilgiler yalnızca ART RUE bünyesinde kullanılmaktadır ve üçüncü taraflarla paylaşılmamaktadır.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">ÖDEME GÜVENLİĞİ</h2>
          <p>Ödeme sayfasında istenen kredi kartı bilgileriniz, siteden alışveriş yapan siz değerli müşterilerimizin güvenliğini en üst seviyede tutmak amacıyla hiçbir şekilde ART RUE veya ona hizmet veren şirketlerin sunucularında tutulmamaktadır. Tüm ödeme işlemleri <strong>Iyzico</strong> altyapısı üzerinden gerçekleşmektedir.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">ÇEREZLER (COOKIES)</h2>
          <p>Sitemiz, kullanıcı deneyimini geliştirmek amacıyla çerezler kullanmaktadır. Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz; ancak bu durumda sitenin bazı özellikleri çalışmayabilir.</p>
        </section>
      </div>
    ),
  },
  "kullanim-kosullari": {
    title: "Kullanım Koşulları",
    content: (
      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">GENEL KULLANIM ŞARTLARI</h2>
          <p>Bu internet sitesine girmeniz veya bu internet sitesindeki herhangi bir bilgiyi kullanmanız aşağıdaki koşulları kabul ettiğiniz anlamına gelir.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">SORUMLULUK REDDİ</h2>
          <p>Bu internet sitesine girilmesi, sitenin ya da sitedeki bilgilerin ve diğer verilerin, programların kullanılması sebebiyle, sözleşmenin ihlali, haksız fiil, ya da başkaca sebeplere binaen, doğabilecek doğrudan ya da dolaylı hiçbir zarardan ART RUE sorumlu değildir.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">DEĞİŞİKLİK HAKKI</h2>
          <p>ART RUE (Vergi No: 4910110358), dilediği zaman site üzerindeki bilgileri, tasarımı veya kullanım koşullarını önceden haber vermeksizin değiştirme hakkını saklı tutar. Kullanıcılar bu değişiklikleri takip etmekle yükümlüdür.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">FİKRİ MÜLKİYET</h2>
          <p>Bu sitedeki tüm içerikler (metin, görsel, logo, tasarım) ART RUE'ya aittir ve telif hakkıyla korunmaktadır. İzinsiz kopyalanması ve dağıtılması yasaktır.</p>
        </section>
      </div>
    ),
  },
  "teslimat-sartlari": {
    title: "Kargo ve Teslimat Süreçleri",
    content: (
      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">TESLİMAT SÜRELERİ</h2>
          <p>Satın alınan ürünler, sipariş onayından itibaren en geç <strong>3 iş günü</strong> içerisinde kargo firmasına teslim edilmektedir. Teslimat süresi, bulunduğunuz konuma göre 1 ila 5 iş günü arasında değişiklik gösterebilir.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">TESLİMAT BÖLGESİ</h2>
          <p>Ürünlerinizin teslimatı Türkiye'nin tüm illerine kargo şirketleri aracılığıyla yapılmaktadır. Uluslararası gönderim şu an için mevcut değildir.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">KARGO ÜCRETİ</h2>
          <p>Belirli tutar üzerindeki siparişlerde kargo ücretsizdir. Kargo ücreti, sipariş özetinde gösterilmektedir.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">HASARLI TESLİMAT</h2>
          <p>Kargo ile gelen ürününüzde hasar tespit etmeniz halinde, ürünü teslim almadan önce kargo görevlisine tutanak tutturmanızı öneririz. Hasar durumunda müşteri hizmetlerimize başvurabilirsiniz.</p>
        </section>
      </div>
    ),
  },
  "kvkk": {
    title: "KVKK Aydınlatma Metni",
    content: (
      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">VERİ SORUMLUSU</h2>
          <p>6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz; veri sorumlusu sıfatıyla <strong>ART RUE</strong> (Vergi No: 4910110358) tarafından aşağıda açıklanan kapsamda işlenebilecektir.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">İŞLENEN KİŞİSEL VERİLER</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Kimlik bilgileri (ad, soyad)</li>
            <li>İletişim bilgileri (e-posta, telefon, adres)</li>
            <li>Ödeme bilgileri (kart numarası Iyzico tarafından işlenir, bizde tutulmaz)</li>
            <li>Kullanım verileri (site içi davranışlar, tercihler)</li>
          </ul>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">HAKLARINIZ</h2>
          <p>KVKK'nın 11. maddesi kapsamında; verilerinize erişim, düzeltme, silme, işlemeye itiraz ve taşınabilirlik haklarına sahipsiniz. Talepleriniz için <strong>info@bidunyam.com</strong> adresine başvurabilirsiniz.</p>
        </section>
      </div>
    ),
  },
  "cerez-politikasi": {
    title: "Çerez (Cookie) Politikası",
    content: (
      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">ÇEREZLER NEDİR?</h2>
          <p>Çerezler, ziyaret ettiğiniz web sitelerinin bilgisayarınıza veya mobil cihazınıza yerleştirdiği küçük metin dosyalarıdır. Çerezler sayesinde sitemiz sizi tanır ve tercihlerinizi hatırlar.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">KULLANDIĞIMIZ ÇEREZ TÜRLERİ</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Zorunlu Çerezler:</strong> Sitenin temel işlevleri için gereklidir (oturum, sepet vb.).</li>
            <li><strong>Analitik Çerezler:</strong> Sitenin nasıl kullanıldığını anlamamıza yardımcı olur.</li>
            <li><strong>Pazarlama Çerezleri:</strong> Size özel reklamlar sunmak için kullanılır.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">ÇEREZLERI NASIL KONTROLEDEBİLİRSİNİZ?</h2>
          <p>Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilir veya silebilirsiniz. Ancak bu durumda bazı site özellikleri düzgün çalışmayabilir.</p>
        </section>
      </div>
    ),
  },
  "on-bilgilendirme-formu": {
    title: "Ön Bilgilendirme Formu",
    content: (
      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">SATICI BİLGİLERİ</h2>
          <p><strong>Unvan:</strong> ART RUE</p>
          <p><strong>Adres:</strong> Yeşilköy Mah. Atatürk Cad. Egs Business Park B2 Blok Bakırköy, İstanbul / Türkiye</p>
          <p><strong>Vergi Dairesi:</strong> BAKIRKÖY | <strong>Vergi No:</strong> 4910110358</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">ÜRÜN BİLGİLERİ</h2>
          <p>Sipariş edilen ürünlerin temel nitelikleri, satış fiyatı ve ödeme bilgileri sipariş özet sayfasında ve onay e-postasında yer almaktadır.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">TESLİMAT VE CAYMA HAKKI</h2>
          <p>Ürünler, ödeme onayından itibaren en geç 3 iş günü içinde kargoya verilir. Teslimden itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz.</p>
        </section>
      </div>
    ),
  },
  "hakkimizda": {
    title: "Hakkımızda",
    content: (
      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">BİDÜNYAM HAKKINDA</h2>
          <p>BiDünyam, ART RUE çatısı altında faaliyet gösteren, Türkiye'nin yükselen e-ticaret platformlarından biridir. Milyonlarca ürün, güvenli ödeme altyapısı ve hızlı kargo seçenekleriyle müşterilerimize en iyi alışveriş deneyimini sunmayı hedefliyoruz.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">MİSYONUMUZ</h2>
          <p>Alıcı ve satıcıları en güvenilir şekilde bir araya getirerek Türkiye'nin dijital ticaret ekosistemini güçlendirmek.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">VİZYONUMUZ</h2>
          <p>Türkiye'nin en çok tercih edilen, teknoloji odaklı ve müşteri memnuniyetini her şeyin önünde tutan e-ticaret platformu olmak.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">KURUMSAL BİLGİLER</h2>
          <p><strong>Unvan:</strong> ART RUE</p>
          <p><strong>Vergi Dairesi:</strong> BAKIRKÖY | <strong>Vergi No:</strong> 4910110358</p>
          <p><strong>Adres:</strong> Yeşilköy Mah. Atatürk Cad. Egs Business Park B2 Blok Bakırköy, İstanbul / Türkiye</p>
        </section>
      </div>
    ),
  },
  "kariyer": {
    title: "Bizimle Çalışın (Kariyer)",
    content: (
      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">ART RUE'DA KARİYER</h2>
          <p>BiDünyam bünyesinde yetenekli ve tutkulu bireylerle büyümeye devam ediyoruz. Dinamik, yenilikçi ve insan odaklı çalışma ortamımıza katılmak ister misiniz?</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">AÇIK POZİSYONLAR</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Yazılım Geliştirici (Frontend / Backend)</li>
            <li>Ürün Yöneticisi</li>
            <li>Müşteri Hizmetleri Uzmanı</li>
            <li>Dijital Pazarlama Uzmanı</li>
            <li>Lojistik ve Operasyon Koordinatörü</li>
          </ul>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">BAŞVURU</h2>
          <p>CV'nizi <strong>kariyer@bidunyam.com</strong> adresine gönderebilir ya da LinkedIn profilimizi takip edebilirsiniz.</p>
        </section>
      </div>
    ),
  },
  "iletisim": {
    title: "İletişim & Destek",
    content: (
      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">BİZE ULAŞIN</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="font-semibold text-slate-700 mb-1">📧 E-posta</p>
              <p>destek@bidunyam.com</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="font-semibold text-slate-700 mb-1">📞 Telefon</p>
              <p>+90 (212) 000 00 00</p>
              <p className="text-[11px] text-slate-400 mt-1">Hft. içi 09:00 – 18:00</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="font-semibold text-slate-700 mb-1">📍 Adres</p>
              <p>Yeşilköy Mah. Atatürk Cad.<br />Egs Business Park B2 Blok<br />Bakırköy, İstanbul / Türkiye</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="font-semibold text-slate-700 mb-1">⏰ Destek Saatleri</p>
              <p>Pazartesi – Cuma: 09:00 – 18:00</p>
              <p>Cumartesi: 10:00 – 15:00</p>
            </div>
          </div>
        </section>
      </div>
    ),
  },
  "sikca-sorulan-sorular": {
    title: "Sıkça Sorulan Sorular",
    content: (
      <div className="space-y-5 text-sm text-slate-600 leading-relaxed">
        {[
          { q: "Siparişimi nasıl takip edebilirim?", a: "Hesabım > Siparişlerim bölümünden siparişinizin anlık durumunu takip edebilirsiniz." },
          { q: "İade süreci ne kadar sürer?", a: "İade talebiniz onaylandıktan sonra 10 iş günü içinde ödemeniz iade edilir." },
          { q: "Hangi ödeme yöntemlerini kabul ediyorsunuz?", a: "Kredi kartı, banka kartı ve taksitli ödeme seçeneklerini kabul ediyoruz." },
          { q: "Kargo ücretsiz mi?", a: "Belirli tutar üzeri siparişlerde kargo ücretsizdir. Sipariş özetinizde bilgiyi görebilirsiniz." },
          { q: "Ürünlerin garantisi var mı?", a: "Orijinal ürünlerin resmi Türkiye garantisi mevcuttur. Detaylar ürün sayfasında belirtilmektedir." },
          { q: "Siparişimi iptal edebilir miyim?", a: "Sipariş kargoya verilmeden önce iptal talebinde bulunabilirsiniz. Hesabım > Siparişlerim bölümünden talep oluşturabilirsiniz." },
        ].map(({ q, a }) => (
          <div key={q} className="border border-slate-100 rounded-xl p-4">
            <p className="font-semibold text-slate-800 mb-1.5">❓ {q}</p>
            <p>{a}</p>
          </div>
        ))}
      </div>
    ),
  },
  "guvenlik-merkezi": {
    title: "Güvenlik Merkezi",
    content: (
      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">🔒 256-BIT SSL ŞİFRELEME</h2>
          <p>Tüm iletişimleriniz 256-bit SSL şifreleme ile korunmaktadır. Tarayıcı adres çubuğundaki kilit simgesi bağlantının güvenli olduğunu gösterir.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">💳 GÜVENLİ ÖDEME</h2>
          <p>Kredi kartı bilgileriniz bizim sunucularımızda saklanmaz. Tüm ödeme işlemleri PCI-DSS uyumlu <strong>Iyzico</strong> altyapısı üzerinden güvenle gerçekleşir.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">🛡️ KİŞİSEL VERİ KORUMASI</h2>
          <p>Kişisel verileriniz KVKK (6698 sayılı Kanun) kapsamında korunmaktadır. Verileriniz üçüncü taraflarla paylaşılmaz.</p>
        </section>
        <section>
          <h2 className="font-bold text-slate-800 text-base mb-2">⚠️ DİKKAT EDİN</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Şüpheli e-posta veya SMS ile gelen linklere tıklamayın.</li>
            <li>Şifrenizi kimseyle paylaşmayın.</li>
            <li>Şüpheli bir durum fark ederseniz hemen destek@bidunyam.com adresine bildirin.</li>
          </ul>
        </section>
      </div>
    ),
  },
  "site-haritasi": {
    title: "Site Haritası",
    content: (
      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-bold text-slate-800 text-base mb-3">🛍️ Alışveriş</h2>
            <ul className="space-y-1.5">
              <li><a href="/" className="hover:text-[#ff5000] transition-colors">Ana Sayfa</a></li>
              <li><a href="/arama?kategori=Elektronik" className="hover:text-[#ff5000] transition-colors">Elektronik</a></li>
              <li><a href="/arama?kategori=Giyim" className="hover:text-[#ff5000] transition-colors">Giyim</a></li>
              <li><a href="/arama?kategori=Ev & Yaşam" className="hover:text-[#ff5000] transition-colors">Ev & Yaşam</a></li>
              <li><a href="/arama?kategori=Kozmetik" className="hover:text-[#ff5000] transition-colors">Kozmetik</a></li>
              <li><a href="/arama?kategori=Spor & Outdoor" className="hover:text-[#ff5000] transition-colors">Spor & Outdoor</a></li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base mb-3">👤 Hesap</h2>
            <ul className="space-y-1.5">
              <li><a href="/cart" className="hover:text-[#ff5000] transition-colors">Sepetim</a></li>
              <li><a href="/favorites" className="hover:text-[#ff5000] transition-colors">Favorilerim</a></li>
              <li><a href="/account/orders" className="hover:text-[#ff5000] transition-colors">Siparişlerim</a></li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base mb-3">📋 Yasal</h2>
            <ul className="space-y-1.5">
              <li><a href="/sozlesmeler/gizlilik-politikasi" className="hover:text-[#ff5000] transition-colors">Gizlilik Politikası</a></li>
              <li><a href="/sozlesmeler/kullanim-kosullari" className="hover:text-[#ff5000] transition-colors">Kullanım Koşulları</a></li>
              <li><a href="/sozlesmeler/mesafeli-satis-sozlesmesi" className="hover:text-[#ff5000] transition-colors">Mesafeli Satış Sözleşmesi</a></li>
              <li><a href="/sozlesmeler/iptal-iade-kosullari" className="hover:text-[#ff5000] transition-colors">İptal & İade Şartları</a></li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
};

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = LEGAL_PAGES[slug];

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
