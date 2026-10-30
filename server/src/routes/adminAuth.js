// Admin account setup & recovery
//   GET  /api/auth/admin/status           -> { needsSetup }
//   POST /api/auth/admin/setup            -> create the FIRST admin (only works while no admin exists)
//   POST /api/auth/admin/change-password  -> logged-in user changes own password
import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { issueTokens, userPayload } from './auth.js';
import { logEvent } from '../middleware/activityLogger.js';

const router = express.Router();
const MIN_PW = 8;

function normalisePhone(phone = '') {
  let c = String(phone).replace(/\D/g, '');
  if (c.startsWith('254')) c = c.slice(3);
  if (c.startsWith('0')) c = c.slice(1);
  return c.length === 9 ? `+254${c}` : null;
}

function badPassword(pw) {
  if (typeof pw !== 'string' || pw.length < MIN_PW) return `Password must be at least ${MIN_PW} characters.`;
  if (pw.length > 128) return 'Password is too long.';
  return null;
}

router.get('/status', async (_req, res, next) => {
  try {
    const admins = await User.countDocuments({ isAdmin: true });
    res.json({ needsSetup: admins === 0 });
  } catch (e) { next(e); }
});

router.post('/setup', authLimiter, async (req, res, next) => {
  try {
    if (await User.exists({ isAdmin: true }))
      return res.status(409).json({ error: 'An admin already exists. Please sign in instead.' });
    const { name, phone, password } = req.body || {};
    const fullPhone = normalisePhone(phone);
    if (!fullPhone) return res.status(400).json({ error: 'Enter a valid Kenyan phone number.' });
    if (!name?.trim()) return res.status(400).json({ error: 'Enter your name.' });
    const pwErr = badPassword(password);
    if (pwErr) return res.status(400).json({ error: pwErr });

    const hash = await bcrypt.hash(password, 12);
    let user = await User.findOne({ phone: fullPhone }).select('+password +refreshTokens');
    if (user) {
      // Existing customer account becomes the first admin
      user.name = name.trim();
      user.password = hash;
      user.isAdmin = true;
      user.isSuperAdmin = true;
      user.mustChangePassword = false;
      user.refreshTokens = [];
    } else {
      user = new User({ name: name.trim(), phone: fullPhone, password: hash, isAdmin: true, isSuperAdmin: true });
    }
    const access = await issueTokens(req, res, user);
    console.log(`[admin] first admin created: ${fullPhone}`);
    logEvent(req, user, 'admin-setup');
    res.status(201).json({ token: access, user: userPayload(user) });
  } catch (e) { next(e); }
});

router.post('/change-password', authLimiter, requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const user = await User.findById(req.user._id).select('+password +refreshTokens');
    if (!user?.password || !(await bcrypt.compare(currentPassword || '', user.password)))
      return res.status(400).json({ error: 'Current password is incorrect.' });
    const pwErr = badPassword(newPassword);
    if (pwErr) return res.status(400).json({ error: pwErr });
    if (await bcrypt.compare(newPassword, user.password))
      return res.status(400).json({ error: 'New password must be different.' });

    user.password = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    user.refreshTokens = [];
    const access = await issueTokens(req, res, user);
    if (user.isAdmin) logEvent(req, user, 'password-changed');
    res.json({ token: access, user: userPayload(user) });
  } catch (e) { next(e); }
});

export default router;
