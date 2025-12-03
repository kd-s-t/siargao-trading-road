'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Paper, CircularProgress, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { useUsers, useUserForm } from '@/app_modules/users/hooks';
import { UserHeader } from './UserHeader';
import { UserSearchBar } from './UserSearchBar';
import { UserTable } from './UserTable';
import { RegisterUserDialog } from './RegisterUserDialog';

export function UsersContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { users, loading, loadUsers } = useUsers();
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
  } = useUserForm();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const redirect = !authLoading && (!user || user.role !== 'admin');
    redirect && (user?.role === 'store' ? router.push('/store/dashboard') : user?.role === 'supplier' ? router.push('/supplier/dashboard') : router.push('/login'));
  }, [user, authLoading, router]);

  const adminLevel = user?.admin_level ?? 1;
  const canCreateUsers = adminLevel <= 2;

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegisterClick = async () => {
    await handleRegister(() => {
      loadUsers();
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
        {!authLoading && !loading && user && (
          <>
            <UserHeader canCreateUsers={canCreateUsers} onRegisterClick={handleOpenDialog} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Paper sx={{ p: 3, mt: 2 }}>
                <UserSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

                <UserTable users={filteredUsers} />

                {filteredUsers.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      No users found
                    </Typography>
                  </Box>
                )}
              </Paper>
            </motion.div>

            <RegisterUserDialog
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

