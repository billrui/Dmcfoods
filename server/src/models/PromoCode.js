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
  onePerCustomer: { type: Boolean, default: false },
  eligibility:    { type: String, enum: ['everyone', 'loyal'], default: 'everyone' },
  loyalDays:          { type: Number, default: 5 },       // ordered on at least this many days…
  loyalWindowDays:    { type: Number, default: 7 },       // …out of the last this many days
  bigSpendAmount:     { type: Number, default: 1000000 }, // or spent at least this (cents, Ksh 10,000)…
  bigSpendWindowDays: { type: Number, default: 30 },      // …in the last this many days
}, { timestamps: true });

export default mongoose.model('PromoCode', promoCodeSchema);
