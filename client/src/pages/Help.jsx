import { useState } from 'react';
import { ArrowLeft, ChevronDown, Mail, Phone, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../store/toastStore';

const FAQS = [
  {
    q: 'How do I track my order?',
    a: 'After placing an order, go to "My orders" and tap the order. You\'ll see live status updates from preparation to delivery.',
  },
  {
    q: 'Can I cancel my order?',
    a: 'Yes, but only before we start preparing it. Once cooking begins, cancellation may not be possible. Contact support immediately if you need to cancel.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Cash on delivery (COD) and card payments. Mobile money (M-Pesa) is coming soon.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Typically 30–45 minutes within our delivery zones. Peak hours may be longer.',
  },
  {
    q: 'My order arrived incomplete or cold. What do I do?',
    a: 'Contact us within 30 minutes of delivery with your order number and a photo if possible. We\'ll make it right — either a partial refund or a remake.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Profile → Delete account. This permanently removes your data. Some transaction records are retained for accounting.',
  },
];

export default function Help() {
  const [openIdx, setOpenIdx] = useState(null);
  const [form, setForm] = useState({ subject: '', message: '' });
  const toast = useToast(s => s.show);

  const submit = (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast('Please fill both subject and message.', { type: 'error' });
      return;
    }
    toast('Message sent. We\'ll reply within 24 hours.', { type: 'success' });
    setForm({ subject: '', message: '' });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/profile"
        className="text-sm flex items-center gap-1 mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold mb-2 dark:text-white">Help & support</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Answers to common questions. Still stuck? Send us a message below.
      </p>

      {/* Contact cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <a href="tel:+254700123456" className="bg-white dark:bg-[#1A1D21] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 hover:border-gray-200 dark:hover:border-gray-700 transition">
          <Phone className="w-5 h-5 text-brand" />
          <div>
            <p className="text-sm font-medium dark:text-white">Call us</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">+254 700 123 456</p>
          </div>
        </a>
        <a href="mailto:support@dmcfoods.co.ke" className="bg-white dark:bg-[#1A1D21] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 hover:border-gray-200 dark:hover:border-gray-700 transition">
          <Mail className="w-5 h-5 text-brand" />
          <div>
            <p className="text-sm font-medium dark:text-white">Email</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">support@dmcfoods.co.ke</p>
          </div>
        </a>
        <div className="bg-white dark:bg-[#1A1D21] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-brand" />
          <div>
            <p className="text-sm font-medium dark:text-white">Live chat</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Coming soon</p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <h2 className="text-lg font-semibold mb-4 dark:text-white">Frequently asked</h2>
      <div className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 mb-8">
        {FAQS.map((faq, i) => (
          <div key={i}>
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-[#23272B] transition"
            >
              <span className="text-sm font-medium dark:text-white pr-4">{faq.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                  openIdx === i ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIdx === i && (
              <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact form */}
      <h2 className="text-lg font-semibold mb-4 dark:text-white">Still need help?</h2>
      <form onSubmit={submit} className="bg-white dark:bg-[#1A1D21] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">Subject</label>
          <input
            value={form.subject}
            onChange={e => setForm({ ...form, subject: e.target.value })}
            placeholder="What's it about?"
            className="w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl outline-none dark:text-white focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">Message</label>
          <textarea
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            rows={5}
            placeholder="Tell us what happened…"
            className="w-full px-4 py-3 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl outline-none dark:text-white focus:border-brand resize-none"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-brand hover:bg-brand-hover text-white py-3 rounded-full font-semibold"
        >
          Send message
        </button>
      </form>
    </div>
  );
}
