import express from 'express';
import axios from 'axios';
import Order from '../models/Order.js';
import { requireAuth } from '../middleware/auth.js';
import { objectIdSchema } from '../lib/schemas.js';

const router = express.Router();

// ─── Initialize Transaction ───
router.post('/initialize', requireAuth, async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!objectIdSchema.safeParse(orderId).success) return res.status(400).json({ error: 'Invalid ID' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'CREATED') return res.status(400).json({ error: 'Order already processed' });

    // Paystack expects amount in kobo (cents). KES is supported.
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: req.user.email || `${req.user.phone}@dmcfoods.co.ke`, // Fallback for phone-only users
        amount: order.total,
        currency: 'KES',
        reference: `DMC-${order._id}-${Date.now()}`,
        callback_url: `${process.env.CLIENT_ORIGIN}/orders/${order._id}`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      authorization_url: response.data.data.authorization_url,
      access_code: response.data.data.access_code,
      reference: response.data.data.reference
    });
  } catch (err) {
    console.error('Paystack Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to initialize Paystack' });
  }
});

// ─── Paystack Webhook (Receives payment confirmation) ───
router.post('/webhook', express.json(), async (req, res) => {
  try {
    // Verify signature (optional but highly recommended in production)
    // const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
    // if (hash !== req.headers['x-paystack-signature']) return res.status(401).send('Invalid signature');

    const { event, data } = req.body;

    if (event === 'charge.success') {
      const orderId = data.reference.split('-')[1]; // Extract order ID from reference
      const order = await Order.findById(orderId);
      
      if (order && order.status === 'CREATED') {
        order.status = 'PAID';
        order.paymentMethod = 'card';
        order.statusHistory.push({ status: 'PAID', at: new Date() });
        await order.save();
        console.log(`✅ Order ${orderId} paid via Card.`);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook Error:', err);
    res.sendStatus(500);
  }
});

export default router;
