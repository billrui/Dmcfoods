import express from 'express';
import PromoCode from '../models/PromoCode.js';

const router = express.Router();

router.post('/validate', async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ error: 'No code provided' });

    const promo = await PromoCode.findOne({ code: code.toUpperCase(), isActive: true });
    if (!promo) return res.status(404).json({ error: 'Invalid or expired promo code' });

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Promo code has expired' });
    }
    if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) {
      return res.status(400).json({ error: 'Promo code usage limit reached' });
    }
    if (subtotal < promo.minOrderValue) {
      return res.status(400).json({ error: `Minimum order of Ksh${promo.minOrderValue / 100} required` });
    }

    res.json(promo);
  } catch (e) { next(e); }
});

export default router;
