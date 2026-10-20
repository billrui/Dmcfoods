import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true }, // e.g. 10 for 10%, or 5000 for Ksh50
  minOrderValue: { type: Number, default: 0 },     // In cents
  maxUses: { type: Number, default: 0 },           // 0 = unlimited
  currentUses: { type: Number, default: 0 },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('PromoCode', promoCodeSchema);
