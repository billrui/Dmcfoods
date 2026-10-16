import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price:       { type: Number, required: true },
  image:       String,
  description: String,
  isAvailable: { type: Boolean, default: true },
  isPopular:   { type: Boolean, default: false },
  isLatest:    { type: Boolean, default: false },
  discount:    { type: Number, default: 0 },
}, { timestamps: true });

menuItemSchema.index({ name: 'text' });

export default mongoose.model('MenuItem', menuItemSchema);
