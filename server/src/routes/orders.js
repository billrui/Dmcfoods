import express from 'express';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import { requireAuth } from '../middleware/auth.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';
import DeliveryZone from '../models/DeliveryZone.js';
import { branchStatus } from '../lib/hours.js';
import { checkPromo } from '../lib/promo.js';
import { getLoyaltySettings, reservePoints, logRedeem } from '../lib/loyalty.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { items, address, type, branch: branchId, zoneId, promoCode, usePoints } = req.body;
    const paymentMethod = 'mpesa';
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'No items' });

    // Every price comes from the database, never from the browser.
    // Add-ons are real menu items: each one becomes its own line on the order.
    const ids = new Set();
    for (const i of items) {
      ids.add(String(i.menuItem));
      for (const a of (Array.isArray(i.addons) ? i.addons : [])) ids.add(String(a));
    }
    const dbItems = await MenuItem.find({ _id: { $in: [...ids].filter(id => /^[a-f0-9]{24}$/i.test(id)) } });
    const byId = Object.fromEntries(dbItems.map(d => [String(d._id), d]));
    const bad = (m) => Object.assign(new Error(m), { status: 400 });
    const price = (d) => d.price - (d.discount || 0);

    const lineItems = [];
    for (const clientItem of items) {
      const dbItem = byId[String(clientItem.menuItem)];
      const qty = Math.max(1, Math.min(50, parseInt(clientItem.quantity) || 1));
      if (!dbItem) throw bad('An item in your cart is no longer on the menu. Please remove it and try again.');
      if (dbItem.isAvailable === false) throw bad(`${dbItem.name} is out of stock. Please remove it from your cart.`);
      lineItems.push({ menuItem: dbItem._id, name: dbItem.name, price: price(dbItem), quantity: qty });

      for (const addonId of (Array.isArray(clientItem.addons) ? clientItem.addons : [])) {
        const aid = String(addonId);
        const linked = (dbItem.addonItems || []).some(x => String(x) === aid) ? byId[aid] : null;
        if (linked) {
          if (linked.isAvailable === false) throw bad(`${linked.name} (extra for ${dbItem.name}) is out of stock.`);
          lineItems.push({ menuItem: linked._id, name: linked.name, price: price(linked), quantity: qty, addonFor: dbItem.name });
          continue;
        }
        const legacy = (dbItem.addons || []).find(x => String(x._id) === aid); // old-style extra typed on the item
        if (legacy) {
          lineItems.push({ menuItem: dbItem._id, name: legacy.name, price: legacy.price, quantity: qty, addonFor: dbItem.name });
          continue;
        }
        throw bad(`An extra for ${dbItem.name} is no longer available. Please remove it from your cart and add it again.`);
      }
    }

    const subtotal = lineItems.reduce((s, i) => s + i.price * i.quantity, 0);

    // ── Branch must be open (Kenya time) ──
    let branch = null;
    if (branchId && /^[a-f0-9]{24}$/i.test(String(branchId))) branch = await Branch.findById(branchId);
    if (!branch) branch = await Branch.findOne({ isDefault: true }) || await Branch.findOne().sort('createdAt');
    if (branch) {
      const st = branchStatus(branch);
      if (!st.open) return res.status(400).json({ error: `${branch.name} is closed right now. ${st.text.replace(/^Closed( · )?/, '').replace(/^./, c => c.toUpperCase())}`.trim() });
    }

    // ── Delivery fee from the chosen zone ──
    let deliveryFee = 0, zone = null;
    if (type === 'delivery') {
      if (zoneId && /^[a-f0-9]{24}$/i.test(String(zoneId))) zone = await DeliveryZone.findOne({ _id: zoneId, isActive: { $ne: false } });
      if (!zone && await DeliveryZone.exists({ isActive: { $ne: false } }))
        return res.status(400).json({ error: 'Please choose your delivery area.' });
      deliveryFee = zone ? zone.fee : 0;
    }

    // ── Promo code ──
    let discount = 0, promoUsed;
    if (promoCode) {
      const { promo, discount: d } = await checkPromo(promoCode, subtotal, req.user._id);
      discount = d; promoUsed = promo.code;
    }

    // ── Loyalty points (taken off the food; M-Pesa needs at least Ksh 1 to pay) ──
    let pointsRedeemed = 0, pointsDiscount = 0, pointsBalance;
    if (usePoints) {
      const ls = await getLoyaltySettings();
      const room = Math.max(0, Math.min(subtotal - discount, subtotal - discount + deliveryFee - 100));
      const r = await reservePoints(req.user._id, room, ls);
      pointsRedeemed = r.points; pointsDiscount = r.discount; pointsBalance = r.balanceAfter;
    }

    const total = subtotal - discount - pointsDiscount + deliveryFee;

    let order;
    try {
      order = await Order.create({
      user: req.user._id,
      items: lineItems,
      subtotal, discount, promoCode: promoUsed, deliveryFee, total,
      pointsRedeemed, pointsDiscount,
      branch: branch?._id, deliveryZone: zone?._id,
      address, paymentMethod, type,
      statusHistory: [{ status: 'CREATED' }],
      });
    } catch (err) {
      if (pointsRedeemed) await User.findByIdAndUpdate(req.user._id, { $inc: { points: pointsRedeemed } }); // give them back
      throw err;
    }
    if (pointsRedeemed) await logRedeem(req.user._id, order, pointsRedeemed, pointsBalance);

    res.status(201).json(order);
  } catch (e) { e.status === 400 ? res.status(400).json({ error: e.message }) : next(e); }
});

router.get('/my', requireAuth, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json(orders);
});

router.get('/:id', requireAuth, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});

export default router;
