import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersService, User } from '@/lib/users';
import { AdminFormData } from './types';
import { DEFAULT_ADMIN_LEVEL } from './constants';

export function useAdmins() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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

  return { admins, loading, loadAdmins };
}

export function useAdminForm() {
  const [openDialog, setOpenDialog] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<AdminFormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    admin_level: DEFAULT_ADMIN_LEVEL,
  });

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError('');
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      admin_level: DEFAULT_ADMIN_LEVEL,
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
  };

  const handleRegister = async (onSuccess: () => void) => {
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
      onSuccess();
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

  return {
    openDialog,
    registering,
    error,
    formData,
    setFormData,
    setError,
    handleOpenDialog,
    handleCloseDialog,
    handleRegister,
  };
}

