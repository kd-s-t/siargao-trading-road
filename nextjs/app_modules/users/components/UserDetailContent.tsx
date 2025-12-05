'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  CircularProgress,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { usersService, User, UserAnalytics } from '@/lib/users';
import { UserProfileCard } from './UserProfileCard';
import { UserStatsCards } from './UserStatsCards';
import { UserOrdersTable } from './UserOrdersTable';
import { UserProductsTable } from './UserProductsTable';
import { UserAnalyticsCharts } from './UserAnalyticsCharts';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

export function UserDetailContent() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = Number(params.id);
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const redirect = !authLoading && (!authUser || authUser.role !== 'admin');
    if (redirect) {
      router.push('/login');
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
    if (authUser?.role === 'admin' && userId) {
      loadData();
    }
  }, [authUser, userId, loadData]);

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {(authLoading || loading) && (
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Container>
        )}
        {!authLoading && !loading && authUser && user && analytics && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1">
                  {user.role === 'supplier' ? 'Supplier Details' : user.role === 'store' ? 'Store Details' : 'User Details'}
                </Typography>
              </Box>
            </motion.div>

            <UserProfileCard user={user} />
            <UserStatsCards user={user} analytics={analytics} />

            <Paper sx={{ p: 3, mb: 3 }}>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                <Tab label="Orders History" />
                <Tab label={user.role === 'supplier' ? 'Products Registered' : 'Products Bought'} />
                <Tab label="Analytics" />
              </Tabs>

              {tabValue === 0 && <UserOrdersTable user={user} analytics={analytics} />}
              {tabValue === 1 && <UserProductsTable user={user} analytics={analytics} />}
              {tabValue === 2 && <UserAnalyticsCharts user={user} analytics={analytics} />}
            </Paper>
          </>
        )}
      </Container>
    </AdminLayout>
  );
}

