import mongoose from 'mongoose';

const deliveryZoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fee: { type: Number, required: true }, // Stored in cents (e.g. 15000 = Ksh150)
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('DeliveryZone', deliveryZoneSchema);
