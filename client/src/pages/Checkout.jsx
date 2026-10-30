import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, User, ChevronDown, Bike, ShoppingBag,
  Phone, Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useCart } from '../store/cartStore';
import { useAuth } from '../context/AuthContext.jsx';
import { useBranch, getBranchStatus, getBranchStatusText } from '../store/branchStore';
import { useToast } from '../store/toastStore';
import AddressModal from '../components/AddressModal.jsx';
import MpesaWaiting from '../components/MpesaWaiting.jsx';

export default function Checkout() {
  const { items, subtotal, clear, promo } = useCart();
  const { user } = useAuth();
  const [usePoints, setUsePoints] = useState(false);
  const { data: loyalty } = useQuery({ queryKey: ['loyalty', 'me'], queryFn: () => api.get('/loyalty/me').then(r => r.data), enabled: !!user });
  const { branch } = useBranch();
  const navigate = useNavigate();
  const toast = useToast(s => s.show);

  const [type, setType] = useState('delivery');
  const [zoneId, setZoneId] = useState('');
  const paymentMethod = 'mpesa';
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(null); // { orderId, phone, amount } while the customer pays

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: user?.name || '',
    phone: user?.phone?.replace('+254', '') || '',
    address: '',
  });

  // Fetch Delivery Zones
  const { data: zones = [] } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => api.get('/delivery-zones').then(r => r.data),
  });

  const selectedZone = zones.find(z => z._id === zoneId);
  const subtotalKsh = subtotal();
  const deliveryFee = type === 'delivery' && selectedZone ? selectedZone.fee : 0;
  const promoDiscount = !promo || subtotalKsh < (promo.minOrderValue || 0) ? 0 : Math.min(subtotalKsh,
    promo.discountType === 'percentage' ? Math.round(subtotalKsh * promo.discountValue / 100) : promo.discountValue);
  const pointsRoom = Math.max(0, Math.min(subtotalKsh - promoDiscount, subtotalKsh - promoDiscount + deliveryFee - 100));
  const pointsDiscount = usePoints && loyalty?.canRedeem ? Math.min(loyalty.value || 0, pointsRoom) : 0;
  const pointsToUse = pointsDiscount > 0 ? 1 : 0;
  const total = subtotalKsh - promoDiscount - pointsDiscount + deliveryFee;
  const branchClosed = !!branch && getBranchStatus(branch) === 'CLOSED';

  useEffect(() => {
    if (user?.phone) setMpesaPhone(user.phone.replace('+254', ''));
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4">
        <User className="w-12 h-12 text-gray-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Login Required</h1>
        <p className="text-gray-400 mb-6">Please log in to complete your order.</p>
        <button onClick={() => navigate('/login', { state: { from: { pathname: '/checkout' } } })} className="bg-brand text-white px-8 py-3 rounded-full font-bold">
          Log In
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    navigate('/');
    return null;
  }

  const submit = async (e) => {
    e.preventDefault();
    if (type === 'delivery' && !zoneId) {
      toast('Please select a delivery area.', { type: 'error' });
      return;
    }
    if (!/^[17]\d{8}$/.test(mpesaPhone)) {
      toast('Please enter a valid M-Pesa phone number.', { type: 'error' });
      return;
    }

    if (branchClosed) {
      toast(`${branch.name} is closed. ${getBranchStatusText(branch).replace(/^Closed · /, '')}`, { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const finalAddress = deliveryInfo.address || selectedZone?.name || 'Pickup';

      const orderRes = await api.post('/orders', {
        items: items.map(i => ({ menuItem: i._id, quantity: i.quantity, addons: (i.addons || []).map(a => a._id).filter(Boolean) })),
        address: { street: finalAddress, city: 'Kenya', notes: note },
        paymentMethod: paymentMethod,
        type,
        branch: branch?._id,
        zoneId: type === 'delivery' ? zoneId : undefined,
        promoCode: promoDiscount > 0 ? promo.code : undefined,
        usePoints: pointsToUse > 0,
      });
      const order = orderRes.data;

      // Server reads the amount from the order — we only send which order and which phone
      await api.post('/payments/mpesa/stkpush', {
        orderId: order._id,
        phone: `254${mpesaPhone}`,
      });
      setWaiting({ orderId: order._id, phone: `254${mpesaPhone}`, amount: order.total });
    } catch (err) {
      toast(err.response?.data?.error || 'Order failed', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app pb-32">
      <header className="sticky top-0 z-30 bg-app/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white hover:bg-card rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-white ml-2">Checkout</h1>
        </div>
      </header>

      <form onSubmit={submit} className="max-w-3xl mx-auto px-4 pt-6 space-y-6">

        {/* Delivery Information Card */}
        <div className="bg-card rounded-2xl border border-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              Delivery information
            </h2>
            <button
              type="button"
              onClick={() => setShowAddressModal(true)}
              className="text-xs font-bold text-brand hover:underline"
            >
              Update info
            </button>
          </div>

          <div className="space-y-3 mb-5 border-b border-gray-800 pb-5">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <User className="w-4 h-4 text-gray-500" />
              {deliveryInfo.name || user.name || 'No name added'}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Phone className="w-4 h-4 text-gray-500" />
              +254 {deliveryInfo.phone || user.phone?.replace('+254', '')}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <MapPin className="w-4 h-4 text-gray-500" />
              {deliveryInfo.address || selectedZone?.name || 'No location added yet'}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-xs font-semibold text-white mb-3">Order type</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('delivery')}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition ${
                  type === 'delivery' ? 'border-brand bg-brand/5' : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                {type === 'delivery' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-brand" />}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${type === 'delivery' ? 'bg-brand text-white' : 'bg-raised text-gray-400'}`}>
                  <Bike className="w-5 h-5" />
                </div>
                <span className={`text-sm font-bold ${type === 'delivery' ? 'text-white' : 'text-gray-400'}`}>Delivery</span>
                <span className="text-[10px] text-gray-500">
                  {selectedZone ? `Ksh${selectedZone.fee / 100}` : 'Select area'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setType('pickup')}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition ${
                  type === 'pickup' ? 'border-brand bg-brand/5' : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                {type === 'pickup' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-brand" />}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${type === 'pickup' ? 'bg-brand text-white' : 'bg-raised text-gray-400'}`}>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className={`text-sm font-bold ${type === 'pickup' ? 'text-white' : 'text-gray-400'}`}>Pickup</span>
                <span className="text-[10px] text-gray-500">Free</span>
              </button>
            </div>
          </div>

          {type === 'delivery' && (
            <div>
              <label className="text-xs font-semibold text-white mb-2 block">Select Area</label>
              <div className="relative">
                <select
                  value={zoneId}
                  onChange={e => setZoneId(e.target.value)}
                  className="w-full appearance-none bg-sunken border border-gray-700 text-gray-300 text-sm rounded-xl px-4 py-3 outline-none focus:border-brand"
                >
                  <option value="" disabled>Search or select area</option>
                  {zones.map(z => (
                    <option key={z._id} value={z._id}>{z.name} (Ksh{z.fee / 100})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Payment Method Card */}
        <div className="bg-card rounded-2xl border border-gray-800 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-white mb-4">Payment method</h2>

          <div className="space-y-3">
            <div className={`rounded-xl border-2 transition overflow-hidden ${paymentMethod === 'mpesa' ? 'border-brand bg-brand/5' : 'border-gray-800'}`}>
              <div className="w-full flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'mpesa' ? 'border-brand' : 'border-gray-600'}`}>
                    {paymentMethod === 'mpesa' && <div className="w-2 h-2 rounded-full bg-brand" />}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-app flex items-center justify-center">
                    <Phone className="w-4 h-4 text-brand" />
                  </div>
                  <span className={`text-sm font-medium ${paymentMethod === 'mpesa' ? 'text-white' : 'text-gray-400'}`}>M-Pesa Online</span>
                </div>
                </div>

              {paymentMethod === 'mpesa' && (
                <div className="px-4 pb-4 pt-1 border-t border-brand/10">
                  <label className="text-xs font-medium text-gray-400 mb-1 block">Phone number</label>
                  <div className="flex gap-2">
                    <div className="bg-sunken border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400">+254</div>
                    <input
                      type="tel"
                      value={mpesaPhone}
                      onChange={e => {
                        // accept 07…, 01…, 2547…, +2547… and keep the 9 digits after 254
                        let v = e.target.value.replace(/\D/g, '');
                        if (v.startsWith('254')) v = v.slice(3);
                        if (v.startsWith('0')) v = v.slice(1);
                        setMpesaPhone(v.slice(0, 9));
                      }}
                      placeholder="712 345 678"
                      className="flex-1 bg-sunken border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">We will send an M-Pesa prompt to this number.</p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Loyalty points */}
        {loyalty?.enabled && (
          <div className="bg-card rounded-2xl border border-gray-800 p-5 shadow-sm">
            {loyalty.canRedeem ? (
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={usePoints} onChange={e => setUsePoints(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 bg-transparent text-brand focus:ring-brand" />
                <span className="flex-1">
                  <span className="text-sm font-semibold text-white block">Use my points</span>
                  <span className="text-xs text-gray-400">You have {loyalty.points.toLocaleString()} points (worth Ksh{loyalty.value / 100}).</span>
                </span>
                {pointsDiscount > 0 && <span className="text-sm font-semibold text-amber-400">−Ksh{pointsDiscount / 100}</span>}
              </label>
            ) : (
              <p className="text-xs text-gray-400">
                <span className="text-white font-medium">{loyalty.points.toLocaleString()} loyalty points.</span>{' '}
                This order adds more. Keep ordering to unlock your reward.
              </p>
            )}
          </div>
        )}

        {/* Delivery Note */}
        <div className="bg-card rounded-2xl border border-gray-800 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-white mb-3">Add delivery note</h2>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Additional note"
            rows={3}
            className="w-full bg-sunken border border-gray-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-brand resize-none"
          />
        </div>

      </form>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-sunken border-t border-gray-800 z-40 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 text-sm font-semibold text-brand">
            <ChevronDown className="w-4 h-4" /> Total amount
          </div>
          <div className="text-right">
            {promoDiscount > 0 && <p className="text-[10px] text-green-400">{promo.code}: −Ksh{promoDiscount / 100}</p>}
            {pointsDiscount > 0 && <p className="text-[10px] text-amber-400">Points: −Ksh{pointsDiscount / 100}</p>}
            {deliveryFee > 0 && <p className="text-[10px] text-gray-500">incl. Ksh{deliveryFee / 100} delivery</p>}
            <span className="text-xl font-bold text-white">Ksh{total / 100}</span>
          </div>
        </div>
        <button
          onClick={submit}
          disabled={loading || branchClosed}
          className="w-full max-w-3xl mx-auto block bg-brand hover:bg-brand-hover disabled:bg-gray-700 text-white py-3.5 rounded-xl font-bold transition shadow-lg shadow-brand/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : branchClosed ? getBranchStatusText(branch) : 'Place order'}
        </button>
      </div>

      {waiting && (
        <MpesaWaiting
          {...waiting}
          onPaid={() => { navigate(`/orders/${waiting.orderId}`, { replace: true }); setTimeout(clear, 0); }}
          onClose={(state) => {
            if (state === 'failed') { setWaiting(null); return; }   // try again from checkout
            navigate(`/orders/${waiting.orderId}`, { replace: true }); // order page keeps checking
            setTimeout(clear, 0);                                   // empty the cart after leaving checkout
          }}
        />
      )}

      <AddressModal
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        initialData={deliveryInfo}
        onSave={(data) => setDeliveryInfo(data)}
      />

    </div>
  );
}
