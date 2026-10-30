import PromoCode from '../models/PromoCode.js';
import Order from '../models/Order.js';

const PAID = ['PAID', 'PREPARING', 'READY', 'DELIVERING', 'COMPLETED'];
const TZ_OFFSET_MS = 3 * 3600000; // Kenya time
const ksh = (c) => `Ksh ${Math.round(c / 100).toLocaleString('en-KE')}`;

// How loyal is this customer? (only paid orders count)
export async function customerStats(userId, promo) {
  const now = Date.now();
  const winDays = promo.loyalWindowDays || 7;
  const spendDays = promo.bigSpendWindowDays || 30;
  // start of the day (Kenya time) winDays-1 days ago, so "last 7 days" includes today
  const todayStart = Math.floor((now + TZ_OFFSET_MS) / 86400000) * 86400000 - TZ_OFFSET_MS;
  const daysFrom = new Date(todayStart - (winDays - 1) * 86400000);
  const spendFrom = new Date(now - spendDays * 86400000);
  const from = daysFrom < spendFrom ? daysFrom : spendFrom;

  const orders = await Order.find({ user: userId, status: { $in: PAID }, createdAt: { $gte: from } })
    .select('createdAt total').lean();
  const days = new Set(orders.filter(o => o.createdAt >= daysFrom)
    .map(o => new Date(o.createdAt.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10)));
  const spent = orders.filter(o => o.createdAt >= spendFrom).reduce((s, o) => s + (o.total || 0), 0);
  return { daysOrdered: days.size, spent };
}

// Checks a promo code against an order subtotal (cents). Throws { status: 400 } with a clear message.
// Returns { promo, discount } with discount in cents.
export async function checkPromo(code, subtotal, userId) {
  const bad = (m) => Object.assign(new Error(m), { status: 400 });
  const clean = String(code || '').trim().toUpperCase();
  if (!clean) throw bad('Enter a promo code.');
  const promo = await PromoCode.findOne({ code: clean });
  if (!promo || !promo.isActive) throw bad('That promo code is not valid.');
  if (promo.expiresAt && promo.expiresAt < new Date()) throw bad('That promo code has expired.');
  if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) throw bad('That promo code has been fully used.');
  if (subtotal < (promo.minOrderValue || 0))
    throw bad(`Spend at least ${ksh(promo.minOrderValue)} to use ${clean}.`);

  if (promo.eligibility === 'loyal') {
    if (!userId) throw bad(`Sign in to use ${clean}. It's for our regular customers.`);
    const needDays = promo.loyalDays || 5, winDays = promo.loyalWindowDays || 7;
    const needSpend = promo.bigSpendAmount || 1000000, spendDays = promo.bigSpendWindowDays || 30;
    const { daysOrdered, spent } = await customerStats(userId, promo);
    const regular = daysOrdered >= needDays;
    const bigSpender = spent >= needSpend;
    if (!regular && !bigSpender) {
      throw bad(`${clean} is for our loyal customers: order on ${needDays} of the last ${winDays} days `
        + `(you have ${daysOrdered}), or spend ${ksh(needSpend)} in ${spendDays} days (you've spent ${ksh(spent)}).`);
    }
  }

  if (promo.onePerCustomer && userId &&
      await Order.exists({ user: userId, promoCode: clean, status: { $in: PAID } }))
    throw bad('You have already used this promo code.');

  let discount = promo.discountType === 'percentage'
    ? Math.round(subtotal * Math.min(100, Math.max(0, promo.discountValue)) / 100)
    : Math.round(promo.discountValue);
  discount = Math.max(0, Math.min(discount, subtotal));
  return { promo, discount };
}
