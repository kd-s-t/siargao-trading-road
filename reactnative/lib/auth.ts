import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  logo_url?: string;
  banner_url?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
  role: 'supplier' | 'store' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/login', { email, password });
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get<User>('/me');
    return data;
  },

  updateMe: async (updates: { name?: string; phone?: string; logo_url?: string; banner_url?: string }): Promise<User> => {
    const { data } = await api.put<User>('/me', updates);
    return data;
  },

  uploadImage: async (file: FormData): Promise<{ url: string; key: string }> => {
    const { data } = await api.post<{ url: string; key: string }>('/upload', file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
  },
};

