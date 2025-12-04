'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, CircularProgress } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import OnboardingDialog from '@/components/OnboardingDialog';
import { analyticsService, DashboardAnalytics } from '@/lib/users';
import { DashboardHeader } from './DashboardHeader';
import { StatCards } from './StatCards';
import { DashboardCharts } from './DashboardCharts';
import { RecentOrdersTable } from './RecentOrdersTable';

export function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      const hasSeenOnboarding = localStorage.getItem('admin_onboarding_completed');
      return !hasSeenOnboarding;
    }
    return false;
  });

  useEffect(() => {
    const redirect = !authLoading && (!user || user.role !== 'admin');
    
    if (redirect) {
      if (user?.role === 'store') {
        router.push('/store/dashboard');
      } else if (user?.role === 'supplier') {
        router.push('/supplier/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      analyticsService.getDashboardAnalytics().then(setAnalytics).catch(console.error).finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <AdminLayout>
      {false && <OnboardingDialog />}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {(authLoading || loading) && (
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Container>
        )}
        {!authLoading && !loading && analytics && (
          <>
            <DashboardHeader />
            <StatCards analytics={analytics} />
            <DashboardCharts analytics={analytics} />
            <RecentOrdersTable analytics={analytics} />
          </>
        )}
      </Container>
    </AdminLayout>
  );
}


