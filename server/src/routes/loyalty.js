// Customer:  GET /api/loyalty/me        balance, progress, history (no rules)
// Admin:     GET/PUT /api/loyalty/admin/settings, GET /api/loyalty/admin/members, POST /api/loyalty/admin/adjust
import express from 'express';
import User from '../models/User.js';
import PointsTransaction from '../models/PointsTransaction.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { getLoyaltySettings, saveLoyaltySettings, adjustPoints } from '../lib/loyalty.js';

const router = express.Router();

// Customers only see their own balance and progress — never the earning/redeeming rules.
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const s = await getLoyaltySettings();
    const user = await User.findById(req.user._id).select('points');
    const points = user?.points || 0;
    const canRedeem = s.enabled && points > 0 && points >= s.minRedeem;
    const history = await PointsTransaction.find({ user: req.user._id }).sort('-createdAt').limit(50)
      .select('type points note createdAt').lean();
    res.json({
      enabled: s.enabled, points, canRedeem,
      progress: s.minRedeem > 0 ? Math.min(100, Math.round(points / s.minRedeem * 100)) : 100,
      value: canRedeem ? points * s.pointValue : undefined, // shown only when they can use it
      history,
    });
  } catch (e) { next(e); }
});

router.get('/admin/settings', requireAdmin, async (_req, res, next) => {
  try { res.json(await getLoyaltySettings()); } catch (e) { next(e); }
});

router.put('/admin/settings', requireAdmin, async (req, res, next) => {
  try { res.json(await saveLoyaltySettings(req.body || {})); } catch (e) { next(e); }
});

router.get('/admin/members', requireAdmin, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const filter = { points: { $gt: 0 } };
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      Object.assign(filter, { $or: [{ name: rx }, { phone: rx }] });
      delete filter.points;
    }
    const members = await User.find(filter).select('name phone points').sort('-points').limit(100).lean();
    const [agg] = await User.aggregate([{ $group: { _id: null, total: { $sum: '$points' }, members: { $sum: { $cond: [{ $gt: ['$points', 0] }, 1, 0] } } } }]);
    res.json({ members, totalPoints: agg?.total || 0, memberCount: agg?.members || 0 });
  } catch (e) { next(e); }
});

router.post('/admin/adjust', requireAdmin, async (req, res, next) => {
  try {
    const { userId, points, note } = req.body || {};
    const n = Math.round(Number(points));
    if (!/^[a-f0-9]{24}$/i.test(String(userId || ''))) return res.status(400).json({ error: 'Choose a customer.' });
    if (!n) return res.status(400).json({ error: 'Enter points to add (e.g. 50) or remove (e.g. -50).' });
    const user = await User.findById(userId).select('points');
    if (!user) return res.status(404).json({ error: 'Customer not found' });
    if ((user.points || 0) + n < 0) return res.status(400).json({ error: `They only have ${user.points || 0} points.` });
    const balance = await adjustPoints(userId, n, String(note || '').slice(0, 200), req.user._id);
    res.json({ ok: true, balance });
  } catch (e) { next(e); }
});

export default router;
