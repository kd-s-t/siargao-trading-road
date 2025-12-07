import api from './api';

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: 'supplier' | 'store' | 'admin';
  admin_level?: number;
  logo_url?: string;
  banner_url?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
  working_days?: string;
  opening_time?: string;
  closing_time?: string;
  is_open?: boolean;
  created_at: string;
  updated_at: string;
  average_rating?: number;
  rating_count?: number;
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

  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  uploadImage: async (file: File, type?: 'product' | 'user'): Promise<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const params = type ? `?type=${type}` : '';
    const { data } = await api.post<{ url: string; key: string }>(`/upload${params}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};

