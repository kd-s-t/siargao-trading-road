import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auditLogsService, AuditLog } from '@/lib/audit_logs';

export function useAuditLogs() {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [filters, setFilters] = useState<{
    role?: string;
    user_id?: string;
    endpoint?: string;
  }>({});

  useEffect(() => {
    if (user && user.role === 'admin' && (user.admin_level ?? 1) === 1) {
      loadAuditLogs();
    }
  }, [user, page, filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await auditLogsService.getAuditLogs({
        page,
        limit,
        ...filters,
      });
      setAuditLogs(response.data);
      setTotal(response.pagination.total);
      setPages(response.pagination.pages);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  return {
    auditLogs,
    loading,
    page,
    setPage,
    limit,
    total,
    pages,
    filters,
    updateFilters,
    loadAuditLogs,
  };
}

