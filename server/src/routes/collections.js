import express from 'express';
import MenuCollection from '../models/MenuCollection.js';

const router = express.Router();

// Get all active collections with populated items
router.get('/', async (req, res, next) => {
  try {
    const collections = await MenuCollection.find({ isActive: true })
      .sort('sortOrder')
      .populate({
        path: 'items',
        match: { isAvailable: true, addonOnly: { $ne: true } }, // Only show available items
        populate: { path: 'addonItems', select: 'name price discount isAvailable' },
      });
    res.json(collections);
  } catch (e) { next(e); }
});

export default router;
