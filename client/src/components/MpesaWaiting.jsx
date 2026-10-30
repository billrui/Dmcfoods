import { useEffect, useRef, useState } from 'react';
import { Loader2, Smartphone, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import api from '../lib/api';

/*
  Shown after the M-Pesa prompt is sent. Polls the server (which listens for Safaricom's
  callback and, if that is late, asks Safaricom directly) until the order is paid or failed.

  Props: orderId, phone (2547XXXXXXXX), amount (cents), onPaid(), onClose(state)
*/
const POLL_MS = 3000;       // how often we ask the server
const GIVE_UP_MS = 120000;  // M-Pesa prompts expire after about a minute; stop after 2 minutes

export default function MpesaWaiting({ orderId, phone, amount, onPaid, onClose }) {
  const [state, setState] = useState('waiting'); // waiting | paid | failed | timeout
  const [receipt, setReceipt] = useState(null);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const started = useRef(Date.now());

  useEffect(() => {
    if (state !== 'waiting') return undefined;
    let stop = false;
    const tick = async () => {
      if (stop) return;
      try {
        const { data } = await api.get(`/payments/mpesa/status/${orderId}`);
        if (data.paid) { setReceipt(data.receipt); setState('paid'); return; }
        if (data.status === 'CANCELED') { setState('failed'); return; }
      } catch { /* network blip: keep trying */ }
      if (Date.now() - started.current > GIVE_UP_MS) { setState('timeout'); return; }
      setTimeout(tick, POLL_MS);
    };
    const t = setTimeout(tick, POLL_MS);
    return () => { stop = true; clearTimeout(t); };
  }, [state, orderId]);

  useEffect(() => {
    if (state === 'paid') { const t = setTimeout(onPaid, 1800); return () => clearTimeout(t); }
    return undefined;
  }, [state, onPaid]);

  const resend = async () => {
    setResending(true); setError('');
    try {
      await api.post('/payments/mpesa/stkpush', { orderId, phone });
      started.current = Date.now();
      setState('waiting');
    } catch (e) {
      setError(e.response?.data?.error || 'Could not resend the prompt.');
    } finally { setResending(false); }
  };

  const shown = `0${String(phone).slice(3, 6)} ${String(phone).slice(6, 9)} ${String(phone).slice(9)}`;

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-live="polite">
      <div className="w-full max-w-sm bg-card border border-gray-800 rounded-3xl p-6 text-center shadow-2xl">
        {state === 'waiting' && (
          <>
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full border-4 border-brand/20" />
              <Loader2 className="absolute inset-0 w-20 h-20 text-brand animate-spin" strokeWidth={1.5} />
              <Smartphone className="absolute inset-0 m-auto w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Check your phone</h2>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              We sent an M-Pesa prompt for <b className="text-white">Ksh {(amount / 100).toLocaleString()}</b> to <b className="text-white">{shown}</b>.
              Enter your M-Pesa PIN to pay.
            </p>
            <p className="text-xs text-gray-500 mt-4 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand animate-pulse" /> Waiting for payment confirmation…
            </p>
          </>
        )}

        {state === 'paid' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white">Payment received</h2>
            <p className="text-sm text-gray-400 mt-2">{receipt ? <>M-Pesa receipt <b className="text-white">{receipt}</b>. </> : null}Your order is on its way to the kitchen.</p>
          </>
        )}

        {(state === 'failed' || state === 'timeout') && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white">{state === 'failed' ? 'Payment not completed' : 'No payment yet'}</h2>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              {state === 'failed'
                ? 'The prompt was cancelled or the PIN was wrong. Your order was not charged.'
                : "We haven't received a confirmation. If you didn't get the prompt, send it again."}
            </p>
            {error && <p className="text-sm text-red-300 mt-3">{error}</p>}
            <div className="mt-5 space-y-2">
              {state === 'timeout' && (
                <button onClick={resend} disabled={resending}
                  className="w-full bg-brand text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                  {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Send the prompt again
                </button>
              )}
              <button onClick={() => onClose(state)} className="w-full bg-raised text-white py-3 rounded-xl font-semibold">
                {state === "failed" ? "Back to checkout" : "View my order"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
