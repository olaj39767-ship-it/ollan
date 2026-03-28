import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email: string;
  password?: string;           // hashed password
  phone?: string;
  image?: string;              // profile picture

  // Store Credit System
  storeCredit: number;

  // Optional fields (common in e-commerce)
  isAdmin: boolean;
  isVerified: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };

  // For future referral system (you can enable later)
  referralCode?: string;
  referredBy?: mongoose.Types.ObjectId;   // who referred this user

  // Auth related tokens (if you're using JWT or email verification)
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  verificationToken?: string;
  verificationExpires?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      // required: [true, "Password is required"],   // uncomment if using credentials auth
      minlength: [6, "Password must be at least 6 characters"],
      select: false,   // don't return password by default
    },
    phone: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },

    // === Store Credit ===
    storeCredit: {
      type: Number,
      default: 0,
      min: 0,                    // never allow negative balance
    },

    // Common e-commerce fields
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },

    // Future referral fields (commented for now since you said leave referral for later)
    // referralCode: {
    //   type: String,
    //   unique: true,
    //   uppercase: true,
    //   sparse: true,   // allows null/undefined
    // },
    // referredBy: {
    //   type: Schema.Types.ObjectId,
    //   ref: "User",
    // },

    resetPasswordToken: String,
    resetPasswordExpires: Date,
    verificationToken: String,
    verificationExpires: Date,
  },
  {
    timestamps: true,          // automatically adds createdAt & updatedAt
  }
);

// Prevent model recompilation error in Next.js hot reload
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;