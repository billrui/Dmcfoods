import express from 'express';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import { escapeRegex } from '../lib/escapeRegex.js';

const router = express.Router();

router.get('/categories', async (_req, res) => {
  const cats = await Category.find().sort('sortOrder');
  res.json(cats);
});

router.get('/menu', async (req, res) => {
  const { category, popular, latest, q } = req.query;
  const filter = { isAvailable: true, addonOnly: { $ne: true } };
  if (category) filter.category = category;
  if (popular === 'true') filter.isPopular = true;
  if (latest === 'true')  filter.isLatest = true;
  if (q) filter.$text = { $search: q };

  const items = await MenuItem.find(filter).populate('category', 'name slug').populate('addonItems', 'name price discount isAvailable');
  res.json(items);
});

router.get('/menu/:id', async (req, res) => {
  const item = await MenuItem.findById(req.params.id).populate('addonItems', 'name price discount isAvailable');
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

router.get('/category/:slug', async (req, res) => {
  const cat = await Category.findOne({ slug: req.params.slug });
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const items = await MenuItem.find({ category: cat._id, isAvailable: true, addonOnly: { $ne: true } }).populate('addonItems', 'name price discount isAvailable');
  res.json({ category: cat, items });
});

export default router;
