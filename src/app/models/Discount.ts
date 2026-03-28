import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDiscountCode extends Document {
  code: string;           // e.g. "SAVE20"
  discountType: "percent" | "fixed";
  discountValue: number;  // e.g. 10 (percent) or 500 (naira)
  isUsed: boolean;
  usedBy?: string;        // email or order ID of the user who redeemed it
  usedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;       // optional expiry date
  createdBy?: string;     // admin note
}

const DiscountCodeSchema = new Schema<IDiscountCode>(
  {
   code: {
    type: String,
    required: true,
    unique: true,        // This automatically creates the index
    uppercase: true,
    trim: true
  },
    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      required: true,
      default: "percent",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedBy: {
      type: String,
      default: null,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast lookups
DiscountCodeSchema.index({ code: 1 });
DiscountCodeSchema.index({ isUsed: 1 });

const DiscountCode: Model<IDiscountCode> =
  mongoose.models.DiscountCode ||
  mongoose.model<IDiscountCode>("DiscountCode", DiscountCodeSchema);

export default DiscountCode;