import express from 'express';
import MenuCollection from '../models/MenuCollection.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();
router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const collections = await MenuCollection.find().sort('sortOrder').populate('items', 'name price image');
    res.json(collections);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, slug, type, sortOrder } = req.body;
    const collection = await MenuCollection.create({ title, slug, type, sortOrder });
    res.status(201).json(collection);
  } catch (e) { 
    if (e.code === 11000) return res.status(400).json({ error: 'Slug already exists' });
    next(e); 
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { title, type, isActive, items, sortOrder } = req.body;
    const collection = await MenuCollection.findByIdAndUpdate(
      req.params.id,
      { title, type, isActive, items, sortOrder },
      { new: true }
    );
    res.json(collection);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await MenuCollection.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
