import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Alert,
} from '@mui/material';
import { AdminFormData } from '../types';
import { ADMIN_LEVELS, MIN_PASSWORD_LENGTH } from '../constants';

interface RegisterAdminDialogProps {
  open: boolean;
  registering: boolean;
  error: string;
  formData: AdminFormData;
  onClose: () => void;
  onRegister: () => void;
  onFormDataChange: (data: AdminFormData) => void;
  onErrorDismiss: () => void;
}

export function RegisterAdminDialog({
  open,
  registering,
  error,
  formData,
  onClose,
  onRegister,
  onFormDataChange,
  onErrorDismiss,
}: RegisterAdminDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Register New Admin</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={onErrorDismiss}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Admin Level *</InputLabel>
            <Select
              value={formData.admin_level}
              onChange={(e) => onFormDataChange({ ...formData, admin_level: Number(e.target.value) })}
              label="Admin Level *"
            >
              {ADMIN_LEVELS.map((level) => (
                <MenuItem key={level.value} value={level.value}>
                  {level.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Name *"
            value={formData.name}
            onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="Password *"
            type="password"
            value={formData.password}
            onChange={(e) => onFormDataChange({ ...formData, password: e.target.value })}
            required
            helperText={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
          />
          <TextField
            fullWidth
            label="Phone"
            value={formData.phone}
            onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={registering}>
          Cancel
        </Button>
        <Button onClick={onRegister} variant="contained" disabled={registering}>
          {registering ? 'Registering...' : 'Register'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

