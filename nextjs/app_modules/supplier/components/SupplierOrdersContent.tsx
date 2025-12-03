'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Box,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import SupplierLayout from '@/components/SupplierLayout';
import { ordersService, Order } from '@/lib/users';

export function SupplierOrdersContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const redirect = !authLoading && (!user || user.role !== 'supplier');
    redirect && router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    user?.role === 'supplier' && (async () => {
      try {
        setLoading(true);
        const data = await ordersService.getOrders();
        setOrders(data);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toString().includes(searchTerm) ||
      o.store?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
    const statusMap: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
      'delivered': 'success',
      'in_transit': 'info',
      'preparing': 'warning',
      'cancelled': 'error',
    };
    return statusMap[status.toLowerCase()] || 'default';
  };

  return (
    <SupplierLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {(authLoading || loading) && (
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Container>
        )}
        {!authLoading && !loading && user && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography variant="h4" component="h1" gutterBottom>
                My Orders
              </Typography>
            </motion.div>

            <Paper sx={{ p: 3, mt: 2 }}>
              <TextField
                fullWidth
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Store</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Total Amount</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id} hover>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>{order.store?.name || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.status.replace('_', ' ')}
                            color={getStatusColor(order.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          ₱{order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="primary"
                            sx={{ cursor: 'pointer' }}
                            onClick={() => router.push(`/supplier/orders/${order.id}`)}
                          >
                            View Details
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredOrders.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    No orders found
                  </Typography>
                </Box>
              )}
            </Paper>
          </>
        )}
      </Container>
    </SupplierLayout>
  );
}

