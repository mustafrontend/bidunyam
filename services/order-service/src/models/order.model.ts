import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  barcode?: string;  // XML'den gelen barkod
  selectedVariant?: Record<string, string>;
  giftOptions?: { isGift: boolean; giftNote: string; giftPrice: number };
}

export interface ITrackingEvent {
  status: string;      // CREATED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED
  label: string;       // "Kargo şubesine teslim edildi"
  location?: string;
  timestamp: Date;
}

export interface IShipment {
  carrier?: string;             // Yurtiçi, MNG, Aras ...
  trackingNumber?: string;      // Navlungo takip no
  barcode?: string;
  navlungoShipmentId?: string;
  labelUrl?: string;
  desi?: number;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  events: ITrackingEvent[];
}

/**
 * Siparis anindaki komisyon/kargo kirilimi.
 * Oranlar admin panelinden degistirilebildigi icin, gecmis siparislerin
 * hakedisi bozulmasin diye o anki tarife siparise "fotograflanir".
 */
export interface IPricingSnapshot {
  gross: number;
  commissionTotal: number;
  serviceFee: number;
  transactionFee: number;
  shippingCost: number;
  freeShippingApplied: boolean;
  totalDesi: number;
  sellerPayout: number;
  buyerTotal: number;
  lines: Array<{ categoryName: string; gross: number; commissionRate: number; commission: number }>;
  /// Tarifenin uygulandigi an
  calculatedAt: Date;
  /// Fiyatlandirma servisine ulasilamadiysa false; hakedis sonradan hesaplanir
  resolved: boolean;
}

export interface IOrder extends Document {
  userId: string;
  items: IOrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  address: string;
  paymentDetails: {
    cardLast4: string;
    paymentId: string;
    bankName?: string;
    cardScheme?: string;
    installment?: number;
    paidPrice?: number;
    authCode?: string;
  };
  shipment?: IShipment;
  pricing?: IPricingSnapshot;
  xmlFileName?: string;  // XML import'undan gelen dosya adı
  createdAt: Date;
}

const OrderSchema: Schema = new Schema({
  userId: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    imageUrl: { type: String },
    barcode: { type: String },  // XML'den gelen barkod
    selectedVariant: { type: Schema.Types.Mixed },
    giftOptions: {
      isGift: { type: Boolean, default: false },
      giftNote: { type: String, default: '' },
      giftPrice: { type: Number, default: 0 },
    },
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'], default: 'PAID' },
  address: { type: String, required: true },
  shipment: {
    carrier: { type: String },
    trackingNumber: { type: String },
    barcode: { type: String },
    navlungoShipmentId: { type: String },
    labelUrl: { type: String },
    desi: { type: Number },
    estimatedDelivery: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    events: [{
      status: { type: String },
      label: { type: String },
      location: { type: String },
      timestamp: { type: Date, default: Date.now },
    }],
  },
  paymentDetails: {
    cardLast4: { type: String },
    paymentId: { type: String },
    bankName: { type: String },
    cardScheme: { type: String },
    installment: { type: Number, default: 1 },
    paidPrice: { type: Number },
    authCode: { type: String },
  },
  pricing: {
    gross: { type: Number },
    commissionTotal: { type: Number },
    serviceFee: { type: Number, default: 0 },
    transactionFee: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    freeShippingApplied: { type: Boolean, default: false },
    totalDesi: { type: Number },
    sellerPayout: { type: Number },
    buyerTotal: { type: Number },
    lines: [{
      categoryName: { type: String },
      gross: { type: Number },
      commissionRate: { type: Number },
      commission: { type: Number },
    }],
    calculatedAt: { type: Date },
    resolved: { type: Boolean, default: false },
  },
  xmlFileName: { type: String },  // XML import'undan gelen dosya adı
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IOrder>('Order', OrderSchema);
