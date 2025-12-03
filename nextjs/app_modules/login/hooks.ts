import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginFormData } from './types';

export function useLogin() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData.email, formData.password);
      if (response?.role === 'admin') {
        router.push('/dashboard');
      } else if (response?.role === 'store') {
        router.push('/store/dashboard');
      } else if (response?.role === 'supplier') {
        router.push('/supplier/dashboard');
      } else {
        router.push('/login');
      }
    } catch (err) {
      const error = err as Error & { response?: { data?: { error?: string } } };
      setError(error.message || error.response?.data?.error || 'Login failed');
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return {
    formData,
    setFormData,
    showPassword,
    error,
    loading,
    handleSubmit,
    togglePasswordVisibility,
    setError,
  };
}

