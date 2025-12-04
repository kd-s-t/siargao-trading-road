'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  MenuItem,
  Link,
} from '@mui/material';
import Image from 'next/image';
import { mobileAuthService } from '../services/mobileApi';
import { LoginResponse } from '@/lib/auth';

interface MobileRegisterProps {
  onRegisterSuccess: (response: LoginResponse) => void;
  onSwitchToLogin: () => void;
}

export function MobileRegister({ onRegisterSuccess, onSwitchToLogin }: MobileRegisterProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'supplier' | 'store'>('supplier');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePhilippineMobile = (mobile: string): boolean => {
    const cleaned = mobile.replace(/\D/g, '');
    if (cleaned.startsWith('63')) {
      return cleaned.length === 12 && cleaned.substring(2, 3) === '9';
    }
    if (cleaned.startsWith('0')) {
      return cleaned.length === 11 && cleaned.substring(1, 2) === '9';
    }
    return cleaned.length === 10 && cleaned.startsWith('9');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !phone) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!validatePhilippineMobile(phone)) {
      setError('Please enter a valid Philippine mobile number (e.g., 9606075119)');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await mobileAuthService.register(email, password, name, phone, role);
      sessionStorage.setItem('mobile_token', response.token);
      onRegisterSuccess(response);
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        pt: 3,
        px: 2.5,
        pb: 2.5,
        overflow: 'auto',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          pt: 3,
          px: 3,
          pb: 3,
          borderRadius: 2,
          width: '100%',
          maxWidth: 400,
          mt: 2,
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
          Create a new account
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
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
            disabled={loading}
            variant="outlined"
            sx={{ mb: 2 }}
          />
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
            label="Mobile"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            margin="normal"
            required
            disabled={loading}
            variant="outlined"
            helperText="Philippine mobile number (e.g., 9606075119)"
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
            helperText="Must be at least 6 characters"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="I am a"
            value={role}
            onChange={(e) => setRole(e.target.value as 'supplier' | 'store')}
            margin="normal"
            required
            disabled={loading}
            variant="outlined"
            sx={{ mb: 2 }}
          >
            <MenuItem value="supplier">I&apos;m a Supplier</MenuItem>
            <MenuItem value="store">I&apos;m a Store Owner</MenuItem>
          </TextField>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 1, py: 1 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Register'}
          </Button>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={onSwitchToLogin}
              sx={{ cursor: 'pointer' }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

