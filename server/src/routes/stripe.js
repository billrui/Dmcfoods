import express from 'express';
import Stripe from 'stripe';
import Order from '../models/Order.js';
import { requireAuth } from '../middleware/auth.js';
import { objectIdSchema } from '../lib/schemas.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// ─── Create Payment Intent ───
router.post('/create-intent', requireAuth, async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!objectIdSchema.safeParse(orderId).success) return res.status(400).json({ error: 'Invalid ID' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'CREATED') return res.status(400).json({ error: 'Order already processed' });

    // Stripe expects amount in cents
    const amount = order.total;

    const intent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'kes', // Kenyan Shilling
      metadata: { orderId: order._id.toString() },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('Stripe Error:', err);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// ─── Stripe Webhook (Stripe hits this) ───
// NOTE: This must be registered with express.raw() BEFORE express.json()
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const orderId = intent.metadata.orderId;

    const order = await Order.findById(orderId);
    if (order && order.status === 'CREATED') {
      order.status = 'PAID';
      order.paymentMethod = 'card';
      order.statusHistory.push({ status: 'PAID', at: new Date() });
      await order.save();
      console.log(`✅ Order ${orderId} paid via Card.`);
    }
  }

  res.json({ received: true });
});

export default router;
