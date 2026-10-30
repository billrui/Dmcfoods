import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  openTime: { type: String, default: '08:00' },  // 24-hour format
  closeTime: { type: String, default: '22:00' }, // 24-hour format
  isOpen: { type: Boolean, default: true },      // Accepting orders (untick to close right now)
  closedDays: { type: [Number], default: [] },   // 0 = Sunday … 6 = Saturday
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Branch', branchSchema);
