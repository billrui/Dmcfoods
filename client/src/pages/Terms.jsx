import PolicyLayout from '../components/PolicyLayout.jsx';

export default function Terms() {
  return (
    <PolicyLayout title="Terms & Conditions" updated="October 2026">
      <p>
        By using Dmcfoods you agree to these terms. If you don't agree, please don't use the service.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Using Dmcfoods</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>You must be 18+ or have permission from a guardian.</li>
        <li>Provide accurate delivery details — we're not responsible for failed deliveries due to wrong addresses.</li>
        <li>Don't abuse the service (fake orders, harassment of riders, etc.).</li>
      </ul>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Orders & payments</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Prices are shown in Kenyan Shillings and include VAT where applicable.</li>
        <li>Payment is due at checkout — either online or cash on delivery.</li>
        <li>Delivery fees are shown separately before you confirm.</li>
        <li>We may cancel an order if an item is out of stock; you'll be refunded in full.</li>
      </ul>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Cancellations & refunds</h2>
      <p>
        Orders can be cancelled before they enter preparation. Once we start cooking,
        cancellation may not be possible. Refunds for cancelled or failed orders are
        processed within 5–7 business days.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Delivery</h2>
      <p>
        Estimated delivery times are not guarantees. Delays can happen due to weather,
        traffic, or volume. We'll notify you of major delays.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Liability</h2>
      <p>
        We're not liable for indirect losses (e.g. missed meetings) caused by delayed orders.
        Our liability is capped at the value of your order.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Changes</h2>
      <p>
        We may update these terms. Continued use after an update means you accept the new terms.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Contact</h2>
      <p>
        Questions? Email <a href="mailto:legal@dmcfoods.co.ke" className="text-brand hover:underline">legal@dmcfoods.co.ke</a>.
      </p>
    </PolicyLayout>
  );
}
