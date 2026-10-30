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
  addons:      [addonSchema], // old typed-in extras (still supported)
  addonItems:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }], // add-ons that are real menu items
  addonOnly:   { type: Boolean, default: false }, // only sold as an extra, hidden from the menu
}, { timestamps: true });

menuItemSchema.index({ name: 'text' });

// When addonItems are populated, list them in `addons` so the shop shows them as choices
menuItemSchema.set('toJSON', {
  transform(_doc, ret) {
    if (Array.isArray(ret.addonItems) && ret.addonItems.some(a => a && a.name)) {
      const linked = ret.addonItems.filter(a => a && a.name && a.isAvailable !== false)
        .map(a => ({ _id: a._id, name: a.name, price: a.price - (a.discount || 0), menuItem: a._id }));
      ret.addons = [...(ret.addons || []), ...linked];
      ret.addonItems = ret.addonItems.map(a => a?._id || a);
    }
    return ret;
  },
});

export default mongoose.model('MenuItem', menuItemSchema);
