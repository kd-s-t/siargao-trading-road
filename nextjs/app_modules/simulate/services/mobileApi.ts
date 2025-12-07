import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { User, LoginResponse } from '@/lib/auth';
import { Order, OrderRating, Product } from '@/lib/users';

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  __logId?: string;
}

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

export interface ApiCallLog {
  id: string;
  method: string;
  url: string;
  requestData?: unknown;
  responseData?: unknown;
  status?: number;
  error?: unknown;
  timestamp: Date;
}

let apiCallLogger: ((log: ApiCallLog) => void) | null = null;

export const setApiCallLogger = (logger: (log: ApiCallLog) => void) => {
  apiCallLogger = logger;
};

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
  if (apiCallLogger) {
    const logId = `${Date.now()}-${Math.random()}`;
    (config as ExtendedAxiosRequestConfig).__logId = logId;
    const url = config.url || '';
    const fullUrl = url.startsWith('http') ? url : `${config.baseURL}${url}`;
    apiCallLogger({
      id: logId,
      method: (config.method || 'GET').toUpperCase(),
      url: fullUrl,
      requestData: config.data,
      timestamp: new Date(),
    });
  }
  return config;
});

mobileApi.interceptors.response.use(
  (response) => {
    if (apiCallLogger && (response.config as ExtendedAxiosRequestConfig).__logId) {
      apiCallLogger({
        id: (response.config as ExtendedAxiosRequestConfig).__logId || '',
        method: (response.config.method || 'GET').toUpperCase(),
        url: response.config.url || '',
        requestData: response.config.data,
        responseData: response.data,
        status: response.status,
        timestamp: new Date(),
      });
    }
    return response;
  },
  (error: AxiosError) => {
    if (apiCallLogger && error.config && (error.config as ExtendedAxiosRequestConfig).__logId) {
      apiCallLogger({
        id: (error.config as ExtendedAxiosRequestConfig).__logId || '',
        method: (error.config.method || 'GET').toUpperCase(),
        url: error.config.url || '',
        requestData: error.config.data,
        responseData: error.response?.data,
        status: error.response?.status,
        error: error.message,
        timestamp: new Date(),
      });
    }
    return Promise.reject(error);
  }
);

export const mobileAuthService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await mobileApi.post<LoginResponse>('/login', { email, password });
    return data;
  },
  register: async (
    email: string,
    password: string,
    name: string,
    phone: string,
    role: 'supplier' | 'store'
  ): Promise<LoginResponse> => {
    const { data } = await mobileApi.post<LoginResponse>('/register', {
      email,
      password,
      name,
      phone,
      role,
    });
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
    working_days?: string;
    opening_time?: string;
    closing_time?: string;
    is_open?: boolean;
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
  openStore: async (): Promise<User> => {
    const { data } = await mobileApi.post<User>('/me/open');
    return data;
  },
  closeStore: async (): Promise<User> => {
    const { data } = await mobileApi.post<User>('/me/close');
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
  submitOrder: async (orderId: number, data: {
    payment_method: string;
    delivery_option: string;
    delivery_fee?: number;
    distance?: number;
    shipping_address?: string;
    notes?: string;
  }): Promise<Order> => {
    const { data: response } = await mobileApi.post<Order>(`/orders/${orderId}/submit`, data);
    return response;
  },
  getOrders: async (): Promise<Order[]> => {
    const { data } = await mobileApi.get<Order[]>('/orders');
    return data;
  },
  getOrder: async (id: number): Promise<Order> => {
    const { data } = await mobileApi.get<Order>(`/orders/${id}`);
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
  getMyAnalytics: async (): Promise<{ average_rating?: number; rating_count: number }> => {
    const { data } = await mobileApi.get<{ average_rating?: number; rating_count: number }>('/me/analytics');
    return data;
  },
  createRating: async (orderId: number, rating: number, comment?: string): Promise<{ id: number; order_id: number; rater_id: number; rated_id: number; rating: number; comment?: string; created_at: string }> => {
    const { data } = await mobileApi.post(`/orders/${orderId}/rating`, { rating, comment });
    return data;
  },
  getMyRatings: async (): Promise<OrderRating[]> => {
    const { data } = await mobileApi.get<{ ratings: OrderRating[] }>('/me/ratings');
    return data.ratings;
  },
};

export const mobileProductService = {
  createProduct: async (product: {
    name: string;
    description?: string;
    sku: string;
    price: number;
    stock_quantity?: number;
    unit?: string;
    category?: string;
    image_url?: string;
  }): Promise<Product> => {
    const { data } = await mobileApi.post<Product>('/products', product);
    return data;
  },
  updateProduct: async (id: number, product: {
    name?: string;
    description?: string;
    sku?: string;
    price?: number;
    stock_quantity?: number;
    unit?: string;
    category?: string;
    image_url?: string;
  }): Promise<Product> => {
    const { data } = await mobileApi.put<Product>(`/products/${id}`, product);
    return data;
  },
  deleteProduct: async (id: number): Promise<void> => {
    await mobileApi.delete(`/products/${id}`);
  },
};

export default mobileApi;

