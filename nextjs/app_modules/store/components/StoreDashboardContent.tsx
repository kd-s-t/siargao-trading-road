'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Typography, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import StoreLayout from '@/components/StoreLayout';
import { useStoreDashboard } from '@/app_modules/store/hooks';
import { StoreDashboardStats } from './StoreDashboardStats';
import { StoreRecentOrders } from './StoreRecentOrders';

export function StoreDashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { analytics, loading } = useStoreDashboard();

  useEffect(() => {
    const redirect = !authLoading && (!user || user.role !== 'store');
    if (redirect) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  return (
    <StoreLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {(authLoading || loading) && (
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Container>
        )}
        {!authLoading && !loading && user && analytics && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography variant="h4" component="h1" gutterBottom>
                Store Dashboard
              </Typography>
            </motion.div>

            <StoreDashboardStats analytics={analytics} />
            <StoreRecentOrders analytics={analytics} />
          </>
        )}
      </Container>
    </StoreLayout>
  );
}

