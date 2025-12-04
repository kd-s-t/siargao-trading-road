'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Link,
} from '@mui/material';
import Image from 'next/image';
import { mobileAuthService } from '../services/mobileApi';
import { LoginResponse, User } from '@/lib/auth';

interface MobileLoginProps {
  onLoginSuccess: (response: LoginResponse) => void;
  onSwitchToRegister?: () => void;
}

export function MobileLogin({ onLoginSuccess, onSwitchToRegister }: MobileLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await mobileAuthService.login(email, password);
      if (response.user.role === 'admin') {
        setError('Admin accounts cannot login in mobile simulator');
        setLoading(false);
        return;
      }
      sessionStorage.setItem('mobile_token', response.token);
      onLoginSuccess(response);
      setEmail('');
      setPassword('');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        p: 2.5,
        overflow: 'auto',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 2,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Image
            src="/logo.png"
            alt="Siargao Trading Road Logo"
            width={200}
            height={80}
            style={{ height: 80, width: 'auto' }}
          />
        </Box>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3, opacity: 0.7 }}>
          Sign in to continue
        </Typography>

        {error && (
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: 1,
              bgcolor: '#ffebee',
            }}
          >
            <Typography color="error" align="center" variant="body2">
              {error}
            </Typography>
          </Paper>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            disabled={loading}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            disabled={loading}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 1, py: 1 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </form>

        {onSwitchToRegister && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={onSwitchToRegister}
                sx={{ cursor: 'pointer' }}
              >
                Register
              </Link>
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

