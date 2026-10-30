import mongoose from 'mongoose';

const menuCollectionSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g. "Today's Offers", "Chef's Special"
  slug: { type: String, required: true, unique: true }, // e.g. "todays-offers"
  type: { type: String, enum: ['horizontal', 'grid', 'list'], default: 'horizontal' },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('MenuCollection', menuCollectionSchema);
