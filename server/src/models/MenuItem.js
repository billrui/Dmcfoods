import mongoose from 'mongoose';

const addonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

const menuItemSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  price:       { type: Number, required: true },
  image:       String,
  description: String,
  isAvailable: { type: Boolean, default: true },
  isPopular:   { type: Boolean, default: false, index: true },
  isLatest:    { type: Boolean, default: false },
  discount:    { type: Number, default: 0 },
  addons:      [addonSchema],
}, { timestamps: true });

menuItemSchema.index({ name: 'text' });

export default mongoose.model('MenuItem', menuItemSchema);
