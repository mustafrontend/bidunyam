import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
  barcode: string;
  modelCode: string;
  sku: string;
  name: string;
  shortDescription: string;
  bulletPoints: string[];
  description: string;
  categoryPath: string;
  categoryAttributes: Record<string, string>;
  price: number;
  purchasePrice: number;
  vatRate: 1 | 10 | 20;
  originalPrice: number;
  discountPercent: number;
  category: string;
  brand: string;
  variants: Array<{
    name: string;
    type: 'COLOR' | 'SIZE' | 'CUSTOM';
    values: Array<{
      label: string;
      price: number;
      stock: number;
    }>;
  }>;
  extraServices: Array<{
    name: string;
    price: number;
    description?: string;
  }>;
  variantGroupId: string;
  variantValue: string;
  imageUrls: string[];
  imageUrl: string;
  desi: number;
  preparationDays: number;
  shippingType: 'SELF_SHIPPING' | 'MARKETPLACE_LOGISTICS';
  saleStatus: 'ACTIVE' | 'PASSIVE';
  approvalStatus: 'APPROVED' | 'REJECTED' | 'PENDING';
  marketplaceListingNo: string;
  stock: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    barcode: { type: String, required: true, unique: true, index: true },
    modelCode: { type: String, required: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    shortDescription: { type: String, default: '' },
    bulletPoints: { type: [String], default: [] },
    description: { type: String, required: true },
    categoryPath: { type: String, default: '' },
    categoryAttributes: { type: Schema.Types.Mixed, default: {} },
    price: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    vatRate: { type: Number, required: true, enum: [1, 10, 20], default: 20 },
    originalPrice: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    category: { type: String, required: true, index: true },
    brand: { type: String, required: true, index: true },
    variants: {
      type: [
        {
          name: { type: String, required: true },
          type: { type: String, enum: ['COLOR', 'SIZE', 'CUSTOM'], default: 'CUSTOM' },
          values: {
            type: [
              {
                label: { type: String, required: true },
                price: { type: Number, default: 0, min: 0 },
                stock: { type: Number, default: 0, min: 0 },
              },
            ],
            default: [],
          },
        },
      ],
      default: [],
    },
    extraServices: {
      type: [
        {
          name: { type: String, required: true },
          price: { type: Number, required: true, min: 0 },
          description: { type: String, default: '' },
        },
      ],
      default: [],
    },
    variantGroupId: { type: String, default: '' },
    variantValue: { type: String, default: '' },
    imageUrls: { type: [String], default: [] },
    imageUrl: { type: String, required: true },
    desi: { type: Number, default: 0, min: 0 },
    preparationDays: { type: Number, default: 1, min: 0 },
    shippingType: {
      type: String,
      enum: ['SELF_SHIPPING', 'MARKETPLACE_LOGISTICS'],
      default: 'MARKETPLACE_LOGISTICS',
    },
    saleStatus: { type: String, enum: ['ACTIVE', 'PASSIVE'], default: 'ACTIVE' },
    approvalStatus: { type: String, enum: ['APPROVED', 'REJECTED', 'PENDING'], default: 'PENDING' },
    marketplaceListingNo: { type: String, default: '' },
    stock: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', description: 'text' });

export const Product = model<IProduct>('Product', ProductSchema);
