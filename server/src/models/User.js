import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  userAgent: String,
  ip: String,
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name:     { type: String, default: '' },
  // Explicitly undefined/null handling for email to prevent duplicate key crashes
  email:    { type: String, lowercase: true, index: true, sparse: true, default: undefined },
  phone:    { type: String, unique: true, sparse: true, index: true },
  password: { type: String, select: false },
  isAdmin:  { type: Boolean, default: false },
  points:   { type: Number, default: 0 }, // loyalty points balance
  mustChangePassword: { type: Boolean, default: false },
  isSuperAdmin: { type: Boolean, default: false },
  otpHash:      { type: String, select: false },
  otpExpiresAt: { type: Date,   select: false },
  otpAttempts:  { type: Number, default: 0, select: false },
  refreshTokens: { type: [refreshTokenSchema], select: false, default: [] },
  addresses: [{ street: String, city: String, isDefault: Boolean }],
  favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
}, { timestamps: true });

export default mongoose.model('User', userSchema);
