import express from 'express';
import PromoCode from '../models/PromoCode.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();
router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const promos = await PromoCode.find().sort('-createdAt');
    res.json(promos);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxUses, expiresAt, onePerCustomer, eligibility, loyalDays, loyalWindowDays, bigSpendAmount, bigSpendWindowDays } = req.body;
    const promo = await PromoCode.create({
      code, discountType, discountValue, minOrderValue, maxUses, expiresAt: expiresAt || undefined, onePerCustomer, eligibility, loyalDays, loyalWindowDays, bigSpendAmount, bigSpendWindowDays
    });
    res.status(201).json(promo);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'Promo code already exists' });
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxUses, expiresAt, isActive, onePerCustomer, eligibility, loyalDays, loyalWindowDays, bigSpendAmount, bigSpendWindowDays } = req.body;
    const promo = await PromoCode.findByIdAndUpdate(
      req.params.id,
      { code, discountType, discountValue, minOrderValue, maxUses, expiresAt: expiresAt || null, isActive, onePerCustomer, eligibility, loyalDays, loyalWindowDays, bigSpendAmount, bigSpendWindowDays },
      { new: true }
    );
    res.json(promo);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await PromoCode.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
export default router;
