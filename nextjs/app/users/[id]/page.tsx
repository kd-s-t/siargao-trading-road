'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { usersService, User, UserAnalytics } from '@/lib/users';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function UserDetailPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = Number(params.id);
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.push('/login');
      } else if (authUser.role !== 'admin') {
        router.push('/login');
      }
    }
  }, [authUser, authLoading, router]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [userData, analyticsData] = await Promise.all([
        usersService.getUser(userId),
        usersService.getUserAnalytics(userId),
      ]);
      setUser(userData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (authUser && authUser.role === 'admin' && userId) {
      loadData();
    }
  }, [authUser, userId, loadData]);

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Container>
      </AdminLayout>
    );
  }

  if (!authUser || !user || !analytics) {
    return null;
  }

  const chartData = analytics.recent_orders
    .slice()
    .reverse()
    .map((order) => ({
      date: new Date(order.created_at).toLocaleDateString(),
      amount: order.total_amount,
    }));

  const productData = analytics.products_bought
    .slice(0, 10)
    .map((p) => ({
      name: p.product_name,
      value: user.role === 'supplier' ? (p.stock || 0) : (p.total_spent || 0),
      label: user.role === 'supplier' ? 'Stock' : 'Spent',
    }));

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Typography
              variant="h4"
              component="h1"
              onClick={() => router.push('/users')}
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              ← Back
            </Typography>
            <Typography variant="h4" component="h1">
              User Details
            </Typography>
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                <Typography variant="h6" gutterBottom>
                  {user.name}
                </Typography>
                <Typography color="text.secondary">Email: {user.email}</Typography>
                <Typography color="text.secondary">Phone: {user.phone || '-'}</Typography>
                <Chip
                  label={user.role}
                  color={user.role === 'admin' ? 'error' : user.role === 'supplier' ? 'primary' : 'success'}
                  sx={{ mt: 1 }}
                />
              </Box>
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
                <Typography color="text.secondary">
                  Created: {new Date(user.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Orders
                  </Typography>
                  <Typography variant="h4">
                    {analytics.total_orders}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Earnings
                  </Typography>
                  <Typography variant="h4">
                    ₱{analytics.total_earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    {user.role === 'supplier' ? 'Total Stock' : 'Products Bought'}
                  </Typography>
                  <Typography variant="h4">
                    {analytics.total_products_bought}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    {user.role === 'supplier' ? 'Products Registered' : 'Unique Products'}
                  </Typography>
                  <Typography variant="h4">
                    {analytics.products_bought.length}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Orders History" />
            <Tab label={user.role === 'supplier' ? 'Products Registered' : 'Products Bought'} />
            <Tab label="Analytics" />
          </Tabs>

          {tabValue === 0 && (
            <Box sx={{ mt: 3 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      {user.role === 'supplier' && <TableCell>Store</TableCell>}
                      {user.role === 'store' && <TableCell>Supplier</TableCell>}
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.orders.map((order, index) => (
                      <TableRow
                        key={order.id}
                        component={motion.tr}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/orders/${order.id}`)}
                      >
                        <TableCell>{order.id}</TableCell>
                        {user.role === 'supplier' && (
                          <TableCell>{order.store?.name || '-'}</TableCell>
                        )}
                        {user.role === 'store' && (
                          <TableCell>{order.supplier?.name || '-'}</TableCell>
                        )}
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip label={order.status} size="small" />
                        </TableCell>
                        <TableCell>{order.order_items?.length || 0}</TableCell>
                        <TableCell>₱{order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ mt: 3 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {user.role === 'supplier' ? (
                        <>
                          <TableCell>Product Name</TableCell>
                          <TableCell>SKU</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Stock</TableCell>
                          <TableCell>Unit</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>Product Name</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Total Spent</TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.products_bought.map((product, index) => (
                      <TableRow
                        key={product.product_id}
                        component={motion.tr}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        {user.role === 'supplier' ? (
                          <>
                            <TableCell>{product.product_name}</TableCell>
                            <TableCell>
                              <Chip label={product.sku || '-'} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              {product.category ? (
                                <Chip label={product.category} size="small" />
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell align="right">
                              ₱{(product.price ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={product.stock ?? 0}
                                size="small"
                                color={(product.stock ?? 0) > 0 ? 'success' : 'error'}
                              />
                            </TableCell>
                            <TableCell>{product.unit || '-'}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{product.product_name}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>₱{product.total_spent?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {tabValue === 2 && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                  <Typography variant="h6" gutterBottom>
                    Earnings Over Time
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Line
                      data={{
                        labels: chartData.map((d) => d.date),
                        datasets: [
                          {
                            label: 'Amount',
                            data: chartData.map((d) => d.amount),
                            borderColor: '#8884d8',
                            backgroundColor: 'rgba(136, 132, 216, 0.1)',
                            tension: 0.4,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: true,
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                  <Typography variant="h6" gutterBottom>
                    {user.role === 'supplier' ? 'Product Stock Levels' : 'Top Products'}
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Bar
                      data={{
                        labels: productData.map((d) => d.name),
                        datasets: [
                          {
                            label: user.role === 'supplier' ? 'Stock' : 'Spent',
                            data: productData.map((d) => d.value),
                            backgroundColor: '#82ca9d',
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: true,
                          },
                        },
                        scales: {
                          x: {
                            ticks: {
                              maxRotation: 45,
                              minRotation: 45,
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </AdminLayout>
  );
}

