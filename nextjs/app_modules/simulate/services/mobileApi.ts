import axios from 'axios';
import { User, LoginResponse } from '@/lib/auth';
import { Order } from '@/lib/users';

export interface Message {
  id: number;
  order_id: number;
  sender_id: number;
  sender: {
    id: number;
    name: string;
    role: string;
  };
  content: string;
  created_at: string;
}

const mobileApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020/api',
});

mobileApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('mobile_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

export const mobileAuthService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await mobileApi.post<LoginResponse>('/login', { email, password });
    return data;
  },
  getMe: async (): Promise<User> => {
    const { data } = await mobileApi.get<User>('/me');
    return data;
  },
  updateMe: async (updates: { 
    name?: string; 
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
  }): Promise<User> => {
    const { data } = await mobileApi.put<User>('/me', updates);
    return data;
  },
  uploadImage: async (file: File, type?: 'product' | 'user'): Promise<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const params = type ? `?type=${type}` : '';
    const { data } = await mobileApi.post<{ url: string; key: string }>(`/upload${params}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};

export const mobileOrderService = {
  getDraftOrder: async (supplierId?: number): Promise<Order | null> => {
    try {
      const params = supplierId ? { supplier_id: supplierId } : {};
      const { data } = await mobileApi.get<Order>('/orders/draft', { params });
      return data;
    } catch (error: unknown) {
      if ((error as { response?: { status?: number } })?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
  createDraftOrder: async (supplierId: number): Promise<Order> => {
    try {
      const { data } = await mobileApi.post<Order>('/orders/draft', { supplier_id: supplierId });
      return data;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown }; message?: string };
      console.error('CreateDraftOrder API Error:', {
        supplierId,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      throw error;
    }
  },
  addOrderItem: async (orderId: number, productId: number, quantity: number): Promise<Order> => {
    try {
      const { data } = await mobileApi.post<Order>(`/orders/${orderId}/items`, {
        product_id: productId,
        quantity,
      });
      return data;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown }; message?: string };
      console.error('AddOrderItem API Error:', {
        orderId,
        productId,
        quantity,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      throw error;
    }
  },
  updateOrderItem: async (itemId: number, quantity: number): Promise<Order> => {
    const { data } = await mobileApi.put<Order>(`/orders/items/${itemId}`, { quantity });
    return data;
  },
  removeOrderItem: async (itemId: number): Promise<void> => {
    await mobileApi.delete(`/orders/items/${itemId}`);
  },
  submitOrder: async (orderId: number): Promise<Order> => {
    const { data } = await mobileApi.post<Order>(`/orders/${orderId}/submit`);
    return data;
  },
  getOrders: async (): Promise<Order[]> => {
    const { data } = await mobileApi.get<Order[]>('/orders');
    return data;
  },
  updateOrderStatus: async (id: number, status: string): Promise<Order> => {
    const { data } = await mobileApi.put<Order>(`/orders/${id}/status`, { status });
    return data;
  },
  getMessages: async (orderId: number): Promise<Message[]> => {
    const { data } = await mobileApi.get<Message[]>(`/orders/${orderId}/messages`);
    return data;
  },
  createMessage: async (orderId: number, content: string): Promise<Message> => {
    const { data } = await mobileApi.post<Message>(`/orders/${orderId}/messages`, { content });
    return data;
  },
};

export default mobileApi;

