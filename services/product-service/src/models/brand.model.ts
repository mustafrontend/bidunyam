import { Schema, model, Document } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  normalizedName: string;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true },
    normalizedName: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

export const Brand = model<IBrand>('Brand', BrandSchema);
