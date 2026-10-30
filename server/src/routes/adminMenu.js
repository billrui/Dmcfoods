// Menu & category management for the admin console (mounted at /api/admin, before admin.js)
import express from 'express';
import mongoose from 'mongoose';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import MenuCollection from '../models/MenuCollection.js';
import { requireAdmin } from '../middleware/admin.js';
import { objectIdSchema } from '../lib/schemas.js';

const router = express.Router();

// One-time fix: photos uploaded earlier were saved as "http://localhost:5000/uploads/…",
// which breaks on the live site. Store them as "/uploads/…" instead.
async function fixImageLinks() {
  try {
    const r = await MenuItem.updateMany(
      { image: { $regex: '^https?://localhost(:\\d+)?/uploads/' } },
      [{ $set: { image: { $replaceOne: { input: '$image', find: { $substrCP: ['$image', 0, { $indexOfCP: ['$image', '/uploads/'] }] }, replacement: '' } } } }],
    );
    if (r.modifiedCount) console.log(`[menu] fixed ${r.modifiedCount} photo link(s)`);
  } catch (e) { console.error('[menu] photo link fix skipped:', e.message); }
}
if (mongoose.connection.readyState === 1) fixImageLinks();
else mongoose.connection.once('open', fixImageLinks);
const validId = (id) => objectIdSchema.safeParse(id).success;

const slugify = (s) => s.toLowerCase().trim().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'category';
async function uniqueSlug(name, exceptId) {
  const base = slugify(name);
  let slug = base, n = 2;
  while (await Category.exists({ slug, ...(exceptId ? { _id: { $ne: exceptId } } : {}) })) slug = `${base}-${n++}`;
  return slug;
}

// Clean and check an item coming from the form. Prices are in cents.
function readItem(body, { partial = false } = {}) {
  const out = {};
  const err = (m) => { throw Object.assign(new Error(m), { status: 400 }); };
  const num = (v) => Math.round(Number(v));

  if (body.name !== undefined) { if (!String(body.name).trim()) err('Name is required.'); out.name = String(body.name).trim().slice(0, 120); }
  else if (!partial) err('Name is required.');

  if (body.price !== undefined) { const p = num(body.price); if (!(p > 0)) err('Price must be above 0.'); out.price = p; }
  else if (!partial) err('Price is required.');

  if (body.category !== undefined) { if (!validId(body.category)) err('Choose a category.'); out.category = body.category; }
  else if (!partial) err('Choose a category.');

  if (body.discount !== undefined) { const d = num(body.discount || 0); if (d < 0) err('Discount cannot be negative.'); out.discount = d; }
  if (body.image !== undefined) out.image = String(body.image || '').slice(0, 500);
  if (body.description !== undefined) out.description = String(body.description || '').slice(0, 1000);
  for (const k of ['isAvailable', 'isPopular', 'isLatest', 'addonOnly']) if (body[k] !== undefined) out[k] = !!body[k];
  if (body.addonItems !== undefined) {
    if (!Array.isArray(body.addonItems)) err('Invalid add-ons.');
    out.addonItems = [...new Set(body.addonItems.map(String))].filter(validId).slice(0, 30);
  }
  if (body.addons !== undefined) {
    if (!Array.isArray(body.addons)) err('Invalid add-ons.');
    out.addons = body.addons.filter(a => a?.name?.trim()).slice(0, 30)
      .map(a => ({ name: String(a.name).trim().slice(0, 80), price: Math.max(0, num(a.price || 0)) }));
  }
  const price = out.price;
  if (price !== undefined && out.discount !== undefined && out.discount >= price) err('Discount must be less than the price.');
  return out;
}

// ── Items ──
router.get('/menu', requireAdmin, async (_req, res, next) => {
  try {
    res.json(await MenuItem.find({}).populate('category', 'name slug').sort('name'));
  } catch (e) { next(e); }
});

router.post('/menu', requireAdmin, async (req, res, next) => {
  try {
    const data = readItem(req.body);
    if (!(await Category.exists({ _id: data.category }))) return res.status(400).json({ error: 'That category no longer exists.' });
    if (data.addonItems?.length) data.addonItems = (await MenuItem.find({ _id: { $in: data.addonItems } }).select('_id')).map(d => d._id);
    const item = await MenuItem.create(data);
    res.status(201).json(await item.populate('category', 'name slug'));
  } catch (e) { e.status === 400 ? res.status(400).json({ error: e.message }) : next(e); }
});

router.put('/menu/:id/update', requireAdmin, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const data = readItem(req.body, { partial: true });
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const price = data.price ?? item.price;
    const discount = data.discount ?? item.discount ?? 0;
    if (discount >= price) return res.status(400).json({ error: 'Discount must be less than the price.' });
    if (data.addonItems) {
      data.addonItems = (await MenuItem.find({ _id: { $in: data.addonItems.filter(id => id !== String(item._id)) } }).select('_id')).map(d => d._id);
    }
    Object.assign(item, data);
    await item.save();
    res.json(await item.populate('category', 'name slug'));
  } catch (e) { e.status === 400 ? res.status(400).json({ error: e.message }) : next(e); }
});

router.delete('/menu/:id', requireAdmin, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    // remove it from other dishes' add-ons and from collections
    await MenuItem.updateMany({ addonItems: item._id }, { $pull: { addonItems: item._id } });
    await MenuCollection.updateMany({ items: item._id }, { $pull: { items: item._id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Which collections (home-page rows) this item appears in
router.post('/menu/:id/collections', requireAdmin, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const ids = (Array.isArray(req.body?.ids) ? req.body.ids : []).filter(validId);
    await MenuCollection.updateMany({ _id: { $in: ids } }, { $addToSet: { items: item._id } });
    await MenuCollection.updateMany({ _id: { $nin: ids } }, { $pull: { items: item._id } });
    // keep the old Popular / New badges in step with the "popular" and "latest" collections
    const inCols = await MenuCollection.find({ items: item._id }).select('slug');
    const slugs = inCols.map(c => c.slug);
    item.isPopular = slugs.includes('popular');
    item.isLatest = slugs.includes('latest');
    await item.save();
    res.json({ ok: true, collections: inCols.map(c => c._id) });
  } catch (e) { next(e); }
});

// ── Categories ──
router.get('/categories', requireAdmin, async (_req, res, next) => {
  try {
    const [cats, counts] = await Promise.all([
      Category.find().sort('sortOrder name').lean(),
      MenuItem.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]),
    ]);
    const map = Object.fromEntries(counts.map(c => [String(c._id), c.n]));
    res.json(cats.map(c => ({ ...c, itemCount: map[String(c._id)] || 0 })));
  } catch (e) { next(e); }
});

router.post('/categories', requireAdmin, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim().slice(0, 60);
    if (!name) return res.status(400).json({ error: 'Enter a category name.' });
    if (await Category.exists({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }))
      return res.status(409).json({ error: 'That category already exists.' });
    const last = await Category.findOne().sort('-sortOrder');
    const cat = await Category.create({ name, slug: await uniqueSlug(name), icon: req.body?.icon, sortOrder: (last?.sortOrder ?? 0) + 1 });
    res.status(201).json(cat);
  } catch (e) { next(e); }
});

router.post('/categories/reorder', requireAdmin, async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(validId) : [];
    await Promise.all(ids.map((id, i) => Category.updateOne({ _id: id }, { sortOrder: i })));
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.put('/categories/:id', requireAdmin, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const name = String(req.body?.name || '').trim().slice(0, 60);
    if (!name) return res.status(400).json({ error: 'Enter a category name.' });
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Not found' });
    cat.name = name;
    cat.slug = await uniqueSlug(name, cat._id);
    if (req.body.icon !== undefined) cat.icon = req.body.icon;
    await cat.save();
    res.json(cat);
  } catch (e) { next(e); }
});

router.delete('/categories/:id', requireAdmin, async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const n = await MenuItem.countDocuments({ category: req.params.id });
    if (n) return res.status(400).json({ error: `Move or delete its ${n} item${n === 1 ? '' : 's'} first.` });
    await Category.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
