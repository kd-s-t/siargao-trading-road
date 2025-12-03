'use client';

import { Container, Paper, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { useLogin } from '@/app_modules/login/hooks';
import { LoginLogo } from './LoginLogo';
import { LoginForm } from './LoginForm';

export function LoginContent() {
  const {
    formData,
    setFormData,
    showPassword,
    error,
    loading,
    handleSubmit,
    togglePasswordVisibility,
    setError,
  } = useLogin();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a3a5f 0%, #38b2ac 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={24}
            sx={{
              p: { xs: 3, sm: 5 },
              width: '100%',
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <LoginLogo />

            <LoginForm
              formData={formData}
              showPassword={showPassword}
              error={error}
              loading={loading}
              onFormDataChange={setFormData}
              onTogglePassword={togglePasswordVisibility}
              onSubmit={handleSubmit}
              onErrorDismiss={() => setError('')}
            />
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}

