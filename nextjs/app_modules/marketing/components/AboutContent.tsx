import Header from '@/components/marketing/Header';
import Footer from '@/components/marketing/Footer';
import { getDownloadUrls } from '@/components/marketing/downloads';

export function AboutContent() {
  const downloadUrls = getDownloadUrls();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header downloadUrls={downloadUrls} variant="light" />
      <main className="max-w-4xl mx-auto px-8 pt-8 pb-16 space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-cyan-600 tracking-wide uppercase">About Us</p>
          <h1 className="text-4xl md:text-5xl font-bold">Built for Siargao&apos;s trading community</h1>
          <p className="text-lg text-gray-600">
            Siargao Trading Road connects stores and suppliers so the island&apos;s businesses can trade faster, smarter, and with confidence. We focus on reliability, clear communication, and tools that work anywhere on the island.
          </p>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">What drives us</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start space-x-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-cyan-600" />
              <span>Empowering stores with visibility into inventory, pricing, and delivery timing.</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-cyan-600" />
              <span>Helping suppliers expand reach while keeping operations organized and responsive.</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-cyan-600" />
              <span>Building technology that stays simple enough for busy teams to adopt quickly.</span>
            </li>
          </ul>
        </div>
        <div className="space-y-4 pb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Where we&apos;re headed</h2>
          <p className="text-gray-700">
            We are expanding features for deeper analytics, better delivery coordination, and smoother payments so every supplier and store on Siargao can thrive together.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
