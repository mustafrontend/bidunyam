// ─────────────────────────────────────────────────────────────
// İyzico Ödeme Simülasyonu (Mockup)
// Gerçek iyzico entegrasyonu yerine, iyzico akışını birebir taklit eden
// sahte bir ödeme sağlayıcısı. Taksit sorgulama, kart doğrulama,
// 3D Secure OTP akışı ve ödeme onayı içerir.
// ─────────────────────────────────────────────────────────────

import crypto from 'crypto';

// BIN (kart ilk 6 hane) → Banka / Kart Ailesi eşlemesi (örnek set)
const BIN_MAP: Record<string, { bank: string; family: string; scheme: string }> = {
  '552879': { bank: 'Garanti BBVA', family: 'Bonus', scheme: 'MasterCard' },
  '540667': { bank: 'Yapı Kredi', family: 'World', scheme: 'MasterCard' },
  '454671': { bank: 'Akbank', family: 'Axess', scheme: 'Visa' },
  '415565': { bank: 'İş Bankası', family: 'Maximum', scheme: 'Visa' },
  '435508': { bank: 'Ziraat Bankası', family: 'Bankkart', scheme: 'Visa' },
  '979200': { bank: 'Halkbank', family: 'Paraf', scheme: 'Troy' },
  '589004': { bank: 'Denizbank', family: 'Bonus', scheme: 'MasterCard' },
};

function detectScheme(cardNumber: string): string {
  const n = cardNumber.replace(/\s/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n)) return 'MasterCard';
  if (/^9792/.test(n)) return 'Troy';
  if (/^3[47]/.test(n)) return 'American Express';
  return 'Bilinmeyen';
}

function lookupBin(binNumber: string) {
  return (
    BIN_MAP[binNumber] || {
      bank: 'Diğer Banka',
      family: 'Kredi Kartı',
      scheme: detectScheme(binNumber),
    }
  );
}

// Luhn algoritması (kart numarası geçerlilik kontrolü)
export function luhnValid(cardNumber: string): boolean {
  const n = cardNumber.replace(/\D/g, '');
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

// Taksit oranları (taksit sayısı → toplam tutar çarpanı)
const INSTALLMENT_RATES: Array<{ count: number; rate: number; label: string }> = [
  { count: 1, rate: 1.0, label: 'Tek Çekim' },
  { count: 2, rate: 1.0, label: '2 Taksit' },
  { count: 3, rate: 1.0, label: '3 Taksit' },
  { count: 6, rate: 1.06, label: '6 Taksit' },
  { count: 9, rate: 1.1, label: '9 Taksit' },
  { count: 12, rate: 1.15, label: '12 Taksit' },
];

export interface InstallmentOption {
  installmentNumber: number;
  label: string;
  totalPrice: number;
  installmentPrice: number;
  hasInterest: boolean;
}

// 3DS oturumları (bellek içi; mockup için yeterli)
const threeDSSessions = new Map<string, { paymentId: string; price: number; expiresAt: number; card: any; meta: any }>();

export const PaymentService = {
  // İyzico "retrieveInstallmentInfo" benzeri
  getInstallments(binNumber: string, price: number) {
    const bin = lookupBin(binNumber);
    const options: InstallmentOption[] = INSTALLMENT_RATES.map((r) => {
      const total = Math.round(price * r.rate * 100) / 100;
      return {
        installmentNumber: r.count,
        label: r.label,
        totalPrice: total,
        installmentPrice: Math.round((total / r.count) * 100) / 100,
        hasInterest: r.rate > 1.0,
      };
    });
    return {
      binNumber,
      bankName: bin.bank,
      cardFamily: bin.family,
      cardScheme: bin.scheme,
      force3ds: true,
      installmentOptions: options,
    };
  },

  // İyzico "payment initialize (3DS)" benzeri — kartı doğrular, 3DS başlatır
  initPayment(input: {
    cardNumber: string;
    cardHolderName: string;
    expireMonth: string;
    expireYear: string;
    cvc: string;
    installment: number;
    price: number;
    buyer?: any;
    address?: any;
    basketItems?: any[];
  }) {
    const errors: string[] = [];
    if (!luhnValid(input.cardNumber)) errors.push('Geçersiz kart numarası');
    if (!input.cardHolderName || input.cardHolderName.trim().length < 3) errors.push('Kart üzerindeki isim gerekli');
    if (!/^\d{2}$/.test(input.expireMonth) || Number(input.expireMonth) < 1 || Number(input.expireMonth) > 12)
      errors.push('Geçersiz son kullanma ayı');
    if (!/^\d{2,4}$/.test(input.expireYear)) errors.push('Geçersiz son kullanma yılı');
    if (!/^\d{3,4}$/.test(input.cvc)) errors.push('Geçersiz CVC');

    if (errors.length > 0) {
      return { status: 'failure' as const, errorMessage: errors.join(', ') };
    }

    const bin = lookupBin(input.cardNumber.replace(/\s/g, '').slice(0, 6));
    const paymentId = 'PAY-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const conversationId = crypto.randomUUID();
    const threeDSSessionId = crypto.randomBytes(10).toString('hex');
    const rate = INSTALLMENT_RATES.find((r) => r.count === input.installment)?.rate || 1.0;
    const paidPrice = Math.round(input.price * rate * 100) / 100;

    threeDSSessions.set(threeDSSessionId, {
      paymentId,
      price: paidPrice,
      expiresAt: Date.now() + 5 * 60 * 1000,
      card: {
        last4: input.cardNumber.replace(/\s/g, '').slice(-4),
        scheme: bin.scheme,
        family: bin.family,
      },
      meta: { conversationId, installment: input.installment, bank: bin.bank },
    });

    // Gerçek iyzico'da burada 3DS HTML döner; biz OTP simülasyonu yapıyoruz
    return {
      status: '3ds_required' as const,
      threeDSSessionId,
      paymentId,
      conversationId,
      paidPrice,
      installment: input.installment,
      bankName: bin.bank,
      // Mockup: 3DS onay kodu 123456 (gerçek akışta SMS ile gelir)
      otpHint: 'Bankanız tarafından gönderilen SMS kodunu girin (demo: 123456)',
      maskedCard: `**** **** **** ${input.cardNumber.replace(/\s/g, '').slice(-4)}`,
    };
  },

  // İyzico "3DS complete / callback" benzeri — OTP doğrular
  complete3DS(threeDSSessionId: string, otp: string) {
    const session = threeDSSessions.get(threeDSSessionId);
    if (!session) {
      return { status: 'failure' as const, errorMessage: '3DS oturumu bulunamadı veya süresi doldu' };
    }
    if (Date.now() > session.expiresAt) {
      threeDSSessions.delete(threeDSSessionId);
      return { status: 'failure' as const, errorMessage: '3DS oturumunun süresi doldu' };
    }
    if (otp !== '123456') {
      return { status: 'failure' as const, errorMessage: 'Hatalı doğrulama kodu' };
    }

    threeDSSessions.delete(threeDSSessionId);
    return {
      status: 'success' as const,
      paymentId: session.paymentId,
      paidPrice: session.price,
      cardLast4: session.card.last4,
      cardScheme: session.card.scheme,
      bankName: session.meta.bank,
      installment: session.meta.installment,
      conversationId: session.meta.conversationId,
      authCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
    };
  },
};
