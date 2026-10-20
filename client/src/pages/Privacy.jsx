import PolicyLayout from '../components/PolicyLayout.jsx';

export default function Privacy() {
  return (
    <PolicyLayout title="Privacy Policy" updated="October 2026">
      <p>
        At Dmcfoods, we take your privacy seriously. This policy explains what we collect,
        why we collect it, and what you can do about it.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">What we collect</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Account info:</strong> name, email, phone number, delivery address.</li>
        <li><strong>Order history:</strong> items you've ordered, prices, delivery times.</li>
        <li><strong>Usage:</strong> pages visited, searches, device type (for improving the service).</li>
        <li><strong>Payment:</strong> handled by our payment processor. We never store card numbers.</li>
      </ul>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Why we collect it</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>To deliver your orders and process payments.</li>
        <li>To show your order history and favourites.</li>
        <li>To improve our menu, delivery times, and recommendations.</li>
        <li>To send you order updates (SMS or email) — not marketing, unless you opt in.</li>
      </ul>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Who we share it with</h2>
      <p>
        We share the minimum required data with delivery riders (your address and phone number)
        and payment processors (transaction details). We never sell your data.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Your rights</h2>
      <p>
        You can view, update, or delete your account at any time from your profile page.
        Deleting your account removes your personal data; some transaction records are
        retained for accounting purposes as required by law.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Cookies</h2>
      <p>
        We use cookies for session management, cart persistence, and remembering your
        preferred branch. You can clear them from your browser settings at any time.
      </p>

      <h2 className="text-lg font-semibold dark:text-white pt-2">Contact us</h2>
      <p>
        Questions? Email <a href="mailto:privacy@dmcfoods.co.ke" className="text-brand hover:underline">privacy@dmcfoods.co.ke</a>.
      </p>
    </PolicyLayout>
  );
}
