import mongoose, { Schema, Document } from 'mongoose';

export interface IReturnItem {
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

// İade akışı: REQUESTED → APPROVED → IN_RETURN_TRANSIT → REFUNDED  (veya REJECTED)
export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'IN_RETURN_TRANSIT' | 'REFUNDED';

export interface IReturnRequest extends Document {
  orderId: string;
  userId: string;
  items: IReturnItem[];
  reason: string;              // "Beğenmedim", "Ürün hasarlı", "Yanlış ürün" ...
  description?: string;
  status: ReturnStatus;
  refundAmount: number;
  rejectReason?: string;
  returnShipment?: {
    carrier?: string;
    trackingNumber?: string;
  };
  createdAt: Date;
  resolvedAt?: Date;
}

const ReturnSchema: Schema = new Schema({
  orderId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    imageUrl: { type: String },
  }],
  reason: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'IN_RETURN_TRANSIT', 'REFUNDED'],
    default: 'REQUESTED',
  },
  refundAmount: { type: Number, default: 0 },
  rejectReason: { type: String },
  returnShipment: {
    carrier: { type: String },
    trackingNumber: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
});

export default mongoose.model<IReturnRequest>('ReturnRequest', ReturnSchema);
