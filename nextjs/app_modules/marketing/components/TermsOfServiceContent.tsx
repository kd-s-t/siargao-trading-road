import Header from '@/components/marketing/Header';
import Footer from '@/components/marketing/Footer';
import { getDownloadUrls } from '@/components/marketing/downloads';

export function TermsOfServiceContent() {
  const downloadUrls = getDownloadUrls();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header downloadUrls={downloadUrls} variant="light" />
      <main className="max-w-4xl mx-auto px-8 pt-8 pb-16 space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-cyan-600 tracking-wide uppercase">Terms of Service</p>
          <h1 className="text-4xl md:text-5xl font-bold">Guidelines for using the platform</h1>
          <p className="text-lg text-gray-600">
            These terms outline account responsibilities, acceptable use, and service boundaries for suppliers and stores using Siargao Trading Road.
          </p>
        </div>
        <div className="space-y-4 text-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900">Your commitments</h2>
          <ul className="space-y-3">
            <li>Provide accurate business information and keep account credentials secure.</li>
            <li>Use the platform only for lawful trading activity within your organization.</li>
            <li>Respect intellectual property rights and confidential data shared through the platform.</li>
            <li>Notify the team immediately about suspected unauthorized access.</li>
          </ul>
        </div>
        <div className="space-y-4 text-gray-700 pb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Service</h2>
          <p>The platform is provided as-is with commercially reasonable uptime targets. Planned maintenance windows are communicated in advance whenever possible.</p>
        </div>
        <p className="text-sm text-gray-500">Last updated: {new Date().getFullYear()}</p>
      </main>
      <Footer />
    </div>
  );
}
