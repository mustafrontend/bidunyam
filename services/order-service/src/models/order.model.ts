import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  barcode?: string;  // XML'den gelen barkod
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
  xmlFileName: { type: String },  // XML import'undan gelen dosya adı
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IOrder>('Order', OrderSchema);
