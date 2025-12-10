 'use client';
 
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Footer() {
  const { user, loading } = useAuth();
  const showAdmin = !loading && user?.role === 'admin';

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <Image src="/logo.png" alt="Siargao Trading Road" width={220} height={64} className="h-14 w-auto mb-4" />
            <p className="text-gray-400 leading-relaxed">Connecting businesses across Siargao island, one order at a time.</p>
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {showAdmin && <li><a href="/admin" className="hover:text-cyan-400 transition-colors">Admin</a></li>}
              <li><a href="/supplier/dashboard" className="hover:text-cyan-400 transition-colors">Supplier Site</a></li>
              <li><a href="/store/dashboard" className="hover:text-cyan-400 transition-colors">Store Site</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="/privacy-policy" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms-of-service" className="hover:text-cyan-400 transition-colors">Terms of Service</a></li>
              <li><a href="/cookie-policy" className="hover:text-cyan-400 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">General Luna, Siargao Island, Philippines</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Siargao Trading Road. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
