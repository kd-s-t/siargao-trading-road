'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Paper, CircularProgress, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { useAdmins, useAdminForm } from '@/app_modules/admins/hooks';
import { AdminHeader } from './AdminHeader';
import { AdminSearchBar } from './AdminSearchBar';
import { AdminTable } from './AdminTable';
import { RegisterAdminDialog } from './RegisterAdminDialog';

export function AdminsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { admins, loading, loadAdmins } = useAdmins();
  const {
    openDialog,
    registering,
    error,
    formData,
    setFormData,
    setError,
    handleOpenDialog,
    handleCloseDialog,
    handleRegister,
  } = useAdminForm();
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.admin_level && a.admin_level.toString().includes(searchTerm))
  );

  const handleRegisterClick = async () => {
    await handleRegister(() => {
      loadAdmins();
    });
  };

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {(authLoading || loading) && (
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Container>
        )}
        {!authLoading && !loading && user && (user.admin_level ?? 1) === 1 && (
          <>
            <AdminHeader onRegisterClick={handleOpenDialog} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Paper sx={{ p: 3, mt: 2 }}>
                <AdminSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

                <AdminTable admins={filteredAdmins} />

                {filteredAdmins.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      No admins found
                    </Typography>
                  </Box>
                )}
              </Paper>
            </motion.div>

            <RegisterAdminDialog
              open={openDialog}
              registering={registering}
              error={error}
              formData={formData}
              onClose={handleCloseDialog}
              onRegister={handleRegisterClick}
              onFormDataChange={setFormData}
              onErrorDismiss={() => setError('')}
            />
          </>
        )}
      </Container>
    </AdminLayout>
  );
}

