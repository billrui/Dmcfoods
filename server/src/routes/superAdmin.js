// Super admin API  (mounted at /api/super)
//   GET  /report?date=YYYY-MM-DD&days=1|7|30   sales vs M-Pesa money, problems, top items
//   GET  /activity?date=YYYY-MM-DD&type=all|admin|orders|payments
//   GET  /admins                                list admin accounts
//   POST /admins                                create an admin account { name, phone, password? }
//   POST /admins/:id/reset-password             temporary password
//   POST /admins/:id/remove                     remove admin access
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';
import { requireSuperAdmin } from '../middleware/superAdmin.js';
import { objectIdSchema } from '../lib/schemas.js';

const router = express.Router();
router.use(requireSuperAdmin);

const TZ_OFFSET_MIN = 180; // Africa/Nairobi, UTC+3, no daylight saving
const PAID_STATUSES = ['PAID', 'PREPARING', 'READY', 'DELIVERING', 'COMPLETED'];

// ── If admins exist but none is super admin yet, make the oldest admin the super admin ──
async function ensureSuperAdmin() {
  try {
    if (await User.exists({ isSuperAdmin: true })) return;
    const first = await User.findOne({ isAdmin: true }).sort('createdAt');
    if (first) {
      first.isSuperAdmin = true;
      await first.save();
      console.log(`[super] ${first.phone} is now the super admin (oldest admin account).`);
    }
  } catch (e) { console.error('[super] ensureSuperAdmin failed:', e.message); }
}
if (mongoose.connection.readyState === 1) ensureSuperAdmin();
else mongoose.connection.once('open', ensureSuperAdmin);

// ── Helpers ──
function todayLocal() {
  const d = new Date(Date.now() + TZ_OFFSET_MIN * 60000);
  return d.toISOString().slice(0, 10);
}
function dayRange(dateStr, days = 1) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '') ? dateStr : todayLocal();
  const [y, mo, d] = m.split('-').map(Number);
  const end = new Date(Date.UTC(y, mo - 1, d + 1) - TZ_OFFSET_MIN * 60000);
  const start = new Date(end.getTime() - days * 86400000);
  return { start, end, date: m };
}
function localHour(date) {
  return new Date(date.getTime() + TZ_OFFSET_MIN * 60000).getUTCHours();
}
function localDay(date) {
  return new Date(date.getTime() + TZ_OFFSET_MIN * 60000).toISOString().slice(0, 10);
}
function normalisePhone(phone = '') {
  let c = String(phone).replace(/\D/g, '');
  if (c.startsWith('254')) c = c.slice(3);
  if (c.startsWith('0')) c = c.slice(1);
  return c.length === 9 ? `+254${c}` : null;
}
function tempPassword() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(crypto.randomBytes(10), b => alphabet[b % alphabet.length]).join('');
}
const short = (id) => String(id).slice(-6).toUpperCase();

// ════════════════════ DAILY REPORT ════════════════════
router.get('/report', async (req, res, next) => {
  try {
    const days = [1, 7, 30].includes(Number(req.query.days)) ? Number(req.query.days) : 1;
    const { start, end, date } = dayRange(req.query.date, days);

    const orders = await Order.find({ createdAt: { $gte: start, $lt: end } })
      .populate('user', 'name phone').sort('createdAt').lean();
    const orderIds = orders.map(o => o._id);

    const [linkedPayments, periodPayments] = await Promise.all([
      Payment.find({ order: { $in: orderIds } }).lean(),
      Payment.find({ status: 'success', paidAt: { $gte: start, $lt: end } }).lean(),
    ]);
    const payByOrder = {};
    for (const p of linkedPayments) (payByOrder[p.order] ||= []).push(p);

    const paidOrders = orders.filter(o => PAID_STATUSES.includes(o.status));
    const pendingOrders = orders.filter(o => o.status === 'CREATED');
    const canceledOrders = orders.filter(o => o.status === 'CANCELED');

    const sold = paidOrders.reduce((s, o) => s + (o.total || 0), 0);
    let received = 0;
    const problems = [];

    for (const o of orders) {
      const ok = (payByOrder[o._id] || []).filter(p => p.status === 'success');
      const got = ok.reduce((s, p) => s + (p.amountPaid || 0), 0);
      const legacy = !ok.length && o.mpesaReceipt; // paid before payment tracking was installed
      const amount = legacy ? o.total : got;
      received += amount;

      const base = {
        orderId: o._id, ref: short(o._id), customer: o.user?.name || o.user?.phone || 'Customer',
        orderTotal: o.total, paid: amount, status: o.status, at: o.createdAt,
        receipts: legacy ? [o.mpesaReceipt] : ok.map(p => p.receipt).filter(Boolean),
      };

      if (PAID_STATUSES.includes(o.status) && !ok.length && !legacy) {
        problems.push({ ...base, kind: 'no-payment', severity: 'high',
          message: 'Marked as paid, but no M-Pesa payment was received.' });
      } else if (o.status === 'CANCELED' && amount > 0) {
        problems.push({ ...base, kind: 'refund', severity: 'medium',
          message: 'Customer paid, but the order was canceled. A refund may be owed.' });
      } else if (ok.length && got !== o.total) {
        problems.push({ ...base, kind: got < o.total ? 'underpaid' : 'overpaid', severity: 'high',
          message: got < o.total
            ? `Paid Ksh ${(got / 100).toLocaleString()} but the order is Ksh ${(o.total / 100).toLocaleString()}.`
            : `Paid Ksh ${(got / 100).toLocaleString()}, more than the order total.` });
      } else if (ok.length > 1) {
        problems.push({ ...base, kind: 'double', severity: 'medium', message: `${ok.length} M-Pesa payments for one order.` });
      } else if (o.status === 'CREATED' && Date.now() - new Date(o.createdAt) > 30 * 60000) {
        problems.push({ ...base, kind: 'unpaid', severity: 'low', message: 'Order placed but never paid.' });
      }
    }

    // M-Pesa money in this period that isn't linked to an order in this period
    const orderIdSet = new Set(orderIds.map(String));
    const unmatched = periodPayments.filter(p => !p.order || !orderIdSet.has(String(p.order)));
    for (const p of unmatched) received += p.amountPaid || 0;
    for (const p of unmatched.filter(p => !p.order)) {
      problems.push({ kind: 'unmatched', severity: 'medium', ref: p.receipt || '—', customer: p.phone,
        orderTotal: 0, paid: p.amountPaid, at: p.paidAt, receipts: [p.receipt],
        message: 'M-Pesa payment received with no matching order.' });
    }

    // Top items (from paid orders)
    const tally = {};
    for (const o of paidOrders) for (const it of o.items) {
      const t = (tally[it.name] ||= { name: it.name, quantity: 0, revenue: 0, orders: 0 });
      t.quantity += it.quantity; t.revenue += (it.price || 0) * it.quantity; t.orders += 1;
    }
    const topItems = Object.values(tally).sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue);

    // Sales over time: by hour for one day, by day for longer ranges
    let timeline;
    if (days === 1) {
      timeline = Array.from({ length: 24 }, (_, h) => ({ label: `${String(h).padStart(2, '0')}:00`, sales: 0, orders: 0 }));
      for (const o of paidOrders) { const t = timeline[localHour(new Date(o.createdAt))]; t.sales += o.total; t.orders++; }
    } else {
      timeline = Array.from({ length: days }, (_, i) => ({ label: localDay(new Date(start.getTime() + i * 86400000)), sales: 0, orders: 0 }));
      const idx = Object.fromEntries(timeline.map((t, i) => [t.label, i]));
      for (const o of paidOrders) { const t = timeline[idx[localDay(new Date(o.createdAt))]]; if (t) { t.sales += o.total; t.orders++; } }
    }

    const problemTotal = problems.filter(p => p.severity !== 'low').length;
    res.json({
      date, days, from: start, to: end,
      summary: {
        orders: orders.length,
        paidOrders: paidOrders.length,
        pendingOrders: pendingOrders.length,
        canceledOrders: canceledOrders.length,
        sold, received, difference: received - sold,
        averageOrder: paidOrders.length ? Math.round(sold / paidOrders.length) : 0,
        discounts: paidOrders.reduce((s, o) => s + (o.discount || 0) + (o.pointsDiscount || 0), 0),
        promoOrders: paidOrders.filter(o => o.discount > 0 || o.pointsDiscount > 0).length,
        itemsSold: topItems.reduce((s, t) => s + t.quantity, 0),
        failedPayments: linkedPayments.filter(p => p.status === 'failed').length,
        matches: problemTotal === 0 && received === sold,
      },
      problems: problems.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity])),
      topItems: topItems.slice(0, 15),
      timeline,
    });
  } catch (e) { next(e); }
});

// ════════════════════ ACTIVITY LOG ════════════════════
router.get('/activity', async (req, res, next) => {
  try {
    const { start, end, date } = dayRange(req.query.date, 1);
    const type = req.query.type || 'all';
    const events = [];

    if (type === 'all' || type === 'admin') {
      const logs = await AdminLog.find({ createdAt: { $gte: start, $lt: end } })
        .populate('admin', 'name phone isSuperAdmin').sort('-createdAt').limit(1000).lean();
      for (const l of logs) events.push({
        id: l._id, kind: 'admin', at: l.createdAt, action: l.action, target: l.target, details: l.details,
        actor: l.admin?.name || l.admin?.phone || 'Admin', actorPhone: l.admin?.phone, ip: l.ip,
      });
    }
    if (type === 'all' || type === 'orders') {
      const orders = await Order.find({ createdAt: { $gte: start, $lt: end } })
        .populate('user', 'name phone').sort('-createdAt').limit(1000).lean();
      for (const o of orders) events.push({
        id: `o${o._id}`, kind: 'order', at: o.createdAt, action: 'order-placed', target: short(o._id),
        actor: o.user?.name || o.user?.phone || 'Customer', actorPhone: o.user?.phone,
        amount: o.total, details: { items: o.items.map(i => `${i.quantity}× ${i.name}`).join(', '), type: o.type, status: o.status },
      });
    }
    if (type === 'all' || type === 'payments') {
      const pays = await Payment.find({ updatedAt: { $gte: start, $lt: end }, status: { $ne: 'pending' } })
        .sort('-updatedAt').limit(1000).lean();
      for (const p of pays) events.push({
        id: `p${p._id}`, kind: 'payment', at: p.paidAt || p.updatedAt,
        action: p.status === 'success' ? 'payment-received' : 'payment-failed',
        target: p.order ? short(p.order) : undefined, actor: p.phone || 'M-Pesa', amount: p.amountPaid || p.amountRequested,
        details: { receipt: p.receipt, reason: p.status === 'failed' ? p.resultDesc : undefined },
      });
    }

    events.sort((a, b) => new Date(b.at) - new Date(a.at));
    const counts = events.reduce((c, e) => (c[e.kind] = (c[e.kind] || 0) + 1, c), {});
    res.json({ date, counts, events });
  } catch (e) { next(e); }
});

// ════════════════════ ADMIN ACCOUNTS ════════════════════
router.get('/admins', async (_req, res, next) => {
  try {
    const admins = await User.find({ isAdmin: true })
      .select('name phone isSuperAdmin mustChangePassword createdAt').sort('createdAt').lean();
    const last = await AdminLog.aggregate([
      { $match: { admin: { $in: admins.map(a => a._id) } } },
      { $group: { _id: '$admin', lastActive: { $max: '$createdAt' } } },
    ]);
    const map = Object.fromEntries(last.map(l => [String(l._id), l.lastActive]));
    res.json(admins.map(a => ({ ...a, lastActive: map[String(a._id)] || null })));
  } catch (e) { next(e); }
});

router.post('/admins', async (req, res, next) => {
  try {
    const { name, phone, password } = req.body || {};
    const fullPhone = normalisePhone(phone);
    if (!name?.trim()) return res.status(400).json({ error: 'Enter the admin’s name.' });
    if (!fullPhone) return res.status(400).json({ error: 'Enter a valid Kenyan phone number.' });
    if (password && password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    let user = await User.findOne({ phone: fullPhone }).select('+password +refreshTokens');
    if (user?.isAdmin) return res.status(409).json({ error: 'That phone number is already an admin.' });

    const pw = password || tempPassword();
    if (!user) user = new User({ phone: fullPhone });
    user.name = name.trim();
    user.isAdmin = true;
    user.isSuperAdmin = false;
    user.password = await bcrypt.hash(pw, 12);
    user.mustChangePassword = true;
    user.refreshTokens = [];
    await user.save();
    res.status(201).json({ _id: user._id, name: user.name, phone: user.phone, tempPassword: pw });
  } catch (e) { next(e); }
});

router.post('/admins/:id/reset-password', async (req, res, next) => {
  try {
    if (!objectIdSchema.safeParse(req.params.id).success) return res.status(400).json({ error: 'Invalid ID' });
    if (req.params.id === String(req.user._id)) return res.status(400).json({ error: 'Use “Change password” for your own account.' });
    const user = await User.findById(req.params.id).select('+password +refreshTokens');
    if (!user) return res.status(404).json({ error: 'Not found' });
    const pw = tempPassword();
    user.password = await bcrypt.hash(pw, 12);
    user.mustChangePassword = true;
    user.refreshTokens = [];
    await user.save();
    res.json({ ok: true, tempPassword: pw });
  } catch (e) { next(e); }
});

router.post('/admins/:id/remove', async (req, res, next) => {
  try {
    if (!objectIdSchema.safeParse(req.params.id).success) return res.status(400).json({ error: 'Invalid ID' });
    if (req.params.id === String(req.user._id)) return res.status(400).json({ error: 'You cannot remove yourself.' });
    const user = await User.findById(req.params.id).select('+refreshTokens');
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (user.isSuperAdmin) return res.status(400).json({ error: 'The super admin cannot be removed here.' });
    user.isAdmin = false;
    user.refreshTokens = []; // signs them out
    await user.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
