'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Paper, CircularProgress, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { useBugs } from '../hooks';
import { BugsHeader } from './BugsHeader';
import { BugsFilters } from './BugsFilters';
import { BugsTable } from './BugsTable';
import { BugsPagination } from './BugsPagination';

export function BugsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    bugs,
    loading,
    tableLoading,
    page,
    setPage,
    total,
    pages,
    filters,
    updateFilters,
    updateBug,
  } = useBugs();

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
            <BugsHeader total={total} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Paper sx={{ p: 3, mt: 2 }}>
                <BugsFilters filters={filters} onFiltersChange={updateFilters} />

                <Box sx={{ position: 'relative' }}>
                  {tableLoading && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(255, 255, 255, 0.7)',
                        zIndex: 1,
                      }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  )}
                  <BugsTable bugs={bugs} onUpdate={updateBug} />
                </Box>

                {bugs.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      No bug reports found
                    </Typography>
                  </Box>
                )}

                {pages > 1 && (
                  <BugsPagination
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

