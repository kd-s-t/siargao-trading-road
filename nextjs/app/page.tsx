'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import {
  ShoppingBag,
  TrendingUp,
  Package,
  ShoppingCart,
  BarChart3,
  Smartphone,
  Zap,
  Users,
  UserPlus,
  Search,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/marketing/Header';
import Footer from '@/components/marketing/Footer';
import { getDownloadUrls } from '@/components/marketing/downloads';
import api from '@/lib/api';

const features = [
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Track your products in real-time with smart inventory controls and low-stock alerts.',
    color: 'from-orange-400 to-orange-600',
  },
  {
    icon: ShoppingCart,
    title: 'Easy Ordering',
    description: 'Place and manage orders with just a few taps. Streamlined checkout for faster transactions.',
    color: 'from-green-400 to-green-600',
  },
  {
    icon: BarChart3,
    title: 'Business Analytics',
    description: 'Gain insights with powerful analytics. Track sales, trends, and performance metrics.',
    color: 'from-blue-400 to-blue-600',
  },
  {
    icon: Users,
    title: 'Supplier Network',
    description: 'Connect with verified suppliers across Siargao. Build lasting business relationships.',
    color: 'from-purple-400 to-purple-600',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Manage your business on the go with our intuitive mobile app for iOS and Android.',
    color: 'from-pink-400 to-pink-600',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized for speed and reliability. Experience seamless performance even offline.',
    color: 'from-yellow-400 to-yellow-600',
  },
];

const steps = [
  {
    icon: UserPlus,
    title: 'Sign Up',
    description: 'Create your free account in seconds. No credit card required.',
  },
  {
    icon: Search,
    title: 'Browse Suppliers',
    description: 'Discover local suppliers and their product catalogs.',
  },
  {
    icon: ShoppingBag,
    title: 'Place Orders',
    description: 'Add products to cart and complete orders seamlessly.',
  },
  {
    icon: TrendingUp,
    title: 'Grow Your Business',
    description: 'Track performance and scale with data-driven insights.',
  },
];

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
} satisfies Variants;

const stagger = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
} satisfies Variants;

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState({
    total_users: 0,
    total_suppliers: 0,
    total_orders: 0,
  });
  const downloadUrls = getDownloadUrls();
  const showLanding = !loading && !user;

  useEffect(() => {
    if (!loading) {
      if (user && user.role === 'admin') {
        router.push('/dashboard');
      } else if (user) {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!showLanding) return;
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/public/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };
    fetchMetrics();
  }, [showLanding]);

  if (loading || !showLanding) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-800 hero-animated">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtNi42MjcgNS4zNzMtMTIgMTItMTJzMTIgNS4zNzMgMTIgMTItNS4zNzMgMTItMTIgMTItMTItNS4zNzMtMTItMTJ6TTAgNDRjMC02LjYyNyA1LjM3My0xMiAxMi0xMnMxMiA1LjM3MyAxMiAxMi01LjM3MyAxMi0xMiAxMi0xMi01LjM3My0xMi0xMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <Header downloadUrls={downloadUrls} variant="hero" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-12 sm:pt-20 md:pt-28 lg:pt-28 lg:pb-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div className="space-y-6 sm:space-y-8 text-center lg:text-left relative z-10 order-2 lg:order-1" initial="hidden" animate="show" variants={stagger}>
              <motion.h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight" variants={fadeIn}>
                Connect. Trade.<br />
                <span className="text-cyan-200">Grow Together.</span>
              </motion.h1>
              <motion.p className="text-lg sm:text-xl md:text-2xl text-blue-100 leading-relaxed px-4 sm:px-0" variants={fadeIn}>
                The ultimate platform connecting suppliers and stores in Siargao. Manage inventory, place orders, and scale your island business effortlessly.
              </motion.p>
              <motion.div className="flex flex-col sm:flex-row gap-4 pt-6 sm:pt-8 justify-center lg:justify-start px-4 sm:px-0" variants={fadeIn}>
                <a
                  href="#download"
                  className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 rounded-full font-semibold text-base sm:text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>Get Started Free</span>
                  <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#features"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold text-base sm:text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 text-center cursor-pointer"
                >
                  Learn More
                </a>
              </motion.div>
            </motion.div>
            <motion.div
              className="relative flex justify-center items-center h-[400px] sm:h-[500px] md:h-[550px] lg:h-[600px] order-1 lg:order-2 mb-8 lg:mb-0 lg:ml-10"
              initial="hidden"
              animate="show"
              style={{ paddingLeft: 80, paddingTop: 50}}
              variants={stagger}
            >
              <motion.div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg h-full" variants={fadeIn}>
                <motion.img
                  src="/s1.png"
                  alt="App screenshot 1"
                  className="absolute top-0 left-0 w-40 sm:w-48 md:w-52 lg:w-56 rounded-3xl shadow-2xl z-10"
                  initial={{ opacity: 0, x: -50, rotate: -8 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    rotate: -8,
                    y: [0, -10, 0]
                  }}
                  transition={{ 
                    opacity: { duration: 0.6, delay: 0.2 },
                    x: { duration: 0.6, delay: 0.2 },
                    y: { 
                      duration: 3, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }
                  }}
                  whileHover={{ scale: 1.05, rotate: -5, zIndex: 40 }}
                />
                <motion.img
                  src="/s2.png"
                  alt="App screenshot 2"
                  className="absolute top-5 sm:top-6 md:top-8 left-10 sm:left-12 md:left-14 w-40 sm:w-48 md:w-52 lg:w-56 rounded-3xl shadow-2xl z-20"
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ 
                    opacity: 1, 
                    y: [0, -10, 0]
                  }}
                  transition={{ 
                    opacity: { duration: 0.6, delay: 0.4 },
                    y: { 
                      duration: 3, 
                      delay: 0.4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                  whileHover={{ scale: 1.05, zIndex: 40 }}
                />
                <motion.img
                  src="/s3.png"
                  alt="App screenshot 3"
                  className="absolute top-10 sm:top-12 md:top-16 left-20 sm:left-24 md:left-28 w-40 sm:w-48 md:w-52 lg:w-56 rounded-3xl shadow-2xl z-30"
                  initial={{ opacity: 0, x: 50, rotate: 8 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    rotate: 8,
                    y: [0, -10, 0]
                  }}
                  transition={{ 
                    opacity: { duration: 0.6, delay: 0.6 },
                    x: { duration: 0.6, delay: 0.6 },
                    y: { 
                      duration: 3, 
                      repeat: Infinity, 
                      delay: 1,
                      ease: "easeInOut" 
                    }
                  }}
                  whileHover={{ scale: 1.05, rotate: 5, zIndex: 40 }}
                />
              </motion.div>
            </motion.div>
          </div>
          <motion.div 
            className="pt-4 sm:pt-6 pb-8 sm:pb-12 flex flex-wrap gap-6 sm:gap-8 text-white/90 justify-center"
            initial="hidden"
            animate="show"
            variants={stagger}
          >
            <motion.div variants={fadeIn} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold">{`${metrics.total_users}+`}</div>
              <div className="text-xs sm:text-sm text-blue-200">Active Users</div>
            </motion.div>
            <motion.div variants={fadeIn} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold">{`${metrics.total_suppliers}+`}</div>
              <div className="text-xs sm:text-sm text-blue-200">Suppliers</div>
            </motion.div>
            <motion.div variants={fadeIn} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold">{`${metrics.total_orders}+`}</div>
              <div className="text-xs sm:text-sm text-blue-200">Orders Completed</div>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-gradient-to-t from-white to-transparent" />
        <div 
          className="absolute bottom-6 sm:bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce hidden sm:block cursor-pointer"
          onClick={() => {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <div className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white rounded-full" />
          </div>
        </div>
      </div>

      <div id="features" className="py-12 sm:py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4 sm:px-0">Everything You Need to Succeed</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">Powerful features designed specifically for Siargao&apos;s trading community</p>
          </div>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-items-center sm:justify-items-stretch"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 w-full max-w-sm sm:max-w-none"
                variants={fadeIn}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center sm:text-left">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-center sm:text-left">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="py-12 sm:py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4 sm:px-0">How It Works</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">Get started in four simple steps</p>
          </div>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 justify-items-center sm:justify-items-stretch"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            {steps.map((step, index) => (
              <motion.div key={step.title} className="relative w-full max-w-xs sm:max-w-none" variants={fadeIn}>
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-xl mx-auto">
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-30 -z-10" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <div id="download" className="py-12 sm:py-16 md:py-24 bg-gradient-to-br from-cyan-500 via-blue-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE2YzAtNi42MjcgNS4zNzMtMTIgMTItMTJzMTIgNS4zNzMgMTIgMTItNS4zNzMgMTItMTIgMTItMTItNS4zNzMtMTItMTJ6TTAgNDRjMC02LjYyNyA1LjM3My0xMiAxMi0xMnMxMiA1LjM3MyAxMiAxMi01LjM3MyAxMi0xMiAxMi0xMi01LjM3My0xMi0xMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <motion.div
          className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <motion.div className="inline-block mb-4 sm:mb-6" variants={fadeIn}>
            <Smartphone className="w-12 h-12 sm:w-16 sm:h-16 text-white/90" />
          </motion.div>
          <motion.h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 px-4 sm:px-0" variants={fadeIn}>Ready to Transform Your Business?</motion.h2>
          <motion.p className="text-base sm:text-lg md:text-xl text-blue-100 mb-8 sm:mb-12 max-w-2xl mx-auto px-4 sm:px-0" variants={fadeIn}>
            Join hundreds of businesses already using Siargao Trading Road. Download our app today and start growing.
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center items-center" variants={fadeIn}>
            <a
              href={downloadUrls.android}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-black hover:bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl flex items-center space-x-3 transform hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-300">GET IT ON</div>
                <div className="text-lg font-semibold">Google Play</div>
              </div>
            </a>
            <a
              href="#"
              className="group bg-black hover:bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl flex items-center space-x-3 transform hover:scale-105 transition-all duration-300 shadow-2xl relative overflow-hidden"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-300">COMING SOON</div>
                <div className="text-lg font-semibold">App Store</div>
              </div>
              <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-[1px] flex items-center justify-center">
                <span className="text-xs font-semibold text-white px-3 py-1 bg-blue-500 rounded-full">Coming Soon</span>
              </div>
            </a>
          </motion.div>
          <motion.div className="mt-12 pt-12 border-t border-white/20" variants={fadeIn}>
            <p className="text-blue-100 text-sm">Available for Android now. iOS version launching soon.</p>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
