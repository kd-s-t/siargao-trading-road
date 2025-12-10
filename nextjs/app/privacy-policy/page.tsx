import Header from '@/components/marketing/Header';
import Footer from '@/components/marketing/Footer';
import { getDownloadUrls } from '@/components/marketing/downloads';

export default function PrivacyPolicyPage() {
  const downloadUrls = getDownloadUrls();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header downloadUrls={downloadUrls} variant="light" />
      <main className="max-w-4xl mx-auto px-8 pt-8 pb-16 space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-cyan-600 tracking-wide uppercase">Privacy Policy</p>
          <h1 className="text-4xl md:text-5xl font-bold">How we handle your data</h1>
          <p className="text-lg text-gray-600">
            We collect only what is needed to operate the platform, keep accounts secure, and improve service quality for stores and suppliers.
          </p>
        </div>
        <div className="space-y-4 text-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900">Key points</h2>
          <ul className="space-y-3">
            <li>Account data includes contact details, business information, and activity needed to process orders.</li>
            <li>Operational data covers inventory, pricing, orders, and delivery details shared between parties.</li>
            <li>Access is restricted to authorized team members with role-based controls.</li>
            <li>We do not sell personal data. Third-party providers are limited to services like hosting and analytics.</li>
            <li>Data removal or export requests can be sent to hello@siargaotradingroad.com.</li>
          </ul>
        </div>
        <div className="space-y-4 text-gray-700 pb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Security</h2>
          <p>Data is encrypted in transit and stored securely with access logging. We regularly review permissions and rotate credentials.</p>
        </div>
        <p className="text-sm text-gray-500">Last updated: {new Date().getFullYear()}</p>
      </main>
      <Footer />
      </div>
  );
}
