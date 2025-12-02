'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Filler,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import OnboardingDialog from '@/components/OnboardingDialog';
import { analyticsService, DashboardAnalytics } from '@/lib/users';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        if (user.role === 'store') {
          router.push('/store/dashboard');
        } else if (user.role === 'supplier') {
          router.push('/supplier/dashboard');
        } else {
          router.push('/login');
        }
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getDashboardAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Container>
      </AdminLayout>
    );
  }

  if (!user || !analytics) {
    return null;
  }

  const averageOrderValue = analytics.total_orders > 0 
    ? analytics.total_earnings / analytics.total_orders 
    : 0;

  const statusCounts = analytics.recent_orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusLabels = Object.keys(statusCounts);
  const statusData = Object.values(statusCounts);
  const statusColors = {
    delivered: '#4caf50',
    in_transit: '#2196f3',
    preparing: '#ff9800',
    cancelled: '#f44336',
    draft: '#9e9e9e',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const last7Days = analytics.daily_stats.slice(-7);
  const last30DaysTotal = analytics.daily_stats.reduce((sum, stat) => sum + stat.orders, 0);
  const last7DaysTotal = last7Days.reduce((sum, stat) => sum + stat.orders, 0);
  const last30DaysEarnings = analytics.daily_stats.reduce((sum, stat) => sum + stat.earnings, 0);
  const last7DaysEarnings = last7Days.reduce((sum, stat) => sum + stat.earnings, 0);

  return (
    <AdminLayout>
      <OnboardingDialog />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
        </motion.div>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {analytics.total_users}
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
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Suppliers
                  </Typography>
                  <Typography variant="h4">
                    {analytics.total_suppliers}
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
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Stores
                  </Typography>
                  <Typography variant="h4">
                    {analytics.total_stores}
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
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Orders
                  </Typography>
                  <Typography variant="h4">
                    {analytics.total_orders}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Earnings
                  </Typography>
                  <Typography variant="h5" color="primary">
                    ₱{analytics.total_earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Average Order Value
                  </Typography>
                  <Typography variant="h5">
                    ₱{averageOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Last 7 Days Orders
                  </Typography>
                  <Typography variant="h5">
                    {last7DaysTotal}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ₱{last7DaysEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Daily Orders (Last 30 Days)
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Bar
                    data={{
                      labels: analytics.daily_stats.map((stat) => formatDate(stat.date)),
                      datasets: [
                        {
                          label: 'Orders',
                          data: analytics.daily_stats.map((stat) => stat.orders),
                          backgroundColor: '#38b2ac',
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        x: {
                          ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                          },
                        },
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1,
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </Paper>
            </motion.div>
          </Box>
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Daily Earnings (Last 30 Days)
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Line
                    data={{
                      labels: analytics.daily_stats.map((stat) => formatDate(stat.date)),
                      datasets: [
                        {
                          label: 'Earnings',
                          data: analytics.daily_stats.map((stat) => stat.earnings),
                          borderColor: '#38b2ac',
                          backgroundColor: 'rgba(56, 178, 172, 0.1)',
                          fill: true,
                          tension: 0.4,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        x: {
                          ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                          },
                        },
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return '₱' + value.toLocaleString();
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </Paper>
            </motion.div>
          </Box>
        </Box>

        {statusLabels.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
            <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Order Status Distribution
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Doughnut
                      data={{
                        labels: statusLabels.map(s => s.replace('_', ' ').toUpperCase()),
                        datasets: [
                          {
                            data: statusData,
                            backgroundColor: statusLabels.map(s => statusColors[s as keyof typeof statusColors] || '#9e9e9e'),
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </motion.div>
            </Box>
            <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
              >
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Order Status Summary
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {statusLabels.map((status, index) => (
                      <Box key={status} sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              bgcolor: statusColors[status as keyof typeof statusColors] || '#9e9e9e',
                            }}
                          />
                          <Typography variant="body1">
                            {status.replace('_', ' ').toUpperCase()}
                          </Typography>
                        </Box>
                        <Typography variant="h6">
                          {statusCounts[status]}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </motion.div>
            </Box>
          </Box>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Orders
              </Typography>
              <Typography
                variant="body2"
                color="primary"
                sx={{ cursor: 'pointer' }}
                onClick={() => router.push('/orders')}
              >
                View All
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Store</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.recent_orders.slice(0, 10).map((order, index) => (
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
                      <TableCell>{order.store?.name || '-'}</TableCell>
                      <TableCell>{order.supplier?.name || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status.replace('_', ' ')}
                          size="small"
                          color={
                            order.status === 'delivered'
                              ? 'success'
                              : order.status === 'in_transit'
                              ? 'info'
                              : order.status === 'preparing'
                              ? 'warning'
                              : order.status === 'cancelled'
                              ? 'error'
                              : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{order.order_items?.length || 0}</TableCell>
                      <TableCell>₱{order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="primary"
                          sx={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/orders/${order.id}`);
                          }}
                        >
                          View Details
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {analytics.recent_orders.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No orders found
                </Typography>
              </Box>
            )}
          </Paper>
        </motion.div>
      </Container>
    </AdminLayout>
  );
}
