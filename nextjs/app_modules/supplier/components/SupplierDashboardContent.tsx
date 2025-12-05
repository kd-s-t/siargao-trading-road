'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Typography, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import SupplierLayout from '@/components/SupplierLayout';
import { useSupplierDashboard } from '@/app_modules/supplier/hooks';
import { SupplierDashboardStats } from './SupplierDashboardStats';
import { SupplierRecentOrders } from './SupplierRecentOrders';

export function SupplierDashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { analytics, loading } = useSupplierDashboard();

  useEffect(() => {
    const redirect = !authLoading && (!user || user.role !== 'supplier');
    if (redirect) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  return (
    <SupplierLayout>
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
                Supplier Dashboard
              </Typography>
            </motion.div>

            <SupplierDashboardStats analytics={analytics} />
            <SupplierRecentOrders analytics={analytics} />
          </>
        )}
      </Container>
    </SupplierLayout>
  );
}

