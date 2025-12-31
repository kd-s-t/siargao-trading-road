'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Paper, CircularProgress, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { useOrders, useOrderFilters } from '@/app_modules/orders/hooks';
import { OrderHeader } from './OrderHeader';
import { OrderSearchBar } from './OrderSearchBar';
import { OrderTable } from './OrderTable';

export function OrdersContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { orders, loading } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const { filteredOrders } = useOrderFilters(orders, searchTerm);

  useEffect(() => {
    const redirect = !authLoading && (!user || user.role !== 'admin');
    if (redirect) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {(authLoading || loading) && (
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Container>
        )}
        {!authLoading && !loading && user && (
          <>
            <OrderHeader />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Paper sx={{ p: 3, mt: 2 }}>
                <OrderSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

                <OrderTable orders={filteredOrders} />

                {filteredOrders.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      No orders found
                    </Typography>
                  </Box>
                )}
              </Paper>
            </motion.div>
          </>
        )}
      </Container>
    </AdminLayout>
  );
}

