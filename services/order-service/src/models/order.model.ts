import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  barcode?: string;  // XML'den gelen barkod
}

export interface IOrder extends Document {
  userId: string;
  items: IOrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  address: string;
  paymentDetails: {
    cardLast4: string;
    paymentId: string;
  };
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
  status: { type: String, enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'], default: 'PAID' },
  address: { type: String, required: true },
  paymentDetails: {
    cardLast4: { type: String },
    paymentId: { type: String },
  },
  xmlFileName: { type: String },  // XML import'undan gelen dosya adı
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IOrder>('Order', OrderSchema);
