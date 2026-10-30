import mongoose from 'mongoose';

// One document per M-Pesa STK push. Amounts are stored in cents, like Order.total.
const paymentSchema = new mongoose.Schema({
  order:             { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
  method:            { type: String, default: 'mpesa' },
  checkoutRequestId: { type: String, index: true },
  phone:             String,
  amountRequested:   Number,
  amountPaid:        { type: Number, default: 0 },
  receipt:           { type: String, index: true },
  status:            { type: String, enum: ['pending', 'success', 'failed'], default: 'pending', index: true },
  resultDesc:        String,
  paidAt:            Date,
  transactionDate:   String,   // as sent by M-Pesa, e.g. 20261029191530
  raw:               { type: mongoose.Schema.Types.Mixed, select: false },
}, { timestamps: true });

paymentSchema.index({ createdAt: -1 });

export default mongoose.model('Payment', paymentSchema);
