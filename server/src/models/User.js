import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true, select: false },
  phone:    String,
  addresses: [{ street: String, city: String, isDefault: Boolean }],
  favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
}, { timestamps: true });

export default mongoose.model('User', userSchema);
