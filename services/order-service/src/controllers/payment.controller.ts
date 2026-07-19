import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';

export const PaymentController = {
  // Taksit seçeneklerini getir (kart BIN + tutar)
  installments(req: Request, res: Response) {
    try {
      const { binNumber, price } = req.body;
      if (!binNumber || !price) {
        return res.status(400).json({ success: false, message: 'binNumber ve price gerekli' });
      }
      const data = PaymentService.getInstallments(String(binNumber).slice(0, 6), Number(price));
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Ödemeyi başlat (kart doğrula + 3DS başlat)
  init(req: Request, res: Response) {
    try {
      const result = PaymentService.initPayment(req.body);
      if (result.status === 'failure') {
        return res.status(400).json({ success: false, ...result });
      }
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3DS OTP doğrula ve ödemeyi tamamla
  complete3DS(req: Request, res: Response) {
    try {
      const { threeDSSessionId, otp } = req.body;
      const result = PaymentService.complete3DS(threeDSSessionId, String(otp || ''));
      if (result.status === 'failure') {
        return res.status(400).json({ success: false, ...result });
      }
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
