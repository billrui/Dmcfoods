import Setting from '../models/Setting.js';
import User from '../models/User.js';
import PointsTransaction from '../models/PointsTransaction.js';

export const DEFAULTS = {
  enabled: true,
  earnPerKsh: 10,      // 1 point for every Ksh 10 spent on food
  pointValue: 50,      // each point is worth 50 cents (Ksh 0.50)
  minRedeem: 500,      // need at least this many points before redeeming
};

export async function getLoyaltySettings() {
  const doc = await Setting.findOne({ key: 'loyalty' }).lean();
  return { ...DEFAULTS, ...(doc?.value || {}) };
}

export async function saveLoyaltySettings(input) {
  const cur = await getLoyaltySettings();
  const num = (v, min, max, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };
  const value = {
    enabled: input.enabled !== undefined ? !!input.enabled : cur.enabled,
    earnPerKsh: num(input.earnPerKsh, 1, 100000, cur.earnPerKsh),
    pointValue: Math.round(num(input.pointValue, 1, 100000, cur.pointValue)),
    minRedeem: Math.round(num(input.minRedeem, 0, 10000000, cur.minRedeem)),
  };
  await Setting.updateOne({ key: 'loyalty' }, { $set: { value } }, { upsert: true });
  return value;
}

// Points earned for a food amount (cents)
export const pointsFor = (foodCents, s) => Math.floor(foodCents / 100 / s.earnPerKsh);

async function change(userId, points, type, { order, note, by } = {}) {
  const u = await User.findByIdAndUpdate(userId, { $inc: { points } }, { new: true }).select('points');
  await PointsTransaction.create({ user: userId, order, type, points, balance: u?.points, note, by });
  return u?.points ?? 0;
}

// Take points off the balance for a new order. Returns { points, discount } (discount in cents).
// Only succeeds if the customer really has the points (atomic).
export async function reservePoints(userId, foodCents, s) {
  if (!s.enabled) return { points: 0, discount: 0 };
  const user = await User.findById(userId).select('points');
  const balance = user?.points || 0;
  if (balance < s.minRedeem || balance <= 0) return { points: 0, discount: 0 };
  const maxByBill = Math.floor(foodCents / s.pointValue);
  const points = Math.min(balance, maxByBill);
  if (points <= 0) return { points: 0, discount: 0 };
  const ok = await User.findOneAndUpdate({ _id: userId, points: { $gte: points } }, { $inc: { points: -points } }, { new: true }).select('points');
  if (!ok) return { points: 0, discount: 0 };
  return { points, discount: points * s.pointValue, balanceAfter: ok.points };
}

export async function logRedeem(userId, order, points, balanceAfter) {
  await PointsTransaction.create({ user: userId, order: order._id, type: 'redeem', points: -points, balance: balanceAfter,
    note: `Used on order #${String(order._id).slice(-6).toUpperCase()}` });
}

// Payment confirmed → give points (once)
export async function awardForOrder(order) {
  try {
    if (order.pointsEarned > 0) return;
    const s = await getLoyaltySettings();
    if (!s.enabled) return;
    const food = (order.subtotal || 0) - (order.discount || 0) - (order.pointsDiscount || 0);
    const pts = pointsFor(Math.max(0, food), s);
    if (pts <= 0) return;
    order.pointsEarned = pts;
    await order.save();
    await change(order.user, pts, 'earn', { order: order._id, note: `Order #${String(order._id).slice(-6).toUpperCase()}` });
  } catch (e) { console.error('[loyalty] award failed:', e.message); }
}

// Payment failed or order canceled → give back used points, take back earned points
export async function undoForOrder(order, reason = 'Order canceled') {
  try {
    const ref = `#${String(order._id).slice(-6).toUpperCase()}`;
    if (order.pointsRedeemed > 0 && !order.pointsRefunded) {
      order.pointsRefunded = true;
      await order.save();
      await change(order.user, order.pointsRedeemed, 'refund', { order: order._id, note: `${reason} ${ref} — points returned` });
    }
    if (order.pointsEarned > 0 && !order.pointsReversed) {
      order.pointsReversed = true;
      await order.save();
      await change(order.user, -order.pointsEarned, 'reverse', { order: order._id, note: `${reason} ${ref} — earned points removed` });
    }
  } catch (e) { console.error('[loyalty] undo failed:', e.message); }
}

export async function adjustPoints(userId, points, note, adminId) {
  return change(userId, Math.round(points), 'adjust', { note: note || 'Manual adjustment', by: adminId });
}
