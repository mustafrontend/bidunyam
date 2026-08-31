import { Request, Response } from 'express';
import { PaymentService, getThreeDSResult } from '../services/payment.service';

const CALLBACK_BASE = process.env.IYZICO_CALLBACK_BASE_URL || 'http://localhost:8080';
// Banka 3DS ekranından sonra tarayıcının POST edeceği public adres (gateway üzerinden order-service)
const CALLBACK_URL = `${CALLBACK_BASE}/orders/payment/3ds/callback`;

function clientIp(req: Request): string | undefined {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    undefined
  );
}

export const PaymentController = {
  // Taksit seçenekleri (gerçek iyzico installmentInfo)
  async installments(req: Request, res: Response) {
    try {
      const { binNumber, price } = req.body;
      if (!binNumber || !price) {
        return res.status(400).json({ success: false, message: 'binNumber ve price gerekli' });
      }
      const data = await PaymentService.getInstallments(String(binNumber).slice(0, 6), Number(price));
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Ödemeyi başlat → 3D Secure ekranını döner (threeDSHtmlContent + conversationId)
  async init(req: Request, res: Response) {
    try {
      const result = await PaymentService.initThreeDS({ ...req.body, ip: clientIp(req) }, CALLBACK_URL);
      if (result.status === 'failure') {
        return res.status(400).json({ success: false, ...result });
      }
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Banka 3DS ekranının POST ettiği public callback — tahsilatı tamamlar, sonucu opener'a bildirir
  async callback3DS(req: Request, res: Response) {
    const { paymentId, conversationData, conversationId, mdStatus, status } = req.body || {};
    // Tanı: bankanın callback'te döndüğü alanlar (kart verisi içermez)
    console.log('[3DS] callback body:', JSON.stringify({ paymentId, conversationId, mdStatus, status, hasConvData: Boolean(conversationData) }));
    let ok = false;
    let message = '';
    try {
      if (!paymentId || !conversationId) {
        message = 'Eksik 3DS parametreleri';
      } else {
        const result = await PaymentService.completeThreeDS(String(paymentId), String(conversationData || ''), String(conversationId), mdStatus !== undefined ? String(mdStatus) : undefined);
        ok = result.status === 'success';
        message = ok ? 'Ödeme onaylandı' : (result.errorMessage || 'Ödeme reddedildi');
      }
    } catch (e: any) {
      message = e.message || 'Beklenmeyen hata';
    }
    // Popup penceresine sonucu bildirip kapanmasını sağla
    res
      .status(200)
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Ödeme Sonucu</title></head>
<body style="font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc;color:#0f172a">
<div style="text-align:center">
  <div style="font-size:44px">${ok ? '✅' : '❌'}</div>
  <p style="font-weight:700;margin-top:8px">${ok ? 'Ödeme onaylandı, pencere kapanıyor…' : 'Ödeme tamamlanamadı'}</p>
  <p style="color:#64748b;font-size:13px">${message.replace(/</g, '&lt;')}</p>
</div>
<script>
  (function(){
    var msg = { type: 'iyzico-3ds', conversationId: ${JSON.stringify(String(conversationId || ''))}, success: ${ok ? 'true' : 'false'} };
    try { if (window.opener) window.opener.postMessage(msg, '*'); } catch(e){}
    setTimeout(function(){ try { window.close(); } catch(e){} }, ${ok ? 1200 : 3500});
  })();
</script>
</body></html>`);
  },

  // Opener, callback'ten mesaj alınca yetkili ödeme sonucunu buradan çeker
  result3DS(req: Request, res: Response) {
    const cid = String(req.query.conversationId || '');
    const data = getThreeDSResult(cid);
    if (!data) return res.status(404).json({ success: false, message: 'Sonuç bulunamadı veya süresi doldu' });
    if (data.status !== 'success') return res.status(400).json({ success: false, ...data });
    res.json({ success: true, data });
  },
};
