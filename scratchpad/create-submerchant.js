// iyzico Alt Üye İşyeri (sub-merchant) oluşturur ve subMerchantKey'i yazdırır.
// Container içinde çalışır (IYZICO_* env + iyzipay orada).
//
// Kullanım:
//   node create-submerchant.js <base.json> [overrides.txt]
//   - base.json  : genel bilgiler (ad, adres, tip) — repo'daki submerchant.local.json
//   - overrides.txt : (opsiyonel) "anahtar: değer" veya "anahtar=değer" satırları; hassas
//                     alanları (iban, tckn, email, gsm) buradan alır. base'i ezer.
// Script girdileri EKRANA YAZMAZ; yalnızca sonucu (subMerchantKey) veya eksik alan ADLARINI yazar.

const fs = require('fs');
const crypto = require('crypto');
const Iyzipay = require('iyzipay');

const jsonPath = process.argv[2];
const txtPath = process.argv[3];

// Türkçe/İngilizce anahtar eşlemeleri (txt'de esnek isimler kabul edilir)
const ALIASES = {
  iban: 'iban',
  tckn: 'identityNumber', tc: 'identityNumber', kimlik: 'identityNumber', identitynumber: 'identityNumber', kimlikno: 'identityNumber',
  email: 'email', eposta: 'email', mail: 'email', 'e-posta': 'email',
  gsm: 'gsmNumber', gsmnumber: 'gsmNumber', telefon: 'gsmNumber', tel: 'gsmNumber', 'gsm no': 'gsmNumber',
  name: 'name', ad: 'name', isim: 'name', 'ad soyad': 'name', adsoyad: 'name',
  contactname: 'contactName', contactsurname: 'contactSurname', soyad: 'contactSurname',
  address: 'address', adres: 'address',
  submerchanttype: 'subMerchantType', tip: 'subMerchantType', type: 'subMerchantType',
  legalcompanytitle: 'legalCompanyTitle', unvan: 'legalCompanyTitle',
  taxoffice: 'taxOffice', vergidairesi: 'taxOffice', 'vergi dairesi': 'taxOffice',
  taxnumber: 'taxNumber', vkn: 'taxNumber', vergino: 'taxNumber', 'vergi no': 'taxNumber',
};

function parseTxt(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#') || t.startsWith('//')) continue;
    const m = t.match(/^([^:=]+)[:=](.*)$/);
    if (!m) continue;
    const rawKey = m[1].trim().toLowerCase();
    const val = m[2].trim().replace(/^["']|["']$/g, '');
    const key = ALIASES[rawKey] || rawKey;
    if (val) out[key] = val;
  }
  return out;
}

let cfg = {};
if (jsonPath && fs.existsSync(jsonPath)) {
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  cfg = Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith('_')));
}
if (txtPath && fs.existsSync(txtPath)) {
  Object.assign(cfg, parseTxt(fs.readFileSync(txtPath, 'utf8')));
}
// IBAN'daki boşlukları temizle
if (cfg.iban) cfg.iban = String(cfg.iban).replace(/\s+/g, '');

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY,
  secretKey: process.env.IYZICO_SECRET_KEY,
  uri: process.env.IYZICO_BASE_URL || 'https://api.iyzipay.com',
});

const type = String(cfg.subMerchantType || 'PERSONAL').toUpperCase();
const base = {
  locale: 'tr',
  conversationId: crypto.randomUUID(),
  subMerchantExternalId: cfg.subMerchantExternalId || 'BIDUNYAM-' + Date.now(),
  subMerchantType: type,
  address: cfg.address,
  email: cfg.email,
  gsmNumber: cfg.gsmNumber,
  name: cfg.name,
  iban: cfg.iban,
  currency: cfg.currency || 'TRY',
};

let req;
if (type === 'PERSONAL') {
  req = { ...base, contactName: cfg.contactName, contactSurname: cfg.contactSurname, identityNumber: cfg.identityNumber };
} else if (type === 'PRIVATE_COMPANY') {
  req = { ...base, legalCompanyTitle: cfg.legalCompanyTitle, taxOffice: cfg.taxOffice, identityNumber: cfg.identityNumber };
} else if (type === 'LIMITED_OR_JOINT_STOCK_COMPANY') {
  req = { ...base, legalCompanyTitle: cfg.legalCompanyTitle, taxOffice: cfg.taxOffice, taxNumber: cfg.taxNumber };
} else {
  console.error('HATA: subMerchantType geçersiz. PERSONAL | PRIVATE_COMPANY | LIMITED_OR_JOINT_STOCK_COMPANY olmalı.');
  process.exit(1);
}

const missing = Object.entries(req).filter(([, v]) => v === undefined || v === '').map(([k]) => k);
if (missing.length) {
  console.error('HATA: Eksik alan(lar):', missing.join(', '));
  console.error('(Değerleri submerchant.local.json veya bilgiler.txt içine ekle.)');
  process.exit(1);
}

iyzipay.subMerchant.create(req, (err, result) => {
  if (err) { console.error('HATA:', err.message || err); process.exit(1); }
  if (!result || result.status !== 'success') {
    console.error('İYZICO HATA:', (result && result.errorMessage) || JSON.stringify(result));
    process.exit(1);
  }
  console.log('BASARILI ✅');
  console.log('subMerchantKey=' + result.subMerchantKey);
  console.log('externalId=' + req.subMerchantExternalId);
});
