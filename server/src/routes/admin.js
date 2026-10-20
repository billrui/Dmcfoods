import express from 'express';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';
import { requireAdmin } from '../middleware/admin.js';
import { adminLimiter } from '../middleware/rateLimit.js';
import { logAdminAction } from '../middleware/adminLogger.js';
import { objectIdSchema } from '../lib/schemas.js';

const router = express.Router();

router.use(adminLimiter);
router.use(requireAdmin);

const STATUS_FLOW = ['CREATED','PAID','PREPARING','READY','DELIVERING','COMPLETED'];

router.get('/orders', async (req, res, next) => {
  try {
    const { status } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = Math.max(parseInt(req.query.skip) || 0, 0);

    const filter = {};
    if (status && status !== 'ALL') {
      if (!STATUS_FLOW.concat(['CANCELED']).includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).populate('user', 'name phone email').sort('-createdAt').skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, total });
  } catch (e) { next(e); }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    if (!objectIdSchema.safeParse(req.params.id).success) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const order = await Order.findById(req.params.id).populate('user', 'name phone email');
    if (!order) return res.status(404).json({ error: 'Not found' });
    res.json(order);
  } catch (e) { next(e); }
});

router.post('/orders/:id/advance', logAdminAction('advance-order'), async (req, res, next) => {
  try {
    if (!objectIdSchema.safeParse(req.params.id).success) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });

    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) {
      return res.status(400).json({ error: 'Already at final status' });
    }

    const next = STATUS_FLOW[idx + 1];
    order.status = next;
    order.statusHistory.push({ status: next, at: new Date() });
    await order.save();

    res.json(order);
  } catch (e) { next(e); }
});

router.post('/orders/:id/cancel', logAdminAction('cancel-order'), async (req, res, next) => {
  try {
    if (!objectIdSchema.safeParse(req.params.id).success) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (order.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel completed order' });
    }

    order.status = 'CANCELED';
    order.statusHistory.push({ status: 'CANCELED', at: new Date() });
    await order.save();
    res.json(order);
  } catch (e) { next(e); }
});

router.get('/stats', async (_req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todayOrders, allOrders, usersCount] = await Promise.all([
      Order.find({ createdAt: { $gte: startOfDay } }),
      Order.find({}),
      User.countDocuments({}),
    ]);

    const sum = (orders) => orders
      .filter(o => o.status !== 'CANCELED')
      .reduce((s, o) => s + (o.total || 0), 0);

    const itemTally = {};
    for (const o of allOrders) {
      if (o.status === 'CANCELED') continue;
      for (const it of o.items) {
        itemTally[it.name] = (itemTally[it.name] || 0) + it.quantity;
      }
    }
    const topItems = Object.entries(itemTally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({
      today: {
        orders: todayOrders.length,
        revenue: sum(todayOrders),
        pending: todayOrders.filter(o => ['CREATED','PAID'].includes(o.status)).length,
        active: todayOrders.filter(o => ['PREPARING','READY','DELIVERING'].includes(o.status)).length,
      },
      allTime: { orders: allOrders.length, revenue: sum(allOrders), users: usersCount },
      topItems,
    });
  } catch (e) { next(e); }
});

router.get('/users', async (_req, res, next) => {
  try {
    const users = await User.find({}).select('name email phone isAdmin createdAt').sort('-createdAt');
    res.json(users);
  } catch (e) { next(e); }
});

router.post('/users/:id/toggle-admin', logAdminAction('toggle-admin', (req) => req.params.id), async (req, res, next) => {
  try {
    if (!objectIdSchema.safeParse(req.params.id).success) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot change your own admin status' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    user.isAdmin = !user.isAdmin;
    await user.save();
    res.json({ _id: user._id, isAdmin: user.isAdmin });
  } catch (e) { next(e); }
});

router.get('/logs', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const logs = await AdminLog.find({}).populate('admin', 'name phone').sort('-createdAt').limit(limit);
    res.json(logs);
  } catch (e) { next(e); }
});


// ─── Menu Management ───
router.post('/menu/:id/toggle', requireAdmin, async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json(item);
  } catch (e) { next(e); }
});

router.post('/menu/:id/price', requireAdmin, async (req, res, next) => {
  try {
    const { price } = req.body;
    if (typeof price !== 'number') return res.status(400).json({ error: 'Invalid price' });
    const item = await MenuItem.findByIdAndUpdate(req.params.id, { price }, { new: true });
    res.json(item);
  } catch (e) { next(e); }
});

// ─── User Management (Ban / Unban) ───
router.post('/users/:id/ban', requireAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (user.isAdmin) return res.status(400).json({ error: 'Cannot ban an admin' });
    
    // We'll just delete their tokens to force a logout as a "soft ban"
    // In a real app, you'd add an `isBanned` flag to the User model.
    user.refreshTokens = [];
    await user.save();
    res.json({ message: 'User session revoked (banned)' });
  } catch (e) { next(e); }
});


// ─── Full Menu Item Update ───
router.put('/menu/:id/update', requireAdmin, async (req, res, next) => {
  try {
    const { name, price, image, description, addons, category } = req.body;
    
    // Build update object dynamically
    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = price; // stored in cents
    if (image !== undefined) updateData.image = image;
    if (description !== undefined) updateData.description = description;
    if (addons) updateData.addons = addons;
    if (category) updateData.category = category;

    const item = await MenuItem.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!item) return res.status(404).json({ error: 'Not found' });
    
    res.json(item);
  } catch (e) { next(e); }
});

export default router;


