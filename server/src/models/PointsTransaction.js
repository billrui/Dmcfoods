import mongoose from 'mongoose';

// Every change to a customer's points balance
const pointsTxSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  order:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  type:    { type: String, enum: ['earn', 'redeem', 'refund', 'reverse', 'adjust'], required: true },
  points:  { type: Number, required: true },  // + added, − removed
  balance: Number,                             // balance after this change
  note:    String,
  by:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin, for manual adjustments
}, { timestamps: true });

pointsTxSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('PointsTransaction', pointsTxSchema);
