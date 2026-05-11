import { Schema, model, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  normalizedName: string;
  subCategories: Array<{
    name: string;
    normalizedName: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    normalizedName: { type: String, required: true, unique: true, index: true },
    subCategories: {
      type: [
        {
          name: { type: String, required: true },
          normalizedName: { type: String, required: true },
          _id: false,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Category = model<ICategory>('Category', CategorySchema);
