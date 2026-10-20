import { X, CheckCircle2, XCircle, Phone, MapPin } from 'lucide-react';
import { useState } from 'react';
import api from '../lib/api';
import { useToast } from '../store/toastStore';

const FLOW = ['CREATED','PAID','PREPARING','READY','DELIVERING','COMPLETED'];
const NEXT_LABEL = {
  CREATED:    'Mark as PAID',
  PAID:       'Start preparing',
  PREPARING:  'Mark as ready',
  READY:      'Send for delivery',
  DELIVERING: 'Mark as delivered',
  COMPLETED:  'Completed',
};

export default function AdminOrderModal({ order, onClose, onUpdate }) {
  const toast = useToast(s => s.show);
  const [busy, setBusy] = useState(false);

  if (!order) return null;

  const currentIdx = FLOW.indexOf(order.status);
  const nextStatus = FLOW[currentIdx + 1];
  const isFinal = currentIdx === FLOW.length - 1;
  const isCanceled = order.status === 'CANCELED';

  const advance = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/admin/orders/${order._id}/advance`);
      toast(`Order moved to ${data.status}`, { type: 'success' });
      onUpdate(data);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', { type: 'error' });
    } finally { setBusy(false); }
  };

  const cancel = async () => {
    if (!confirm('Cancel this order?')) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/admin/orders/${order._id}/cancel`);
      toast('Order canceled', { type: 'info' });
      onUpdate(data);
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', { type: 'error' });
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 md:pt-12 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-2xl w-full max-w-2xl p-6 mb-12"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold dark:text-white">
              Order #{order._id.slice(-6).toUpperCase()}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-[#23272B] rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Status pill */}
        <div className="mb-4">
          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
            isCanceled ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
            : isFinal   ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
            : 'bg-brand/10 text-brand'
          }`}>
            {order.status}
          </span>
        </div>

        {/* Customer */}
        <div className="bg-gray-50 dark:bg-[#0F1114] rounded-xl p-4 mb-4 space-y-2">
          <p className="text-sm font-semibold dark:text-white">
            {order.user?.name || 'Guest'}
          </p>
          {order.user?.phone && (
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Phone className="w-3 h-3" /> {order.user.phone}
            </p>
          )}
          {order.address?.street && (
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
              <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
              <span>{order.address.street}, {order.address.city}</span>
            </p>
          )}
        </div>

        {/* Items */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2 dark:text-white">Items</h3>
          <div className="space-y-1 text-sm">
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between dark:text-gray-300">
                <span>{it.quantity} × {it.name}</span>
                <span>Ksh{(it.price * it.quantity) / 100}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 mt-3 pt-3 text-sm space-y-1">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Delivery</span>
              <span>Ksh{order.deliveryFee / 100}</span>
            </div>
            <div className="flex justify-between font-bold text-base dark:text-white">
              <span>Total</span>
              <span>Ksh{order.total / 100}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-2 dark:text-white">Timeline</h3>
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            {order.statusHistory?.map((h, i) => (
              <div key={i} className="flex justify-between">
                <span className="font-medium">{h.status}</span>
                <span>{new Date(h.at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {!isCanceled && !isFinal && (
          <div className="space-y-2">
            <button
              onClick={advance}
              disabled={busy}
              className="w-full bg-brand hover:bg-brand-hover disabled:bg-gray-300 text-white py-3 rounded-full font-semibold flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {busy ? 'Working…' : NEXT_LABEL[order.status]}
            </button>
            <button
              onClick={cancel}
              disabled={busy}
              className="w-full border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 py-3 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <XCircle className="w-4 h-4" />
              Cancel order
            </button>
          </div>
        )}

        {(isCanceled || isFinal) && (
          <p className="text-center text-sm text-gray-400">
            This order is {isCanceled ? 'canceled' : 'complete'}. No further actions.
          </p>
        )}
      </div>
    </div>
  );
}
