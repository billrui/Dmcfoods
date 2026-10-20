import express from 'express';
import Branch from '../models/Branch.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();
router.use(requireAdmin);

router.post('/', async (req, res, next) => {
  try {
    const { name, address, openTime, closeTime, isOpen } = req.body;
    const branch = await Branch.create({ name, address, openTime, closeTime, isOpen });
    res.status(201).json(branch);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, address, openTime, closeTime, isOpen } = req.body;
    const branch = await Branch.findByIdAndUpdate(
      req.params.id, 
      { name, address, openTime, closeTime, isOpen }, 
      { new: true }
    );
    res.json(branch);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Branch.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
