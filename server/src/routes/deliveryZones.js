import express from 'express';
import DeliveryZone from '../models/DeliveryZone.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// Public: Get active zones
router.get('/', async (req, res, next) => {
  try {
    const zones = await DeliveryZone.find({ isActive: true }).sort('name');
    res.json(zones);
  } catch (e) { next(e); }
});

// Admin: Get all zones (including inactive)
router.get('/admin', requireAdmin, async (req, res, next) => {
  try {
    const zones = await DeliveryZone.find().sort('name');
    res.json(zones);
  } catch (e) { next(e); }
});

// Admin: Create
router.post('/admin', requireAdmin, async (req, res, next) => {
  try {
    const { name, fee } = req.body;
    const zone = await DeliveryZone.create({ name, fee });
    res.status(201).json(zone);
  } catch (e) { next(e); }
});

// Admin: Update
router.put('/admin/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, fee, isActive } = req.body;
    const zone = await DeliveryZone.findByIdAndUpdate(
      req.params.id, 
      { name, fee, isActive }, 
      { new: true }
    );
    res.json(zone);
  } catch (e) { next(e); }
});

// Admin: Delete
router.delete('/admin/:id', requireAdmin, async (req, res, next) => {
  try {
    await DeliveryZone.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
