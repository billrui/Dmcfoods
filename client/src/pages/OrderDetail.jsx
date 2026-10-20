import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, HelpCircle } from 'lucide-react';
import api from '../lib/api';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showCancel, setShowCancel] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data),
    refetchInterval: 5000,
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (!order) return <div className="p-8 text-center text-gray-500">Not found</div>;

  // Format order ID like Munch (e.g., #A18926)
  const orderRef = `#${order._id.slice(-6).toUpperCase()}`;
  const dateStr = new Date(order.createdAt).toLocaleString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' 
  });

  const handleCancel = async () => {
    // In a real app, this would call an API to cancel the order
    // await api.post(`/orders/${order._id}/cancel`);
    setShowCancel(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0F1114] pb-20">
      
      {/* Header */}
      <header className="bg-[#1A1D21] border-b border-gray-800 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate('/orders')} className="p-2 -ml-2 text-white hover:bg-[#23272B] rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-white leading-tight">Order {orderRef}</h1>
            <p className="text-[11px] text-gray-400">{dateStr}</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Status Banner */}
        <div className="bg-[#2A1215] rounded-xl overflow-hidden border border-red-900/30">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 rounded-full bg-[#3B1A1D] flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-brand" />
            </div>
            <h2 className="text-brand font-semibold text-lg">Your order is Pending</h2>
            <p className="text-xs text-gray-400 mt-1 capitalize">{order.type}</p>
          </div>
        </div>

        {/* Delivery Info */}
        <div>
          <h3 className="text-sm font-bold text-white mb-2">Delivery info</h3>
          <div className="bg-[#1A1D21] border border-gray-800 rounded-xl p-4 space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">From</p>
              <p className="text-sm text-gray-200 font-medium">Dmcfoods Kericho</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">To</p>
              <p className="text-sm text-gray-200 font-medium">
                {order.address?.street || 'No address provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Item Info */}
        <div>
          <h3 className="text-sm font-bold text-white mb-2">Item info</h3>
          <div className="bg-[#1A1D21] border border-gray-800 rounded-xl p-4 space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#23272B] flex items-center justify-center">
                    <img src="/logo.png" alt="" className="w-6 h-6 object-cover rounded" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">× {item.quantity}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-white">
                  Ksh {((item.price * item.quantity) / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Info */}
        <div>
          <h3 className="text-sm font-bold text-white mb-2">Payment info</h3>
          <div className="bg-[#1A1D21] border border-gray-800 rounded-xl p-4 space-y-1">
            <p className="text-sm text-gray-200 font-medium">M-Pesa</p>
            <p className="text-xs text-gray-500">Payment status: Paid</p>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-[#1A1D21] border border-gray-800 rounded-xl p-5 space-y-3 text-sm">
          <div className="flex justify-between text-gray-400">
            <span>Items price</span>
            <span className="text-gray-200">Ksh {(order.subtotal / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Tax</span>
            <span className="text-gray-200">Ksh 0.00</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Add-ons</span>
            <span className="text-gray-200">Ksh 0.00</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Subtotal</span>
            <span className="text-gray-200">Ksh {(order.subtotal / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-400 pb-3 border-b border-gray-800">
            <span>Delivery fee</span>
            <span className="text-gray-200">Ksh {(order.deliveryFee / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold pt-1">
            <span className="text-white">Total</span>
            <span className="text-white">Ksh {(order.total / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button 
            onClick={() => setShowCancel(true)}
            className="w-full py-3 bg-[#2A1215] border border-red-900/30 text-brand rounded-xl font-medium text-sm hover:bg-[#3B1A1D] transition"
          >
            Request Cancellation
          </button>
          <button className="w-full py-3 bg-[#1A1D21] border border-gray-800 text-white rounded-xl font-medium text-sm hover:bg-[#23272B] transition flex items-center justify-center gap-2">
            <HelpCircle className="w-4 h-4" /> Help & support
          </button>
        </div>

      </div>

      {/* Cancel Modal */}
      {showCancel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1D21] border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Cancel this order?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Your order will be cancelled immediately.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => setShowCancel(false)}
                className="w-full py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-hover transition"
              >
                Keep Order
              </button>
              <button 
                onClick={handleCancel}
                className="w-full py-3 bg-[#2A1215] border border-red-900/30 text-brand rounded-xl font-semibold hover:bg-[#3B1A1D] transition"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
