'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Paper,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    THREE: any;
    VANTA: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      WAVES: (options: any) => any;
    };
  }
}

const APP_DOWNLOAD_URL = process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || 'https://your-s3-bucket.s3.amazonaws.com/app.apk';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showLanding, setShowLanding] = useState(false);
  const vantaRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    if (!loading) {
      if (user && user.role === 'admin') {
        router.push('/dashboard');
      } else if (user) {
        router.push('/login');
      } else {
        setTimeout(() => setShowLanding(true), 0);
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    let mounted = true;
    
    if (typeof window !== 'undefined' && vantaRef.current && showLanding) {
      const loadScript = (src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
          }
          const script = document.createElement('script');
          script.src = src;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
          document.head.appendChild(script);
        });
      };

      loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js')
        .then(() => {
          if (!mounted) return;
          return loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js');
        })
        .then(() => {
          if (!mounted || !vantaRef.current) return;
          
          if (!window.THREE) {
            console.error('THREE.js not available on window');
            return;
          }
          
          if (vantaEffect.current) {
            vantaEffect.current.destroy();
          }
          
          if (window.VANTA && window.VANTA.WAVES) {
            try {
              vantaEffect.current = window.VANTA.WAVES({
                el: vantaRef.current,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00,
                scale: 1.00,
                scaleMobile: 1.00,
                color: 0x1a3a5f,
                shininess: 100.00,
                waveHeight: 25.00,
                waveSpeed: 1.25,
                zoom: 0.65,
              });
            } catch (error) {
              console.error('Error initializing Vanta.js:', error);
            }
          }
        })
        .catch((error) => {
          console.error('Error loading Vanta.js scripts:', error);
        });
    }
    
    return () => {
      mounted = false;
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
      }
    };
  }, [showLanding]);

  if (loading || !showLanding) {
    return null;
  }

  const features = [
    {
      icon: <StoreIcon sx={{ fontSize: 40 }} />,
      title: 'Supplier Management',
      description: 'Register and manage your products with ease. Upload via Excel, JSON, or manual entry.',
    },
    {
      icon: <ShoppingCartIcon sx={{ fontSize: 40 }} />,
      title: 'Siargao Trading Road',
      description: 'Connect with suppliers and stores. Browse products and place orders.',
    },
    {
      icon: <InventoryIcon sx={{ fontSize: 40 }} />,
      title: 'Product Management',
      description: 'Full CRUD operations with inventory tracking and soft delete capabilities.',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      title: 'Analytics Dashboard',
      description: 'Track orders, earnings, and sales with comprehensive analytics and reports.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Secure Authentication',
      description: 'JWT-based secure authentication system protecting your data and transactions.',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Fast & Reliable',
      description: 'Built with modern technologies for optimal performance and user experience.',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', position: 'relative' }}>
      <Box
        ref={vantaRef}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '60vh',
          zIndex: 0,
          backgroundColor: '#1a3a5f',
          '& canvas': {
            display: 'block !important',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          },
        }}
      />
      
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent', color: 'text.primary', position: 'relative', zIndex: 1 }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <Image src="/logo.png" alt="Logo" width={150} height={40} style={{ height: 40, width: 'auto' }} />
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h5"
              sx={{ mb: 2, maxWidth: 600, mx: 'auto', fontWeight: 500, color: 'white' }}
            >
              Siargao Trading Road
            </Typography>
            <Typography
              variant="body1"
              sx={{ mb: 4, maxWidth: 600, mx: 'auto', fontSize: '1.1rem', color: 'white' }}
            >
              Connecting suppliers and stores in Siargao. Manage products, place orders, and grow your business.
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<DownloadIcon />}
              href={APP_DOWNLOAD_URL}
              download
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: 4,
                '&:hover': {
                  boxShadow: 6,
                },
              }}
            >
              Download Mobile App
            </Button>
          </motion.div>
        </Box>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 8,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 3,
            }}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
              <Box sx={{ width: { xs: '100%', md: 'calc(66.666% - 16px)' } }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                  Get Started Today
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                  Download our mobile app to start connecting with suppliers and stores.
                  Available for Android devices.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<DownloadIcon />}
                  href={APP_DOWNLOAD_URL}
                  download
                  sx={{
                    bgcolor: 'background.paper',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'background.paper',
                      opacity: 0.9,
                    },
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Download APK
                </Button>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        <Box sx={{ py: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Typography
              variant="h3"
              component="h2"
              gutterBottom
              sx={{ textAlign: 'center', mb: 6, fontWeight: 600 }}
            >
              Features
            </Typography>
          </motion.div>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {features.map((feature, index) => (
              <Box key={index} sx={{ width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.333% - 22px)' } }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                >
                  <Card
                    elevation={2}
                    sx={{
                      height: '100%',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: 6,
                      },
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Box sx={{ color: 'primary.main', mb: 2 }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ py: 8, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Ready to Get Started?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Download the mobile app and join Siargao Trading Road today.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<DownloadIcon />}
              href={APP_DOWNLOAD_URL}
              download
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: 4,
                '&:hover': {
                  boxShadow: 6,
                },
              }}
            >
              Download Now
            </Button>
          </motion.div>
        </Box>
      </Container>

      <Box
        component="footer"
        sx={{
          py: 4,
          mt: 8,
          borderTop: 1,
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Siargao Trading Road. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
