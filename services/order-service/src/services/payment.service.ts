// ─────────────────────────────────────────────────────────────
// İyzico Gerçek Ödeme Entegrasyonu (3D Secure + non-3DS)
// Anahtarlar .env'den: IYZICO_API_KEY / IYZICO_SECRET_KEY / IYZICO_BASE_URL
// Sandbox: https://sandbox-api.iyzipay.com  |  Canlı: https://api.iyzipay.com
// Türk bankaları çoğunlukla 3DS zorunlu kılar → asıl akış initThreeDS + completeThreeDS.
// ─────────────────────────────────────────────────────────────

import crypto from 'crypto';
import Iyzipay from 'iyzipay';

const API_KEY = process.env.IYZICO_API_KEY || '';
const SECRET_KEY = process.env.IYZICO_SECRET_KEY || '';
const BASE_URL = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com';
// Pazaryeri (Marketplace) hesabında her sepet kalemine satıcının alt üye işyeri anahtarı gerekir.
// Şimdilik tek anahtar env'den; ileride satıcı bazında DB'den okunacak.
const RAW_SUBMERCHANT_KEY = process.env.IYZICO_SUBMERCHANT_KEY || '';
const SUBMERCHANT_KEY = RAW_SUBMERCHANT_KEY.startsWith('buraya') ? '' : RAW_SUBMERCHANT_KEY;

export const iyzicoConfigured = Boolean(API_KEY && SECRET_KEY && !API_KEY.startsWith('buraya'));

const iyzipay = new Iyzipay({ apiKey: API_KEY, secretKey: SECRET_KEY, uri: BASE_URL });

// Para tutarını iyzico'nun beklediği "1.00" formatına çevirir
function toMoney(n: number): string {
  return (Math.round(Number(n) * 100) / 100).toFixed(2);
}

function detectScheme(cardNumber: string): string {
  const n = String(cardNumber).replace(/\s/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n)) return 'MasterCard';
  if (/^9792/.test(n)) return 'Troy';
  if (/^3[47]/.test(n)) return 'American Express';
  return 'Bilinmeyen';
}

// Luhn algoritması (kart numarası ön doğrulaması — iyzico'ya gitmeden hızlı kontrol)
export function luhnValid(cardNumber: string): boolean {
  const n = String(cardNumber).replace(/\D/g, '');
  if (n.length < 12) return false;
  let sum = 0;
  let alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = parseInt(n[i], 10);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export interface InstallmentOption {
  installmentNumber: number;
  label: string;
  totalPrice: number;
  installmentPrice: number;
  hasInterest: boolean;
}

export interface ChargeInput {
  cardNumber: string;
  cardHolderName: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
  installment: number;
  price: number;
  ip?: string;
  buyer?: { id?: string; name?: string; email?: string; gsmNumber?: string; identityNumber?: string; city?: string; address?: string };
}

// 3DS sonuçları (conversationId → tamamlanmış ödeme) — kısa ömürlü bellek içi saklama
const threeDSResults = new Map<string, { data: any; expiresAt: number }>();
function putResult(cid: string, data: any) {
  threeDSResults.set(cid, { data, expiresAt: Date.now() + 15 * 60 * 1000 });
}
export function getThreeDSResult(cid: string): any | null {
  const r = threeDSResults.get(cid);
  if (!r) return null;
  if (Date.now() > r.expiresAt) {
    threeDSResults.delete(cid);
    return null;
  }
  return r.data;
}

function validateCard(input: ChargeInput): string[] {
  const errors: string[] = [];
  if (!luhnValid(input.cardNumber)) errors.push('Geçersiz kart numarası');
  if (!input.cardHolderName || input.cardHolderName.trim().length < 3) errors.push('Kart üzerindeki isim gerekli');
  if (!/^\d{2}$/.test(String(input.expireMonth)) || Number(input.expireMonth) < 1 || Number(input.expireMonth) > 12)
    errors.push('Geçersiz son kullanma ayı');
  if (!/^\d{2,4}$/.test(String(input.expireYear))) errors.push('Geçersiz son kullanma yılı');
  if (!/^\d{3,4}$/.test(String(input.cvc))) errors.push('Geçersiz CVC');
  return errors;
}

// iyzico payment / threedsInitialize ortak istek gövdesi
function buildRequest(input: ChargeInput, conversationId: string, callbackUrl?: string) {
  const cardNumber = String(input.cardNumber).replace(/\s/g, '');
  const price = toMoney(input.price);
  const buyer = input.buyer || {};
  const nameParts = String(input.cardHolderName || 'Müşteri').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Müşteri';
  const lastName = nameParts.slice(1).join(' ') || 'biDünyam';
  const expireYear = String(input.expireYear).length === 2 ? `20${input.expireYear}` : String(input.expireYear);

  const addr = {
    contactName: input.cardHolderName || 'Müşteri',
    city: buyer.city || 'İstanbul',
    country: 'Turkey',
    address: buyer.address || 'Türkiye',
  };

  const req: any = {
    locale: 'tr',
    conversationId,
    price,
    paidPrice: price,
    currency: 'TRY',
    installment: String(input.installment || 1),
    basketId: 'B' + Date.now(),
    paymentChannel: 'WEB',
    paymentGroup: 'PRODUCT',
    paymentCard: {
      cardHolderName: input.cardHolderName,
      cardNumber,
      expireMonth: String(input.expireMonth).padStart(2, '0'),
      expireYear,
      cvc: String(input.cvc),
      registerCard: 0,
    },
    buyer: {
      id: buyer.id || 'BY' + Date.now(),
      name: firstName,
      surname: lastName,
      gsmNumber: buyer.gsmNumber || '+905350000000',
      email: buyer.email || 'musteri@bidunyam.com',
      identityNumber: buyer.identityNumber || '11111111111',
      registrationAddress: addr.address,
      ip: input.ip || '85.34.78.112',
      city: addr.city,
      country: 'Turkey',
    },
    shippingAddress: addr,
    billingAddress: addr,
    // Tek satır sepet: toplam = price (iyzico basketItems toplamı == price şartı sağlanır)
    basketItems: [
      {
        id: 'BI1',
        name: 'biDünyam Sepeti',
        category1: 'Alışveriş',
        itemType: 'PHYSICAL',
        price,
        // Pazaryeri hesabı: satıcının alt üye işyeri anahtarı + o kaleme düşen tutar
        ...(SUBMERCHANT_KEY ? { subMerchantKey: SUBMERCHANT_KEY, subMerchantPrice: price } : {}),
      },
    ],
  };
  if (callbackUrl) req.callbackUrl = callbackUrl;
  return req;
}

function mapSuccess(result: any, conversationId: string, fallbackCard: string, fallbackPrice: string) {
  return {
    status: 'success' as const,
    paymentId: result.paymentId,
    paidPrice: Number(result.paidPrice) || Number(fallbackPrice),
    cardLast4: result.lastFourDigits || String(fallbackCard).replace(/\s/g, '').slice(-4),
    cardScheme: result.cardAssociation || detectScheme(fallbackCard),
    bankName: result.cardFamily || '',
    installment: Number(result.installment) || 1,
    conversationId,
    authCode: result.authCode || result.paymentId,
  };
}

export const PaymentService = {
  // Gerçek iyzico installmentInfo — kart BIN'ine göre taksit seçenekleri
  getInstallments(binNumber: string, price: number): Promise<any> {
    const singleOption: InstallmentOption = {
      installmentNumber: 1,
      label: 'Tek Çekim',
      totalPrice: Math.round(price * 100) / 100,
      installmentPrice: Math.round(price * 100) / 100,
      hasInterest: false,
    };
    const fallback = { binNumber, bankName: '', cardScheme: detectScheme(binNumber), force3ds: false, installmentOptions: [singleOption] };

    if (!iyzicoConfigured) return Promise.resolve(fallback);

    return new Promise((resolve) => {
      iyzipay.installmentInfo.retrieve(
        { locale: 'tr', conversationId: crypto.randomUUID(), binNumber: String(binNumber).slice(0, 6), price: toMoney(price) },
        (err: any, result: any) => {
          if (err || !result || result.status !== 'success' || !Array.isArray(result.installmentDetails) || result.installmentDetails.length === 0) {
            return resolve(fallback);
          }
          const d = result.installmentDetails[0];
          const options: InstallmentOption[] = (d.installmentPrices || []).map((p: any) => ({
            installmentNumber: Number(p.installmentNumber),
            label: Number(p.installmentNumber) > 1 ? `${p.installmentNumber} Taksit` : 'Tek Çekim',
            totalPrice: Number(p.totalPrice),
            installmentPrice: Number(p.installmentPrice),
            hasInterest: Number(p.totalPrice) > Number(price) + 0.001,
          }));
          resolve({
            binNumber,
            bankName: d.bankName || '',
            cardScheme: d.cardAssociation || detectScheme(binNumber),
            force3ds: d.force3ds === 1,
            installmentOptions: options.length ? options : [singleOption],
          });
        }
      );
    });
  },

  // 3DS başlat: banka doğrulama ekranını (threeDSHtmlContent) döner
  initThreeDS(input: ChargeInput, callbackUrl: string): Promise<any> {
    const errors = validateCard(input);
    if (errors.length > 0) return Promise.resolve({ status: 'failure' as const, errorMessage: errors.join(', ') });
    if (!iyzicoConfigured) {
      return Promise.resolve({ status: 'failure' as const, errorMessage: 'Ödeme sağlayıcısı yapılandırılmadı (IYZICO anahtarları eksik).' });
    }
    const conversationId = crypto.randomUUID();
    const request = buildRequest(input, conversationId, callbackUrl);
    return new Promise((resolve) => {
      iyzipay.threedsInitialize.create(request, (err: any, result: any) => {
        if (err) return resolve({ status: 'failure' as const, errorMessage: err.message || 'Ödeme başlatılamadı' });
        if (!result || result.status !== 'success') {
          return resolve({ status: 'failure' as const, errorMessage: (result && result.errorMessage) || '3D Secure başlatılamadı' });
        }
        resolve({
          status: 'success' as const,
          threeDSHtmlContent: result.threeDSHtmlContent, // base64 — tarayıcıda çözülüp render edilir
          conversationId,
          paymentId: result.paymentId,
        });
      });
    });
  },

  // 3DS tamamla: banka callback'inden gelen paymentId + conversationData ile tahsilatı sonlandır
  completeThreeDS(paymentId: string, conversationData: string, conversationId: string, mdStatus?: string): Promise<any> {
    if (!iyzicoConfigured) {
      const fail = { status: 'failure' as const, errorMessage: 'Ödeme sağlayıcısı yapılandırılmadı.' };
      putResult(conversationId, fail);
      return Promise.resolve(fail);
    }
    // mdStatus=1 → tam doğrulama. Diğer değerler 3DS doğrulamasının başarısız olduğunu gösterir.
    if (mdStatus !== undefined && String(mdStatus) !== '1') {
      const fail = { status: 'failure' as const, errorMessage: `3D Secure doğrulaması başarısız (mdStatus=${mdStatus})` };
      console.log('[3DS] mdStatus başarısız:', mdStatus, 'conversationId:', conversationId);
      putResult(conversationId, fail);
      return Promise.resolve(fail);
    }
    return new Promise((resolve) => {
      iyzipay.threedsPayment.create(
        { locale: 'tr', conversationId, paymentId, conversationData },
        (err: any, result: any) => {
          // Tanı için iyzico'nun tam yanıtını logla (kart verisi içermez)
          console.log('[3DS] threedsPayment sonucu:', JSON.stringify({
            status: result?.status, paymentStatus: result?.paymentStatus,
            errorCode: result?.errorCode, errorMessage: result?.errorMessage,
            fraudStatus: result?.fraudStatus, mdStatus: result?.mdStatus,
            paymentId: result?.paymentId, paidPrice: result?.paidPrice,
          }));
          let out: any;
          if (err) {
            out = { status: 'failure', errorMessage: err.message || 'Ödeme tamamlanamadı' };
          } else if (!result || result.status !== 'success') {
            out = { status: 'failure', errorMessage: result?.errorMessage || 'Ödeme reddedildi' };
          } else if (result.paymentStatus && result.paymentStatus !== 'SUCCESS') {
            // API zarfı success olsa da asıl tahsilat gerçekleşmemişse başarısız say
            out = { status: 'failure', errorMessage: `Ödeme tamamlanmadı (paymentStatus=${result.paymentStatus})` };
          } else {
            out = mapSuccess(result, conversationId, '', String(result.paidPrice || ''));
          }
          putResult(conversationId, out);
          resolve(out);
        }
      );
    });
  },

  // non-3DS doğrudan tahsilat (3DS zorunlu olmayan kartlar / test için)
  charge(input: ChargeInput): Promise<any> {
    const errors = validateCard(input);
    if (errors.length > 0) return Promise.resolve({ status: 'failure' as const, errorMessage: errors.join(', ') });
    if (!iyzicoConfigured) {
      return Promise.resolve({ status: 'failure' as const, errorMessage: 'Ödeme sağlayıcısı yapılandırılmadı (IYZICO anahtarları eksik).' });
    }
    const conversationId = crypto.randomUUID();
    const request = buildRequest(input, conversationId);
    return new Promise((resolve) => {
      iyzipay.payment.create(request, (err: any, result: any) => {
        if (err) return resolve({ status: 'failure' as const, errorMessage: err.message || 'Ödeme sağlayıcısına ulaşılamadı' });
        if (!result || result.status !== 'success') return resolve({ status: 'failure' as const, errorMessage: (result && result.errorMessage) || 'Ödeme reddedildi' });
        resolve(mapSuccess(result, conversationId, input.cardNumber, toMoney(input.price)));
      });
    });
  },
};
