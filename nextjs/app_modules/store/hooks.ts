import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersService, UserAnalytics } from '@/lib/users';

export function useStoreDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'store') {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await usersService.getMyAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return { analytics, loading };
}

