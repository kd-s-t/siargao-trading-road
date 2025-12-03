import {
  TextField,
  Button,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Link,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LoginFormData } from '../types';

interface LoginFormProps {
  formData: LoginFormData;
  showPassword: boolean;
  error: string;
  loading: boolean;
  onFormDataChange: (data: LoginFormData) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onErrorDismiss: () => void;
}

export function LoginForm({
  formData,
  showPassword,
  error,
  loading,
  onFormDataChange,
  onTogglePassword,
  onSubmit,
  onErrorDismiss,
}: LoginFormProps) {
  return (
    <>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert severity="error" sx={{ mb: 3 }} onClose={onErrorDismiss}>
            {error}
          </Alert>
        </motion.div>
      )}

      <form onSubmit={onSubmit}>
        <TextField
          fullWidth
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
          margin="normal"
          required
          autoComplete="email"
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(e) => onFormDataChange({ ...formData, password: e.target.value })}
          margin="normal"
          required
          autoComplete="current-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={onTogglePassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Link
            href="#"
            variant="body2"
            onClick={(e) => {
              e.preventDefault();
            }}
            sx={{ cursor: 'pointer' }}
          >
            Forgot password?
          </Link>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            mt: 2,
            mb: 2,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: 2,
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              <span>Signing in...</span>
            </Box>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Need help? Contact{' '}
          <Link href="mailto:support@siargaotradingroad.com" underline="hover">
            support
          </Link>
        </Typography>
      </Box>
    </>
  );
}

