import express from 'express';
import { checkPromo } from '../lib/promo.js';
import { verifyAccessToken } from '../lib/jwt.js';

const router = express.Router();

// Customer checks a code in the cart. The real discount is applied again on the server when the order is placed.
router.post('/validate', async (req, res, next) => {
  try {
    let userId;
    try {
      const h = req.headers.authorization || '';
      if (h.startsWith('Bearer ')) userId = verifyAccessToken(h.slice(7)).sub;
    } catch { /* not signed in is fine */ }
    const subtotal = Math.max(0, Math.round(Number(req.body?.subtotal) || 0));
    const { promo, discount } = await checkPromo(req.body?.code, subtotal, userId);
    res.json({
      code: promo.code, discountType: promo.discountType, discountValue: promo.discountValue,
      minOrderValue: promo.minOrderValue, discount,
    });
  } catch (e) { e.status === 400 ? res.status(400).json({ error: e.message }) : next(e); }
});

export default router;
