import Header from '@/components/marketing/Header';
import Footer from '@/components/marketing/Footer';
import { getDownloadUrls } from '@/components/marketing/downloads';

export default function SupportPage() {
  const downloadUrls = getDownloadUrls();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header downloadUrls={downloadUrls} variant="light" />
      <main className="max-w-4xl mx-auto px-8 pt-8 pb-16 space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-cyan-600 tracking-wide uppercase">Support</p>
          <h1 className="text-4xl md:text-5xl font-bold">We&apos;re here to help</h1>
          <p className="text-lg text-gray-600">
            Reach out for product questions, onboarding help, or issue resolution. The team responds quickly so you can keep operations moving.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact options</h2>
            <ul className="space-y-3 text-gray-700">
              <li>Email: <a href="mailto:hello@siargaotradingroad.com" className="text-cyan-600 hover:text-cyan-700">hello@siargaotradingroad.com</a></li>
              <li>Phone: <a href="tel:09606075119" className="text-cyan-600 hover:text-cyan-700">09606075119</a></li>
              <li>Location: General Luna, Siargao Island</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Common requests</h2>
            <ul className="space-y-3 text-gray-700">
              <li>Account access or password assistance.</li>
              <li>Order, delivery, or catalog updates.</li>
              <li>Feature requests and feedback.</li>
            </ul>
          </div>
        </div>
        <div className="bg-cyan-600 text-white rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-3">Need priority help?</h2>
          <p className="text-white/90">Message the team and include your store or supplier name along with a short description of the issue so we can route it fast.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
