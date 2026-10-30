import mongoose from 'mongoose';

// Simple key → value store for shop-wide settings (e.g. "loyalty")
const settingSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model('Setting', settingSchema);
