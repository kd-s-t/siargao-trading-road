'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Box,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { usersService, User } from '@/lib/users';

export default function AdminsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    admin_level: 2 as number,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/login');
      } else if ((user.admin_level ?? 1) !== 1) {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin' && (user.admin_level ?? 1) === 1) {
      loadAdmins();
    }
  }, [user]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const allUsers = await usersService.getUsers();
      const adminUsers = allUsers.filter(u => u.role === 'admin');
      setAdmins(adminUsers);
    } catch (error) {
      console.error('Failed to load admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError('');
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      admin_level: 2,
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setRegistering(true);
      setError('');
      await usersService.registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        role: 'admin',
        admin_level: formData.admin_level,
      });
      handleCloseDialog();
      loadAdmins();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register admin';
      const apiError = err && typeof err === 'object' && 'response' in err 
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error 
        : undefined;
      setError(apiError || errorMessage || 'Failed to register admin');
    } finally {
      setRegistering(false);
    }
  };

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.admin_level && a.admin_level.toString().includes(searchTerm))
  );

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Container>
      </AdminLayout>
    );
  }

  if (!user || (user.admin_level ?? 1) !== 1) {
    return null;
  }

  const getLevelColor = (level?: number): 'error' | 'warning' | 'default' => {
    if (!level) return 'default';
    switch (level) {
      case 1:
        return 'error';
      case 2:
        return 'warning';
      case 3:
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1">
              Admin Users
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              Register Admin
            </Button>
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Paper sx={{ p: 3, mt: 2 }}>
            <TextField
              fullWidth
              placeholder="Search admins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Admin Level</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAdmins.map((a, index) => (
                    <TableRow
                      key={a.id}
                      component={motion.tr}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/users/${a.id}`)}
                    >
                      <TableCell>{a.id}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell>{a.phone || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={`Level ${a.admin_level ?? 1}`}
                          color={getLevelColor(a.admin_level)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(a.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="primary"
                          sx={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/users/${a.id}`);
                          }}
                        >
                          View Details
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredAdmins.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No admins found
                </Typography>
              </Box>
            )}
          </Paper>
        </motion.div>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Register New Admin</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Admin Level *</InputLabel>
                <Select
                  value={formData.admin_level}
                  onChange={(e) => setFormData({ ...formData, admin_level: Number(e.target.value) })}
                  label="Admin Level *"
                >
                  <MenuItem value={2}>Level 2 (Can add store, supplier, and level 3 users)</MenuItem>
                  <MenuItem value={3}>Level 3 (Read only)</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Password *"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                helperText="Minimum 6 characters"
              />
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={registering}>
              Cancel
            </Button>
            <Button onClick={handleRegister} variant="contained" disabled={registering}>
              {registering ? 'Registering...' : 'Register'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayout>
  );
}

