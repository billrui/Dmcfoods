import express from 'express';
import { DarajaClient } from 'daraja-client';
import Order from '../models/Order.js';
import { requireAuth } from '../middleware/auth.js';
import { objectIdSchema } from '../lib/schemas.js';

const router = express.Router();

// Initialize Daraja Client
const daraja = new DarajaClient({
  consumerKey: process.env.DARAJA_CONSUMER_KEY,
  consumerSecret: process.env.DARAJA_CONSUMER_SECRET,
  shortcode: process.env.DARAJA_SHORTCODE,
  passkey: process.env.DARAJA_PASSKEY,
  environment: process.env.DARAJA_ENVIRONMENT,
});

// ─── Initiate STK Push ───
router.post('/mpesa/stkpush', requireAuth, async (req, res, next) => {
  try {
    const { orderId, phone } = req.body;
    
    if (!objectIdSchema.safeParse(orderId).success) {
      return res.status(400).json({ error: 'Invalid Order ID' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'CREATED') {
      return res.status(400).json({ error: 'Order is already processed' });
    }

    // Format phone: 2547XXXXXXXX (Daraja expects this format)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = formattedPhone.slice(1);
    formattedPhone = `254${formattedPhone}`;

    const amount = Math.round(order.total / 100); // Convert cents to Ksh

    const response = await daraja.stkPush({
      phone: formattedPhone,
      amount: amount,
      accountReference: order._id.toString().slice(-6),
      transactionDesc: `Payment for Order #${order._id.toString().slice(-6)}`,
      callbackUrl: process.env.MPESA_CALLBACK_URL,
    });

    // Save the checkoutRequestId to match the callback later
    order.mpesaCheckoutRequestId = response.CheckoutRequestID;
    await order.save();

    res.json({ 
      success: true, 
      message: 'STK Push sent. Check your phone.',
      checkoutRequestId: response.CheckoutRequestID 
    });
  } catch (err) {
    console.error('M-Pesa Error:', err);
    res.status(500).json({ error: 'Failed to initiate M-Pesa payment', details: err.message });
  }
});

// ─── M-Pesa Callback (Safaricom hits this URL) ───
router.post('/mpesa/callback', async (req, res) => {
  try {
    const { Body } = req.body;
    if (!Body || !Body.stkCallback) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;

    const order = await Order.findOne({ mpesaCheckoutRequestId: CheckoutRequestID });
    if (!order) return res.json({ ResultCode: 0, ResultDesc: 'Order not found' });

    if (ResultCode === 0) {
      // Payment successful
      const receipt = CallbackMetadata.Item.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
      order.status = 'PAID';
      order.paymentMethod = 'mpesa';
      order.mpesaReceipt = receipt;
      order.statusHistory.push({ status: 'PAID', at: new Date() });
      await order.save();
      console.log(`✅ Order ${order._id} paid via M-Pesa. Receipt: ${receipt}`);
    } else {
      // Payment failed/cancelled
      console.log(`❌ Order ${order._id} payment failed: ${ResultDesc}`);
      order.status = 'CANCELED';
      order.statusHistory.push({ status: 'CANCELED', at: new Date() });
      await order.save();
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('Callback Error:', err);
    res.status(500).json({ error: 'Callback failed' });
  }
});

export default router;
