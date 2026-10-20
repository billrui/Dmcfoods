import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema({
  admin:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:  { type: String, required: true },
  target:  { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ip:      { type: String },
  userAgent: { type: String },
}, { timestamps: true });

adminLogSchema.index({ admin: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model('AdminLog', adminLogSchema);
