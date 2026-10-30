import express from 'express';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import PromoCode from '../models/PromoCode.js';
import { awardForOrder, undoForOrder } from '../lib/loyalty.js';
import { requireAuth } from '../middleware/auth.js';
import { objectIdSchema } from '../lib/schemas.js';
import { stkPush, stkQuery, toMsisdn, mpesaConfig, checkMpesaConfig, mpesaAuth, parseMpesaDate } from '../lib/mpesa.js';

const router = express.Router();

// report the M-Pesa setup once .env has loaded
setTimeout(() => {
  const missing = checkMpesaConfig();
  if (missing.length) console.warn(`[mpesa] not configured — missing in .env: ${missing.join(', ')}`);
  else console.log(`[mpesa] ready: ${mpesaConfig().type.toUpperCase()} ${mpesaConfig().partyB} (${process.env.DARAJA_ENVIRONMENT || 'sandbox'})`);
}, 0);

// ─── Send the M-Pesa prompt for the customer's own order ───
// Body: { orderId, phone }.  The AMOUNT is never taken from the browser — it comes from the
// order saved on the server, so nobody can change what they pay.
router.post('/mpesa/stkpush', requireAuth, mpesaAuth, async (req, res) => {
  try {
    const { orderId, phone } = req.body || {};
    if (!objectIdSchema.safeParse(orderId).success) return res.status(400).json({ error: 'Invalid order' });

    const order = await Order.findById(orderId);
    if (!order || String(order.user) !== String(req.user._id)) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'CREATED') return res.status(400).json({ error: 'This order is already paid or closed.' });

    const msisdn = toMsisdn(phone);
    if (!msisdn) return res.status(400).json({ error: 'Enter a valid Safaricom number, e.g. 0712 345 678.' });
    if (checkMpesaConfig().length) return res.status(503).json({ error: 'M-Pesa is not set up yet. Please try again later.' });

    const ref = order._id.toString().slice(-6).toUpperCase();
    const r = await stkPush({ phone: msisdn, amountKsh: order.total / 100, reference: `DMC${ref}`, description: `Order ${ref}` });

    order.mpesaCheckoutRequestId = r.CheckoutRequestID;
    await order.save();
    await Payment.create({
      order: order._id, checkoutRequestId: r.CheckoutRequestID, phone: msisdn, amountRequested: order.total,
    }).catch(e => console.error('payment record failed:', e.message));

    res.json({ success: true, message: r.CustomerMessage || 'Check your phone and enter your M-Pesa PIN.', checkoutRequestId: r.CheckoutRequestID });
  } catch (err) {
    console.error('[mpesa] prompt failed:', err.message);
    res.status(502).json({ error: 'Could not send the M-Pesa prompt. Check the number and try again.' });
  }
});

// Mark an order paid / failed exactly once
async function settle(order, { paid, receipt, resultDesc }) {
  const fresh = await Order.findOneAndUpdate(
    { _id: order._id, status: 'CREATED' },
    paid
      ? { $set: { status: 'PAID', paymentMethod: 'mpesa', mpesaReceipt: receipt }, $push: { statusHistory: { status: 'PAID', at: new Date() } } }
      : { $set: { status: 'CANCELED' }, $push: { statusHistory: { status: 'CANCELED', at: new Date() } } },
    { new: true },
  );
  if (!fresh) return; // already handled (duplicate callback)
  if (paid) {
    if (fresh.promoCode) await PromoCode.updateOne({ code: fresh.promoCode }, { $inc: { currentUses: 1 } }).catch(() => {});
    await awardForOrder(fresh);
    console.log(`✅ Order ${fresh._id} paid. Receipt ${receipt}`);
  } else {
    await undoForOrder(fresh, 'Payment failed for order');
    console.log(`❌ Order ${fresh._id} not paid: ${resultDesc}`);
  }
}

// ─── Safaricom calls this when the customer pays or cancels ───
router.post('/mpesa/callback', async (req, res) => {
  // Always answer Safaricom quickly
  const ack = () => res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  try {
    const { secret } = mpesaConfig();
    if (secret && req.query.key !== secret) {
      console.warn('[mpesa] callback refused: wrong key from', req.ip);
      return res.status(403).json({ ResultCode: 1, ResultDesc: 'Forbidden' });
    }
    const cbk = req.body?.Body?.stkCallback;
    if (!cbk?.CheckoutRequestID) return ack();
    // stkCallback = { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc,
    //                 CallbackMetadata: { Item: [ {Name:'Amount'}, {Name:'MpesaReceiptNumber'},
    //                                            {Name:'TransactionDate'}, {Name:'PhoneNumber'} ] } }
    // ResultCode 0 = paid; 1032 = cancelled by customer; 1037 = phone unreachable; 2001 = wrong PIN
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = cbk;
    const meta = Object.fromEntries((CallbackMetadata?.Item || []).map(i => [i.Name, i.Value]));

    const payment = await Payment.findOne({ checkoutRequestId: CheckoutRequestID });
    const order = await Order.findOne({ mpesaCheckoutRequestId: CheckoutRequestID });
    if (!payment || !order) { console.warn('[mpesa] callback for unknown request', CheckoutRequestID); return ack(); }
    if (payment.status !== 'pending') return ack(); // already handled

    // Don't trust the message alone — confirm with Safaricom
    let confirmed = Number(ResultCode) === 0;
    let desc = ResultDesc;
    try {
      const q = await stkQuery(CheckoutRequestID);
      if (q.resultCode !== null) { confirmed = q.paid; desc = q.resultDesc || desc; }
      else if (!q.pending) console.warn('[mpesa] could not confirm', CheckoutRequestID, q.resultDesc);
    } catch (e) {
      console.warn('[mpesa] confirmation check failed, using callback result:', e.message);
    }

    const amountPaid = confirmed ? Math.round(Number(meta.Amount || payment.amountRequested / 100) * 100) : 0;
    payment.set({
      status: confirmed ? 'success' : 'failed',
      resultDesc: desc,
      amountPaid,
      ...(meta.MpesaReceiptNumber ? { receipt: String(meta.MpesaReceiptNumber) } : {}),
      ...(meta.PhoneNumber ? { phone: String(meta.PhoneNumber) } : {}),
      ...(confirmed ? { paidAt: parseMpesaDate(meta.TransactionDate) || new Date() } : {}),
      ...(meta.TransactionDate ? { transactionDate: String(meta.TransactionDate) } : {}),
      raw: req.body,
    });
    await payment.save();

    await settle(order, { paid: confirmed, receipt: meta.MpesaReceiptNumber ? String(meta.MpesaReceiptNumber) : undefined, resultDesc: desc });
    ack();
  } catch (err) {
    console.error('[mpesa] callback error:', err.message);
    ack(); // Safaricom retries on errors; we've logged it
  }
});

// ─── The order page asks this while the customer is paying ───
// If Safaricom's message never arrived, this checks with Safaricom directly.
router.get('/mpesa/status/:orderId', requireAuth, async (req, res) => {
  try {
    if (!objectIdSchema.safeParse(req.params.orderId).success) return res.status(400).json({ error: 'Invalid order' });
    const order = await Order.findById(req.params.orderId);
    if (!order || (String(order.user) !== String(req.user._id) && !req.user.isAdmin)) return res.status(404).json({ error: 'Order not found' });

    if (order.status === 'CREATED' && order.mpesaCheckoutRequestId) {
      const payment = await Payment.findOne({ checkoutRequestId: order.mpesaCheckoutRequestId });
      const age = payment ? Date.now() - new Date(payment.createdAt).getTime() : 0;
      if (payment?.status === 'pending' && age > 20000) {
        try {
          const q = await stkQuery(order.mpesaCheckoutRequestId);
          if (q.resultCode !== null) {
            payment.set({ status: q.paid ? 'success' : 'failed', resultDesc: q.resultDesc,
              amountPaid: q.paid ? payment.amountRequested : 0, ...(q.paid ? { paidAt: new Date() } : {}) });
            await payment.save();
            await settle(order, { paid: q.paid, resultDesc: q.resultDesc });
          }
        } catch (e) { /* try again on the next check */ }
      }
    }
    const fresh = await Order.findById(order._id).select('status mpesaReceipt total');
    res.json({ status: fresh.status, receipt: fresh.mpesaReceipt || null, paid: ['PAID', 'PREPARING', 'READY', 'DELIVERING', 'COMPLETED'].includes(fresh.status) });
  } catch (e) {
    res.status(500).json({ error: 'Could not check payment' });
  }
});

export default router;
