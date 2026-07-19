import ReturnRequest, { IReturnRequest } from '../models/return.model';
import Order from '../models/order.model';
import { NavlungoService } from './navlungo.service';

export const ReturnService = {
  // Müşteri iade talebi oluşturur (yalnızca teslim edilmiş/kargodaki siparişler)
  async createReturn(userId: string, orderId: string, input: {
    items?: any[];
    reason: string;
    description?: string;
  }): Promise<IReturnRequest> {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Sipariş bulunamadı');
    if (order.userId !== userId) throw new Error('Bu sipariş size ait değil');
    if (!['DELIVERED', 'SHIPPED', 'IN_TRANSIT'].includes(order.status)) {
      throw new Error('Bu sipariş için iade talebi oluşturulamaz');
    }

    const existing = await ReturnRequest.findOne({ orderId, status: { $ne: 'REJECTED' } });
    if (existing) throw new Error('Bu sipariş için zaten bir iade talebi var');

    const items = (input.items && input.items.length ? input.items : order.items).map((i: any) => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      imageUrl: i.imageUrl,
    }));
    const refundAmount = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

    return ReturnRequest.create({
      orderId,
      userId,
      items,
      reason: input.reason,
      description: input.description,
      status: 'REQUESTED',
      refundAmount,
    });
  },

  async getMyReturns(userId: string): Promise<IReturnRequest[]> {
    return ReturnRequest.find({ userId }).sort({ createdAt: -1 });
  },

  async getAllReturns(): Promise<IReturnRequest[]> {
    return ReturnRequest.find().sort({ createdAt: -1 });
  },

  // Satıcı/admin onaylar → iade kargosu (ters lojistik) oluşturulur
  async approveReturn(returnId: string): Promise<IReturnRequest | null> {
    const ret = await ReturnRequest.findById(returnId);
    if (!ret) return null;
    const shipment = NavlungoService.createShipment({ desi: 1 });
    ret.status = 'APPROVED';
    ret.returnShipment = { carrier: shipment.carrier, trackingNumber: shipment.trackingNumber };
    await ret.save();
    return ret;
  },

  async rejectReturn(returnId: string, rejectReason: string): Promise<IReturnRequest | null> {
    return ReturnRequest.findByIdAndUpdate(
      returnId,
      { status: 'REJECTED', rejectReason, resolvedAt: new Date() },
      { new: true }
    );
  },

  // Kargo teslim alındı → iade yolda
  async markInTransit(returnId: string): Promise<IReturnRequest | null> {
    return ReturnRequest.findByIdAndUpdate(returnId, { status: 'IN_RETURN_TRANSIT' }, { new: true });
  },

  // Para iadesi (iyzico refund simülasyonu) → REFUNDED + siparişi CANCELLED
  async refund(returnId: string): Promise<IReturnRequest | null> {
    const ret = await ReturnRequest.findByIdAndUpdate(
      returnId,
      { status: 'REFUNDED', resolvedAt: new Date() },
      { new: true }
    );
    if (ret) {
      await Order.findByIdAndUpdate(ret.orderId, { status: 'CANCELLED' });
    }
    return ret;
  },
};
