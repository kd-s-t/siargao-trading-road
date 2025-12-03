import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersService, User } from '@/lib/users';
import { UserFormData } from './types';
import { MIN_PASSWORD_LENGTH } from './constants';

export function useUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getUsers();
      const filteredData = data.filter(u => u.role !== 'admin');
      setUsers(filteredData);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, loadUsers };
}

export function useUserForm() {
  const [openDialog, setOpenDialog] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'supplier',
  });

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError('');
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'supplier',
      logo_url: undefined,
      banner_url: undefined,
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
  };

  const handleRegister = async (onSuccess: () => void) => {
    if (!formData.name || !formData.email || !formData.password || !formData.role || !formData.phone) {
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
        phone: formData.phone,
        role: formData.role,
        logo_url: formData.logo_url,
        banner_url: formData.banner_url,
      });
      handleCloseDialog();
      onSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register user';
      const apiError = err && typeof err === 'object' && 'response' in err 
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error 
        : undefined;
      setError(apiError || errorMessage || 'Failed to register user');
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

