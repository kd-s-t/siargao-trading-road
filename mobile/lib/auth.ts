import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
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

  logout: async () => {
    await AsyncStorage.removeItem('token');
  },
};

