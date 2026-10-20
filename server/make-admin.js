// Usage: node make-admin.js +254712345678
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const phone = process.argv[2];
if (!phone) {
  console.error('Usage: node make-admin.js +254712345678');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
const user = await User.findOneAndUpdate(
  { phone },
  { isAdmin: true },
  { new: true },
);
if (!user) {
  console.error('No user with phone', phone);
} else {
  console.log(`✅ ${user.name || user.phone} is now admin.`);
}
await mongoose.disconnect();
