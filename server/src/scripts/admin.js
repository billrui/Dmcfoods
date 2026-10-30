// Terminal admin tool (run on the server):
//   npm run admin -- list
//   npm run admin -- create  0712345678 "Full Name" [password]
//   npm run admin -- reset   0712345678 [newPassword]
//   npm run admin -- promote 0712345678
//   npm run admin -- demote  0712345678
//   npm run admin -- super   0712345678   (make this admin the super admin)
// If a password is omitted a strong temporary one is generated and printed;
// the admin will be asked to change it on first sign-in.
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';

const [cmd, phoneArg, a3, a4] = process.argv.slice(2);

function phone(p = '') {
  let c = String(p).replace(/\D/g, '');
  if (c.startsWith('254')) c = c.slice(3);
  if (c.startsWith('0')) c = c.slice(1);
  if (c.length !== 9) { console.error('Invalid phone number:', p); process.exit(1); }
  return `+254${c}`;
}
const tempPw = () => crypto.randomBytes(9).toString('base64url');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  switch (cmd) {
    case 'list': {
      const admins = await User.find({ isAdmin: true }).select('name phone isSuperAdmin createdAt');
      if (!admins.length) console.log('No admins yet.');
      admins.forEach(a => console.log(`${a.phone}  ${a.name || '-'}${a.isSuperAdmin ? '  [SUPER ADMIN]' : ''}`));
      break;
    }
    case 'create': {
      const p = phone(phoneArg);
      const name = a3 || 'Admin';
      const pw = a4 || tempPw();
      let u = await User.findOne({ phone: p }).select('+password +refreshTokens');
      if (!u) u = new User({ phone: p });
      const noSuper = !(await User.exists({ isSuperAdmin: true }));
      Object.assign(u, { name, isAdmin: true, isSuperAdmin: u.isSuperAdmin || noSuper, password: await bcrypt.hash(pw, 12), mustChangePassword: !a4, refreshTokens: [] });
      await u.save();
      console.log(`✅ Admin ready: ${p}\n   Password: ${pw}${a4 ? '' : '  (temporary — must be changed at first sign-in)'}`);
      break;
    }
    case 'reset': {
      const p = phone(phoneArg);
      const u = await User.findOne({ phone: p }).select('+password +refreshTokens');
      if (!u) { console.error('No user with phone', p); process.exit(1); }
      const pw = a3 || tempPw();
      Object.assign(u, { password: await bcrypt.hash(pw, 12), mustChangePassword: !a3, refreshTokens: [] });
      await u.save();
      console.log(`✅ Password reset for ${p}\n   Password: ${pw}${a3 ? '' : '  (temporary)'}`);
      break;
    }
    case 'super': {
      const p = phone(phoneArg);
      const u = await User.findOne({ phone: p });
      if (!u) { console.error('No user with phone', p); process.exit(1); }
      await User.updateMany({ isSuperAdmin: true }, { isSuperAdmin: false });
      u.isAdmin = true; u.isSuperAdmin = true; await u.save();
      console.log(`✅ ${p} is now the super admin`);
      break;
    }
    case 'promote':
    case 'demote': {
      const p = phone(phoneArg);
      const u = await User.findOneAndUpdate({ phone: p }, { isAdmin: cmd === 'promote' }, { new: true });
      if (!u) { console.error('No user with phone', p); process.exit(1); }
      console.log(`✅ ${p} is ${u.isAdmin ? 'now an admin' : 'no longer an admin'}`);
      break;
    }
    default:
      console.log('Usage: npm run admin -- list | create <phone> "<name>" [password] | reset <phone> [password] | promote <phone> | demote <phone>');
  }
  await mongoose.disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
