// Direct Safaricom Daraja client — supports Buy Goods (Till) and Paybill STK push ("M-Pesa prompt").
//
// .env settings:
//   DARAJA_ENVIRONMENT   sandbox | production
//   DARAJA_TYPE          till | paybill
//   DARAJA_SHORTCODE     Till: your STORE number (head-office number Safaricom gives with the till)
//                        Paybill: your paybill number
//   DARAJA_TILL_NUMBER   Till only: the till number customers pay to
//   DARAJA_PASSKEY       Lipa na M-Pesa Online passkey (from Safaricom when you go live)
//   DARAJA_CONSUMER_KEY / DARAJA_CONSUMER_SECRET   from your Daraja app
//   MPESA_CALLBACK_URL   https://your-domain/api/payments/mpesa/callback
//   MPESA_CALLBACK_SECRET  any long random text (added to the callback address so fakes are refused)

const env = (k, d = '') => (process.env[k] ?? d).trim();
const BASE = () => env('DARAJA_ENVIRONMENT', 'sandbox') === 'production'
  ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

export const mpesaConfig = () => {
  const type = env('DARAJA_TYPE', 'paybill').toLowerCase() === 'till' ? 'till' : 'paybill';
  const shortcode = env('DARAJA_SHORTCODE');
  return {
    type, shortcode,
    partyB: type === 'till' ? env('DARAJA_TILL_NUMBER') : shortcode,
    transactionType: type === 'till' ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline',
    passkey: env('DARAJA_PASSKEY'),
    callbackUrl: env('MPESA_CALLBACK_URL'),
    secret: env('MPESA_CALLBACK_SECRET'),
  };
};

export function checkMpesaConfig() {
  const c = mpesaConfig();
  const missing = [];
  for (const k of ['DARAJA_CONSUMER_KEY', 'DARAJA_CONSUMER_SECRET', 'DARAJA_SHORTCODE', 'DARAJA_PASSKEY', 'MPESA_CALLBACK_URL'])
    if (!env(k)) missing.push(k);
  if (c.type === 'till' && !c.partyB) missing.push('DARAJA_TILL_NUMBER');
  return missing;
}

// ── OAuth token cache ──
// Safaricom tokens last 3600 s. We keep one in memory and refresh it 60 s early,
// so we call oauth/v1/generate about once an hour instead of on every order.
let token = null, tokenExpires = 0, tokenPromise = null;
export async function getToken() {
  if (token && Date.now() < tokenExpires) return token;
  // if several orders arrive at once, they all wait for the same request
  tokenPromise = tokenPromise || fetchToken().finally(() => { tokenPromise = null; });
  return tokenPromise;
}

// Express middleware: puts a valid Daraja token on req.mpesaToken (or answers 503)
export async function mpesaAuth(req, res, next) {
  try {
    req.mpesaToken = await getToken();
    next();
  } catch (e) {
    console.error('[mpesa] auth failed:', e.message);
    res.status(503).json({ error: 'M-Pesa is temporarily unavailable. Please try again shortly.' });
  }
}

async function fetchToken() {
  if (token && Date.now() < tokenExpires) return token;
  const auth = Buffer.from(`${env('DARAJA_CONSUMER_KEY')}:${env('DARAJA_CONSUMER_SECRET')}`).toString('base64');
  const r = await fetch(`${BASE()}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`M-Pesa login failed (${r.status}) — check consumer key/secret and DARAJA_ENVIRONMENT`);
  console.log('[mpesa] new access token (cached for ~1 hour)');
  token = j.access_token;
  tokenExpires = Date.now() + (Number(j.expires_in || 3599) - 60) * 1000;
  return token;
}

// Daraja wants Kenya time: YYYYMMDDHHmmss
function timestamp() {
  const d = new Date(Date.now() + 3 * 3600000);
  return d.toISOString().replace(/[-:T]/g, '').slice(0, 14);
}
function password(ts) {
  const c = mpesaConfig();
  return Buffer.from(`${c.shortcode}${c.passkey}${ts}`).toString('base64');
}

async function post(path, body) {
  const r = await fetch(`${BASE()}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data: j };
}

// "07.." / "+2547.." / "7.." / "01.." -> "2547XXXXXXXX" (or 2541XXXXXXXX)
export function toMsisdn(phone) {
  let p = String(phone || '').replace(/\D/g, '');
  if (p.startsWith('254')) p = p.slice(3);
  if (p.startsWith('0')) p = p.slice(1);
  return /^[17]\d{8}$/.test(p) ? `254${p}` : null;
}

// Send the prompt to the customer's phone. amountKsh is whole shillings.
export async function stkPush({ phone, amountKsh, reference, description }) {
  const c = mpesaConfig();
  const ts = timestamp();
  const cb = c.secret ? `${c.callbackUrl}${c.callbackUrl.includes('?') ? '&' : '?'}key=${encodeURIComponent(c.secret)}` : c.callbackUrl;
  const { ok, data } = await post('/mpesa/stkpush/v1/processrequest', {
    BusinessShortCode: c.shortcode,
    Password: password(ts),
    Timestamp: ts,
    TransactionType: c.transactionType,
    Amount: Math.max(1, Math.round(amountKsh)),
    PartyA: phone,
    PartyB: c.partyB,
    PhoneNumber: phone,
    CallBackURL: cb,
    AccountReference: String(reference).slice(0, 12),
    TransactionDesc: String(description || 'Order').slice(0, 13),
  });
  if (!ok || data.ResponseCode !== '0') {
    throw new Error(data.errorMessage || data.ResponseDescription || data.CustomerMessage || 'M-Pesa did not accept the request');
  }
  return data; // { CheckoutRequestID, MerchantRequestID, CustomerMessage, ... }
}

// Ask Safaricom whether a prompt was really paid. Returns { paid, pending, resultCode, resultDesc }.
export async function stkQuery(checkoutRequestId) {
  const c = mpesaConfig();
  const ts = timestamp();
  const { data } = await post('/mpesa/stkpushquery/v1/query', {
    BusinessShortCode: c.shortcode, Password: password(ts), Timestamp: ts, CheckoutRequestID: checkoutRequestId,
  });
  const code = data.ResultCode !== undefined ? String(data.ResultCode) : null;
  const stillProcessing = !code && /process/i.test(data.errorMessage || '');
  return { paid: code === '0', pending: stillProcessing, resultCode: code, resultDesc: data.ResultDesc || data.errorMessage || '' };
}

// Callback TransactionDate comes as a number like 20261029191530 (Kenya time) -> Date
export function parseMpesaDate(v) {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(String(v || ''));
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 3, +m[5], +m[6])) : undefined;
}
