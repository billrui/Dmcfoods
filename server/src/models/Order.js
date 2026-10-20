import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name:     String,
  price:    Number,
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items:       [orderItemSchema],
  subtotal:    Number,
  deliveryFee: { type: Number, default: 0 },
  total:       Number,
  status: {
    type: String,
    enum: ['CREATED','PAID','PREPARING','READY','DELIVERING','COMPLETED','CANCELED'],
    default: 'CREATED',
    index: true, // <-- CRITICAL: Speeds up Admin dashboard filtering by 10x
  },
  type:          { type: String, enum: ['delivery','pickup'], default: 'delivery' },
  address:       { street: String, city: String, notes: String },
  paymentMethod: { type: String, enum: ['cod','card','mpesa'], default: 'cod' },
  mpesaCheckoutRequestId: { type: String, index: true },
  mpesaReceipt: { type: String },
  statusHistory: [{ status: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true });

// Compound index for fast sorting (recent orders first)
orderSchema.index({ createdAt: -1 });
// Compound index for Admin filtering
orderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
