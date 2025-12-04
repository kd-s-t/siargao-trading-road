'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Paper, CircularProgress, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { useAuditLogs } from '../hooks';
import { AuditLogsHeader } from './AuditLogsHeader';
import { AuditLogsFilters } from './AuditLogsFilters';
import { AuditLogsTable } from './AuditLogsTable';
import { AuditLogsPagination } from './AuditLogsPagination';

export function AuditLogsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    auditLogs,
    loading,
    page,
    setPage,
    total,
    pages,
    filters,
    updateFilters,
  } = useAuditLogs();

  useEffect(() => {
    const redirect = !authLoading && (!user || user.role !== 'admin' || (user.admin_level ?? 1) !== 1);
    if (redirect) {
      if (user?.role !== 'admin') {
        router.push('/login');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {(authLoading || loading) && (
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Container>
        )}
        {!authLoading && !loading && user && (user.admin_level ?? 1) === 1 && (
          <>
            <AuditLogsHeader total={total} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Paper sx={{ p: 3, mt: 2 }}>
                <AuditLogsFilters filters={filters} onFiltersChange={updateFilters} />

                <AuditLogsTable auditLogs={auditLogs} />

                {auditLogs.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      No audit logs found
                    </Typography>
                  </Box>
                )}

                {pages > 1 && (
                  <AuditLogsPagination
                    page={page}
                    pages={pages}
                    onPageChange={setPage}
                  />
                )}
              </Paper>
            </motion.div>
          </>
        )}
      </Container>
    </AdminLayout>
  );
}

