import Order, { IOrder } from '../models/order.model';
import { NavlungoService } from './navlungo.service';
import { PricingClient } from './pricingClient.service';

export const OrderService = {
  async createOrder(userId: string, orderData: any): Promise<IOrder> {
    // Komisyon/kargo kırılımını sipariş anında hesaplayıp sabitliyoruz;
    // admin oranları sonradan değiştirse bile bu sipariş etkilenmez.
    const items = (orderData?.items || []).map((i: any) => ({
      price: Number(i.price) || 0,
      quantity: Number(i.quantity) || 1,
      categoryPath: i.categoryPath || i.categoryName || i.category,
      listingType: i.listingType,
      desi: Number(i.desi) || 1,
    }));
    const pricing = await PricingClient.quote(items, Number(orderData?.desi) || undefined);

    const order = new Order({
      userId,
      ...orderData,
      pricing,
      status: 'PAID' // Payment simulation success
    });
    return await order.save();
  },

  /**
   * Kırılımı alınamamış siparişleri güncel tarifeyle tamamlar.
   * (product-service geçici olarak erişilemezse sipariş kırılımsız kaydolur.)
   */
  async backfillPricing(limit = 100): Promise<number> {
    const pending = await Order.find({
      $or: [{ pricing: { $exists: false } }, { 'pricing.resolved': false }],
    })
      .limit(limit)
      .exec();

    let fixed = 0;
    for (const order of pending) {
      const items = (order.items || []).map((i: any) => ({
        price: Number(i.price) || 0,
        quantity: Number(i.quantity) || 1,
        categoryPath: (i as any).categoryPath || (i as any).categoryName,
        listingType: (i as any).listingType,
        desi: Number((i as any).desi) || 1,
      }));
      const pricing = await PricingClient.quote(items, order.shipment?.desi);
      if (!pricing.resolved) continue; // servis hâlâ erişilemez
      order.pricing = pricing;
      await order.save();
      fixed += 1;
    }
    if (fixed > 0) console.log(`[Pricing] ${fixed} siparişin kırılımı tamamlandı.`);
    return fixed;
  },

  async getOrders(userId: string): Promise<IOrder[]> {
    return await Order.find({ userId }).sort({ createdAt: -1 });
  },

  async getOrderById(orderId: string): Promise<IOrder | null> {
    return await Order.findById(orderId);
  },

  async getAdminOrders(): Promise<IOrder[]> {
    return await Order.find().sort({ createdAt: -1 });
  },

  // ─── Kargo / Navlungo ────────────────────────────────────────
  // Gönderi oluştur (satıcı/admin): Navlungo'dan takip no alır, SHIPPED yapar
  async createShipment(orderId: string): Promise<IOrder | null> {
    const order = await Order.findById(orderId);
    if (!order) return null;
    if (order.shipment?.trackingNumber) return order; // zaten gönderilmiş

    const desi = (order.items || []).reduce((s) => s + 1, 0);
    const shipment = NavlungoService.createShipment({ desi, address: order.address });

    order.shipment = shipment as any;
    order.status = 'SHIPPED';
    await order.save();
    return order;
  },

  // Takip durumunu bir adım ilerlet (webhook simülasyonu)
  async advanceTracking(orderId: string): Promise<IOrder | null> {
    const order = await Order.findById(orderId);
    if (!order || !order.shipment?.events?.length) return order;

    const lastEvent = order.shipment.events[order.shipment.events.length - 1];
    const next = NavlungoService.nextEvent(lastEvent.status);
    if (!next) return order; // zaten teslim edildi

    order.shipment.events.push(next as any);
    order.status = NavlungoService.orderStatusFromTracking(next.status) as any;
    if (next.status === 'DELIVERED') {
      order.shipment.deliveredAt = new Date();
    }
    await order.save();
    return order;
  },

  async updateStatus(orderId: string, status: string): Promise<IOrder | null> {
    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    return order;
  },

  async getTracking(orderId: string) {
    const order = await Order.findById(orderId);
    if (!order) return null;
    return {
      orderId: order._id,
      status: order.status,
      shipment: order.shipment || null,
    };
  },
};
