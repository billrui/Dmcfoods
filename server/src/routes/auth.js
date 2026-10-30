import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerSchema } from '../lib/schemas.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { REFRESH_COOKIE, refreshCookieOptions } from '../lib/cookies.js';
import { logEvent } from '../middleware/activityLogger.js';

const router = express.Router();

export async function issueTokens(req, res, user) {
  const access = signAccessToken(user._id);
  const refresh = signRefreshToken(user._id);
  const refreshHash = crypto.createHash('sha256').update(refresh).digest('hex');

  if (!user.refreshTokens) user.refreshTokens = [];
  user.refreshTokens = user.refreshTokens.filter(t => t.expiresAt > new Date());
  user.refreshTokens.push({
    tokenHash: refreshHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
  });
  if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5);
  await user.save();

  res.cookie(REFRESH_COOKIE, refresh, refreshCookieOptions);
  return access;
}

export function userPayload(u) {
  return { _id: u._id, name: u.name, email: u.email, phone: u.phone, isAdmin: u.isAdmin, isSuperAdmin: !!u.isSuperAdmin, mustChangePassword: !!u.mustChangePassword };
}

// ─── Register (Phone + Password) ───
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) return res.status(400).json({ error: 'Missing fields' });

    // Clean phone (ensure +254)
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
    const fullPhone = `+254${cleaned}`;

    const exists = await User.findOne({ phone: fullPhone });
    if (exists) return res.status(409).json({ error: 'Phone already registered' });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, phone: fullPhone, password: hash });
    const access = await issueTokens(req, res, user);
    res.status(201).json({ token: access, user: userPayload(user) });
  } catch (e) { next(e); }
});

// ─── Login (Phone + Password) ───
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
    const fullPhone = `+254${cleaned}`;

    const user = await User.findOne({ phone: fullPhone }).select('+password');
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      if (user.isAdmin) logEvent(req, user, 'admin-login-failed');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const access = await issueTokens(req, res, user);
    if (user.isAdmin) logEvent(req, user, 'admin-login');
    res.json({ token: access, user: userPayload(user) });
  } catch (e) { next(e); }
});

// ─── Refresh & Logout ───
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub).select('+refreshTokens');
    if (!user) return res.status(401).json({ error: 'Invalid session' });

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const match = user.refreshTokens.find(t => t.tokenHash === hash && t.expiresAt > new Date());
    if (!match) return res.status(401).json({ error: 'Session expired' });

    const access = signAccessToken(user._id);
    res.json({ token: access, user: userPayload(user) });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        const user = await User.findById(payload.sub).select('+refreshTokens');
        if (user) {
          const hash = crypto.createHash('sha256').update(token).digest('hex');
          user.refreshTokens = user.refreshTokens.filter(t => t.tokenHash !== hash);
          await user.save();
        }
      } catch {}
    }
    res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions, maxAge: 0 });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Logout failed' }); }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: userPayload(req.user) });
});

export default router;
