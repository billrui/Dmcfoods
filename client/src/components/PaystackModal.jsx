import { useState } from 'react';
import { X, Lock } from 'lucide-react';

export default function PaystackModal({ open, onClose, amount, email, onPay }) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate the Paystack popup processing
    await new Promise(r => setTimeout(r, 1500));
    onPay();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="bg-[#00C3F7] text-white px-2 py-1 rounded font-bold text-sm tracking-wider">munch</div>
            <span className="text-gray-500 text-sm">Secured by paystack</span>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <p className="text-sm text-gray-500">{email}</p>
            <p className="text-sm text-green-600 font-semibold">Pay KES {amount / 100}</p>
          </div>

          <h2 className="text-center text-gray-700 font-medium mb-6">Enter your card details to pay</h2>

          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 tracking-wider mb-1">CARD NUMBER</label>
              <input type="text" placeholder="0000 0000 0000 0000" className="w-full border border-blue-400 rounded p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200" required />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-gray-500 tracking-wider mb-1">CARD EXPIRY</label>
                <input type="text" placeholder="MM / YY" className="w-full border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-400" required />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-gray-500 tracking-wider mb-1">CVV</label>
                <input type="text" placeholder="123" className="w-full border border-gray-300 rounded p-3 text-gray-800 focus:outline-none focus:border-blue-400" required />
              </div>
            </div>

            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-green-500 focus:ring-green-500" />
              <span className="text-sm text-gray-600">Save this card for faster checkouts <span className="text-[10px] bg-red-500 text-white px-1 py-0.5 rounded">NEW</span></span>
            </label>

            <button type="submit" disabled={loading} className="w-full bg-[#4ADE80] hover:bg-[#22C55E] text-white py-3 rounded mt-6 font-semibold text-lg transition">
              {loading ? 'Processing…' : `Pay KES ${amount / 100}`}
            </button>
            
            <button type="button" className="w-full text-sm text-gray-500 mt-2 hover:text-gray-800">
              Use a saved card
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
