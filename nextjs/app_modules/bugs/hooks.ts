import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bugsService, BugReport } from '@/lib/bugs';

export function useBugs() {
  const { user } = useAuth();
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [filters, setFilters] = useState<{
    status?: string;
    platform?: string;
  }>({
    status: '',
    platform: '',
  });

  useEffect(() => {
    if (user && user.role === 'admin' && (user.admin_level ?? 1) === 1) {
      loadBugs();
    }
  }, [user, page, filters]);

  const loadBugs = async (isTableRefresh = false) => {
    try {
      if (isTableRefresh) {
        setTableLoading(true);
      } else {
        setLoading(true);
      }
      const response = await bugsService.getBugReports({
        page,
        limit,
        status: filters.status || undefined,
        platform: filters.platform || undefined,
      });
      setBugs(response.data);
      setTotal(response.pagination.total);
      setPages(response.pagination.pages);
    } catch (error) {
      console.error('Failed to load bugs:', error);
    } finally {
      if (isTableRefresh) {
        setTableLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const updateFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const updateBug = async (id: number, updates: { status?: 'open' | 'investigating' | 'fixed' | 'resolved' | 'closed'; notes?: string }) => {
    try {
      const updatedBug = await bugsService.updateBugReport(id, updates);
      setBugs((prevBugs) =>
        prevBugs.map((bug) => (bug.id === id ? updatedBug : bug))
      );
      await loadBugs(true);
    } catch (error) {
      console.error('Failed to update bug:', error);
      throw error;
    }
  };

  return {
    bugs,
    loading,
    tableLoading,
    page,
    setPage,
    limit,
    total,
    pages,
    filters,
    updateFilters,
    loadBugs,
    updateBug,
  };
}

