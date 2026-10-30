import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name:     String,
  price:    Number,
  quantity: { type: Number, required: true, min: 1 },
  addonFor: String, // set when this line is an add-on for another dish
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items:       [orderItemSchema],
  subtotal:    Number,
  deliveryFee: { type: Number, default: 0 },
  discount:    { type: Number, default: 0 },   // promo discount, cents
  promoCode:   { type: String, index: true },
  pointsRedeemed: { type: Number, default: 0 },  // points used on this order
  pointsDiscount: { type: Number, default: 0 },  // cents taken off for those points
  pointsEarned:   { type: Number, default: 0 },  // points given when paid
  pointsRefunded: { type: Boolean, default: false },
  pointsReversed: { type: Boolean, default: false },
  branch:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  deliveryZone:{ type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryZone' },
  total:       Number,
  status: {
    type: String,
    enum: ['CREATED','PAID','PREPARING','READY','DELIVERING','COMPLETED','CANCELED'],
    default: 'CREATED',
    index: true, // <-- CRITICAL: Speeds up Admin dashboard filtering by 10x
  },
  type:          { type: String, enum: ['delivery','pickup'], default: 'delivery' },
  address:       { street: String, city: String, notes: String },
  paymentMethod: { type: String, enum: ['cod','card','mpesa'], default: 'mpesa' },
  mpesaCheckoutRequestId: { type: String, index: true },
  mpesaReceipt: { type: String },
  statusHistory: [{ status: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true });

// Compound index for fast sorting (recent orders first)
orderSchema.index({ createdAt: -1 });
// Compound index for Admin filtering
orderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
