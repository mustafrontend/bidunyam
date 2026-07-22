/**
 * Satıcı sözleşmeleri — tek kaynak.
 * Hem kayıt sırasındaki "oku ve onayla" modalı hem de /yonetim/sozlesmelerim
 * (PDF çıktısı) bu metinleri kullanır. Metin değişirse `version` artırılmalı;
 * satıcının onayı hangi sürüme verdiği kayıt altına alınır.
 */

export type SellerType = "BIREYSEL" | "TUZEL";

export interface ContractSection {
  heading: string;
  paragraphs: string[];
}

export interface SellerContract {
  key: string;
  title: string;
  version: string;
  /** Hangi satıcı tipleri için zorunlu */
  forTypes: SellerType[];
  summary: string;
  sections: ContractSection[];
}

const PLATFORM = "biDünyam Elektronik Ticaret A.Ş. (\"biDünyam\")";

const MEMBERSHIP: SellerContract = {
  key: "uyelik",
  title: "Satıcı Üyelik ve Pazaryeri Kullanım Sözleşmesi",
  version: "1.1",
  forTypes: ["BIREYSEL", "TUZEL"],
  summary: "Pazaryerine üyelik, hesabın kullanımı, askıya alma ve fesih koşulları.",
  sections: [
    {
      heading: "Madde 1 — Taraflar ve Konu",
      paragraphs: [
        `İşbu sözleşme, bir tarafta ${PLATFORM} ile diğer tarafta bidunyam.com üzerinde satıcı hesabı açan gerçek veya tüzel kişi ("Satıcı") arasında elektronik ortamda kurulmuştur.`,
        "Sözleşmenin konusu; Satıcı'nın biDünyam pazaryeri altyapısını kullanarak ürün listelemesi, satış yapması ve tarafların bu kapsamdaki hak ve yükümlülüklerinin belirlenmesidir.",
        "Satıcı, kayıt formunu doldurup elektronik onay verdiği anda işbu sözleşmenin tüm hükümlerini okuduğunu, anladığını ve kabul ettiğini beyan eder.",
      ],
    },
    {
      heading: "Madde 2 — Hesap Açılışı ve Doğruluk Beyanı",
      paragraphs: [
        "Satıcı, kayıt sırasında verdiği kimlik, iletişim, vergi ve banka bilgilerinin doğru, güncel ve kendisine ait olduğunu kabul eder.",
        "Tüzel kişi Satıcılar; vergi kimlik numarası, vergi levhası, imza sirküleri ve ticaret sicil kayıtlarını biDünyam'a ibraz etmekle yükümlüdür. Bu belgeler doğrulanana kadar hesap sınırlı yetkiyle çalışır.",
        "Bilgilerde değişiklik olması hâlinde Satıcı, en geç 7 (yedi) gün içinde panelden güncelleme yapar. Yanlış veya eksik bilgiden doğan zarardan Satıcı sorumludur.",
        "Hesap bilgileri kişiye özeldir; Satıcı, giriş bilgilerinin gizliliğinden ve hesabı üzerinden gerçekleştirilen tüm işlemlerden sorumludur.",
      ],
    },
    {
      heading: "Madde 3 — Satıcı'nın Yükümlülükleri",
      paragraphs: [
        "Satıcı; listelediği ürünlerin mevzuata uygun, satışı serbest, orijinal ve ilan edilen niteliklere sahip olduğunu taahhüt eder.",
        "Taklit, kaçak, çalıntı, tehlikeli veya satışı izne tabi ürünlerin listelenmesi kesinlikle yasaktır. Bu tür ilanlar bildirimsiz kaldırılır.",
        "Ürün görselleri, açıklamaları ve fiyat bilgileri gerçeği yansıtmalı; tüketiciyi yanıltıcı ifadeler kullanılmamalıdır.",
        "Satıcı, stok ve fiyat bilgisini güncel tutar. Stokta olmayan ürünün satışa açık bırakılması sonucu iptal edilen siparişler performans puanını düşürür.",
        "Satıcı, sipariş edilen ürünü kabul edilen hazırlık süresi içinde kargoya vermekle yükümlüdür.",
      ],
    },
    {
      heading: "Madde 4 — biDünyam'ın Konumu",
      paragraphs: [
        "biDünyam, 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun kapsamında aracı hizmet sağlayıcıdır; satışa konu ürünün sahibi, satıcısı veya üreticisi değildir.",
        "biDünyam, ilan içeriklerini genel olarak denetlemekle yükümlü olmamakla birlikte, hukuka aykırılık tespit ettiği içerikleri kaldırma hakkını saklı tutar.",
        "biDünyam, platformun kesintisiz çalışması için makul çabayı gösterir; bakım, güncelleme veya mücbir sebep kaynaklı kesintilerden sorumlu tutulamaz.",
      ],
    },
    {
      heading: "Madde 5 — Hesabın Askıya Alınması ve Fesih",
      paragraphs: [
        "Satıcı'nın işbu sözleşmeye, mevzuata veya platform kurallarına aykırı davranması hâlinde biDünyam hesabı geçici olarak askıya alabilir veya kalıcı olarak kapatabilir.",
        "Askıya alma hâlinde açık siparişlerin tamamlanması ve tüketici haklarının korunması Satıcı'nın sorumluluğundadır.",
        "Taraflar, 30 (otuz) gün önceden yazılı bildirimde bulunmak kaydıyla sözleşmeyi tazminatsız feshedebilir. Fesih, hâlihazırda doğmuş yükümlülükleri ortadan kaldırmaz.",
      ],
    },
    {
      heading: "Madde 6 — Uyuşmazlık ve Yürürlük",
      paragraphs: [
        "İşbu sözleşme, Satıcı'nın elektronik onayı ile yürürlüğe girer ve hesabı açık kaldığı sürece geçerlidir.",
        "Sözleşmeden doğan uyuşmazlıklarda İstanbul (Merkez) Mahkemeleri ve İcra Daireleri yetkilidir; Türk hukuku uygulanır.",
        "biDünyam, sözleşme koşullarını güncelleyebilir. Güncel metin panelde yayımlanır ve Satıcı'nın onayına sunulur.",
      ],
    },
  ],
};

const KVKK: SellerContract = {
  key: "kvkk",
  title: "KVKK Aydınlatma Metni ve Açık Rıza Beyanı",
  version: "1.1",
  forTypes: ["BIREYSEL", "TUZEL"],
  summary: "Kişisel verilerin hangi amaçla işlendiği, kimlerle paylaşıldığı ve veri sahibinin hakları.",
  sections: [
    {
      heading: "Madde 1 — Veri Sorumlusu",
      paragraphs: [
        `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca veri sorumlusu ${PLATFORM}'dır.`,
      ],
    },
    {
      heading: "Madde 2 — İşlenen Veriler",
      paragraphs: [
        "Kimlik verileri (ad, soyad, T.C. kimlik numarası, vergi kimlik numarası), iletişim verileri (e-posta, telefon, adres), finansal veriler (IBAN, hakediş ve ödeme kayıtları), işlem güvenliği verileri (IP adresi, cihaz kimliği, oturum kayıtları) ve satış performansına ilişkin veriler işlenmektedir.",
      ],
    },
    {
      heading: "Madde 3 — İşleme Amaçları ve Hukuki Sebep",
      paragraphs: [
        "Veriler; satıcı hesabının oluşturulması, kimlik doğrulama, sözleşmenin ifası, hakediş ödemelerinin yapılması, vergisel ve hukuki yükümlülüklerin yerine getirilmesi, dolandırıcılığın önlenmesi ve platform güvenliğinin sağlanması amaçlarıyla işlenir.",
        "İşleme; sözleşmenin kurulması ve ifası, hukuki yükümlülüğün yerine getirilmesi ve meşru menfaat hukuki sebeplerine dayanır. Bu kapsamda dışına çıkan işlemeler için açık rıza alınır.",
      ],
    },
    {
      heading: "Madde 4 — Aktarım",
      paragraphs: [
        "Veriler; ödeme kuruluşları, kargo ve lojistik firmaları, e-fatura entegratörleri, bağımsız denetim ve hukuk danışmanları ile yetkili kamu kurumlarına, yalnızca amaçla sınırlı olarak aktarılabilir.",
        "Yurt dışına aktarım, yalnızca KVKK m.9'daki koşullar sağlandığında gerçekleştirilir.",
      ],
    },
    {
      heading: "Madde 5 — Saklama Süresi",
      paragraphs: [
        "Veriler, ilgili mevzuatta öngörülen zamanaşımı ve saklama süreleri boyunca (ticari defter ve belgeler için asgari 10 yıl) muhafaza edilir; sürenin dolmasıyla silinir, yok edilir veya anonim hâle getirilir.",
      ],
    },
    {
      heading: "Madde 6 — Veri Sahibinin Hakları",
      paragraphs: [
        "KVKK m.11 uyarınca; verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini isteme, işlemeye itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz.",
        "Talepleriniz için kvkk@bidunyam.com adresine başvurabilirsiniz; başvurular en geç 30 gün içinde sonuçlandırılır.",
      ],
    },
    {
      heading: "Açık Rıza Beyanı",
      paragraphs: [
        "Yukarıdaki aydınlatma metnini okudum. Satıcı hesabımın açılması ve hakediş ödemelerimin gerçekleştirilmesi amacıyla kimlik, iletişim ve finansal verilerimin işlenmesine ve belirtilen taraflara aktarılmasına açık rıza veriyorum.",
      ],
    },
  ],
};

const COMMISSION: SellerContract = {
  key: "komisyon",
  title: "Komisyon, Hakediş ve Ödeme Koşulları (Ek-1)",
  version: "1.1",
  forTypes: ["BIREYSEL", "TUZEL"],
  summary: "Komisyon oranları, hakediş hesabı, ödeme takvimi ve kesintiler.",
  sections: [
    {
      heading: "Madde 1 — Komisyon",
      paragraphs: [
        "biDünyam, gerçekleşen her satış üzerinden kategori bazlı hizmet bedeli (komisyon) tahsil eder. Güncel oranlar satıcı panelindeki Komisyon Tarifesi ekranında yayımlanır.",
        "Komisyon, ürünün KDV dâhil satış bedeli üzerinden hesaplanır ve hakedişten mahsup edilir. Komisyon oranı değişikliği en az 15 gün önce panelden duyurulur.",
      ],
    },
    {
      heading: "Madde 2 — Hakediş Hesabı",
      paragraphs: [
        "Hakediş = Satış bedeli − komisyon − varsa kargo bedeli − iade/iptal tutarları − mevzuat gereği yapılan kesintiler.",
        "Sipariş, tüketicinin cayma hakkı süresi dolduktan ve teslimat tamamlandıktan sonra hakedişe dönüşür.",
      ],
    },
    {
      heading: "Madde 3 — Ödeme Takvimi",
      paragraphs: [
        "Hakedişler, teslimat tarihini takip eden ödeme döneminde Satıcı'nın bildirdiği IBAN'a aktarılır. Bireysel satıcılarda ödeme, T.C. kimlik numarası ile eşleşen IBAN'a yapılır.",
        "Tüzel kişi satıcılarda ödeme, unvanla eşleşen şirket IBAN'ına yapılır ve fatura kesilmesi zorunludur.",
        "IBAN — kimlik/unvan eşleşmemesi hâlinde ödeme, doğrulama tamamlanana kadar bekletilir.",
      ],
    },
    {
      heading: "Madde 4 — Vergisel Yükümlülükler",
      paragraphs: [
        "Tüzel kişi Satıcı, her satış için mevzuata uygun fatura düzenlemekle yükümlüdür.",
        "Bireysel Satıcı, kendi vergisel yükümlülüklerinden bizzat sorumludur; süreklilik arz eden ve ticari boyuta ulaşan satışlarda vergi mükellefiyeti tesis ettirmesi gerekir.",
        "biDünyam, mevzuat gereği yapılması gereken stopaj ve benzeri kesintileri hakedişten mahsup etme hakkını saklı tutar.",
      ],
    },
  ],
};

const DISTANCE_SALES: SellerContract = {
  key: "mesafeli-satis",
  title: "Mesafeli Satış, Kargo ve İade Taahhütnamesi (Ek-2)",
  version: "1.1",
  forTypes: ["BIREYSEL", "TUZEL"],
  summary: "Tüketici mevzuatı kapsamında teslimat, cayma hakkı ve iade süreçleri.",
  sections: [
    {
      heading: "Madde 1 — Tüketici Mevzuatına Uyum",
      paragraphs: [
        "Satıcı, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümlerine uymayı taahhüt eder.",
        "Ön bilgilendirme formu ve mesafeli satış sözleşmesi, sipariş anında tüketiciye platform tarafından sunulur; içeriğin doğruluğu Satıcı'nın beyanına dayanır.",
      ],
    },
    {
      heading: "Madde 2 — Teslimat",
      paragraphs: [
        "Satıcı, siparişi belirlenen hazırlık süresi içinde anlaşmalı kargo firmasına teslim eder. Kargoya verilmeyen siparişler otomatik olarak iptal edilir.",
        "Yanlış, eksik veya hasarlı gönderimden kaynaklanan masraflar Satıcı'ya aittir.",
      ],
    },
    {
      heading: "Madde 3 — Cayma Hakkı ve İade",
      paragraphs: [
        "Tüketici, teslim tarihinden itibaren 14 gün içinde gerekçe göstermeksizin cayma hakkını kullanabilir. Satıcı bu talebi kabul etmekle yükümlüdür.",
        "İade edilen ürünün Satıcı'ya ulaşmasını takiben en geç 14 gün içinde bedel iadesi gerçekleştirilir.",
        "Mevzuatta cayma hakkı istisnası bulunan ürünlerde (kişiye özel üretim, hijyen ürünleri vb.) istisna ilanda açıkça belirtilmelidir.",
      ],
    },
    {
      heading: "Madde 4 — Ayıplı Ürün ve Sorumluluk",
      paragraphs: [
        "Ayıplı ürün nedeniyle tüketiciye yapılan iade, değişim ve tazminat ödemeleri Satıcı'ya rücu edilir.",
        "Satıcı, ürün güvenliği ve garanti belgesi yükümlülüklerinden bizzat sorumludur.",
      ],
    },
  ],
};

const CORPORATE_UNDERTAKING: SellerContract = {
  key: "tuzel-taahhut",
  title: "Tüzel Kişi Satıcı Belge ve Temsil Taahhütnamesi (Ek-3)",
  version: "1.1",
  forTypes: ["TUZEL"],
  summary: "Şirket bilgileri, imza yetkisi ve ibraz edilecek belgelere ilişkin taahhüt.",
  sections: [
    {
      heading: "Madde 1 — Temsil ve İmza Yetkisi",
      paragraphs: [
        "İşbu sözleşmeyi elektronik ortamda onaylayan kişi, şirketi temsil ve ilzama yetkili olduğunu; imza sirkülerinde bu yetkinin yer aldığını beyan ve taahhüt eder.",
        "Yetkisiz temsilden doğacak tüm hukuki ve cezai sorumluluk onay veren gerçek kişiye ve şirkete aittir.",
      ],
    },
    {
      heading: "Madde 2 — İbraz Edilecek Belgeler",
      paragraphs: [
        "Satıcı; vergi levhası, imza sirküleri, ticaret sicil gazetesi ve yetkiliye ait kimlik belgesini eksiksiz ve okunaklı şekilde yüklemekle yükümlüdür.",
        "Belgeler, biDünyam tarafından doğrulanana kadar satıcı hesabı yalnızca sözleşme ekranına erişebilir; ürün listeleme ve satış işlemleri açılmaz.",
        "Sahte, tahrif edilmiş veya başkasına ait belge ibrazı hâlinde hesap kalıcı olarak kapatılır ve durum yetkili mercilere bildirilir.",
      ],
    },
    {
      heading: "Madde 3 — Bilgi Güncelliği",
      paragraphs: [
        "Unvan, vergi dairesi, adres, yetkili kişi veya IBAN değişikliklerinde Satıcı, güncel belgeleri en geç 15 gün içinde yükler.",
        "biDünyam, gerekli gördüğü hâllerde belgelerin yenilenmesini talep edebilir.",
      ],
    },
  ],
};

export const SELLER_CONTRACTS: SellerContract[] = [
  MEMBERSHIP,
  KVKK,
  COMMISSION,
  DISTANCE_SALES,
  CORPORATE_UNDERTAKING,
];

export function contractsFor(type: SellerType): SellerContract[] {
  return SELLER_CONTRACTS.filter((c) => c.forTypes.includes(type));
}

export function getContract(key: string): SellerContract | undefined {
  return SELLER_CONTRACTS.find((c) => c.key === key);
}

/** Tüzel kişilerden istenen evraklar */
export interface RequiredDocument {
  key: string;
  label: string;
  hint: string;
  required: boolean;
}

export const CORPORATE_DOCUMENTS: RequiredDocument[] = [
  {
    key: "vergiLevhasi",
    label: "Vergi Levhası",
    hint: "Güncel yıla ait, vergi numarası okunaklı olmalı.",
    required: true,
  },
  {
    key: "imzaSirkuleri",
    label: "İmza Sirküleri",
    hint: "Şirketi temsile yetkili kişiyi gösteren, geçerlilik süresi dolmamış sirküler.",
    required: true,
  },
  {
    key: "ticaretSicilGazetesi",
    label: "Ticaret Sicil Gazetesi",
    hint: "Kuruluş ve varsa son unvan/adres değişikliği ilanı.",
    required: true,
  },
  {
    key: "yetkiliKimlik",
    label: "Yetkili Kimlik Belgesi",
    hint: "İmza yetkilisinin nüfus cüzdanı / ehliyet / pasaport ön yüzü.",
    required: true,
  },
  {
    key: "faaliyetBelgesi",
    label: "Faaliyet Belgesi",
    hint: "Ticaret/Sanayi Odası'ndan alınan güncel faaliyet belgesi (opsiyonel).",
    required: false,
  },
];

export const INDIVIDUAL_DOCUMENTS: RequiredDocument[] = [
  {
    key: "kimlik",
    label: "Kimlik Belgesi",
    hint: "T.C. kimlik kartı ön yüzü. Ad-soyad ve T.C. no okunaklı olmalı.",
    required: true,
  },
];

export function documentsFor(type: SellerType): RequiredDocument[] {
  return type === "TUZEL" ? CORPORATE_DOCUMENTS : INDIVIDUAL_DOCUMENTS;
}
