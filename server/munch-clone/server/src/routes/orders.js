import express from 'express';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { items, address, paymentMethod, type } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'No items' });

    const ids = items.map(i => i.menuItem);
    const dbItems = await MenuItem.find({ _id: { $in: ids } });

    const lineItems = items.map(clientItem => {
      const dbItem = dbItems.find(d => d._id.toString() === clientItem.menuItem);
      if (!dbItem) throw Object.assign(new Error('Invalid item'), { status: 400 });
      const unitPrice = dbItem.price - (dbItem.discount || 0);
      return {
        menuItem: dbItem._id,
        name:     dbItem.name,
        price:    unitPrice,
        quantity: clientItem.quantity,
      };
    });

    const subtotal    = lineItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee = type === 'delivery' ? 15000 : 0;
    const total       = subtotal + deliveryFee;

    const order = await Order.create({
      user: req.user._id,
      items: lineItems,
      subtotal, deliveryFee, total,
      address, paymentMethod, type,
      statusHistory: [{ status: 'CREATED' }],
    });

    res.status(201).json(order);
  } catch (e) { next(e); }
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
