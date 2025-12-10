import Header from '@/components/marketing/Header';
import Footer from '@/components/marketing/Footer';
import { getDownloadUrls } from '@/components/marketing/downloads';

export default function CookiePolicyPage() {
  const downloadUrls = getDownloadUrls();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header downloadUrls={downloadUrls} variant="light" />
      <main className="max-w-4xl mx-auto px-8 pt-8 pb-16 space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-cyan-600 tracking-wide uppercase">Cookie Policy</p>
          <h1 className="text-4xl md:text-5xl font-bold">How we use cookies</h1>
          <p className="text-lg text-gray-600">
            Cookies help us keep sessions secure, remember preferences, and understand product usage so we can improve reliability.
          </p>
        </div>
        <div className="space-y-4 text-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900">Types of cookies</h2>
          <ul className="space-y-3">
            <li>Essential cookies for authentication, security, and load balancing.</li>
            <li>Preference cookies to remember settings like language and saved filters.</li>
            <li>Analytics cookies to measure feature adoption and performance.</li>
          </ul>
        </div>
        <div className="space-y-4 text-gray-700 pb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Managing cookies</h2>
          <p>You can clear or block cookies in your browser settings. Some features may not work correctly without essential cookies.</p>
        </div>
        <p className="text-sm text-gray-500">Last updated: {new Date().getFullYear()}</p>
      </main>
      <Footer />
      </div>
  );
}
