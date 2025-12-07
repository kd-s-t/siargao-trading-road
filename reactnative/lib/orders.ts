import api from './api';
import { Product } from './products';
import { OrderRating } from './ratings';

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

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  store_id: number;
  store: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
    logo_url?: string;
    banner_url?: string;
  };
  supplier_id: number;
  supplier?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
    logo_url?: string;
    banner_url?: string;
  };
  status: 'draft' | 'preparing' | 'in_transit' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address?: string;
  notes?: string;
  order_items: OrderItem[];
  ratings?: OrderRating[];
  created_at: string;
  updated_at: string;
}

export const orderService = {
  getOrders: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/orders');
    return data;
  },

  getOrder: async (id: number): Promise<Order> => {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },

  updateOrderStatus: async (id: number, status: string): Promise<Order> => {
    const { data } = await api.put<Order>(`/orders/${id}/status`, { status });
    return data;
  },

  getDraftOrder: async (supplierId?: number): Promise<Order | null> => {
    try {
      const params = supplierId ? { supplier_id: supplierId } : {};
      const { data } = await api.get<Order>('/orders/draft', { params });
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  createDraftOrder: async (supplierId: number): Promise<Order> => {
    const { data } = await api.post<Order>('/orders/draft', { supplier_id: supplierId });
    return data;
  },

  addOrderItem: async (orderId: number, productId: number, quantity: number): Promise<Order> => {
    const { data } = await api.post<Order>(`/orders/${orderId}/items`, {
      product_id: productId,
      quantity,
    });
    return data;
  },

  updateOrderItem: async (itemId: number, quantity: number): Promise<Order> => {
    const { data } = await api.put<Order>(`/orders/items/${itemId}`, { quantity });
    return data;
  },

  removeOrderItem: async (itemId: number): Promise<void> => {
    await api.delete(`/orders/items/${itemId}`);
  },

  submitOrder: async (
    orderId: number,
    data: {
      payment_method: string;
      delivery_option: string;
      delivery_fee?: number;
      distance?: number;
      shipping_address?: string;
      notes?: string;
    }
  ): Promise<Order> => {
    const { data: response } = await api.post<Order>(`/orders/${orderId}/submit`, data);
    return response;
  },

  getMessages: async (orderId: number): Promise<Message[]> => {
    const { data } = await api.get<Message[]>(`/orders/${orderId}/messages`);
    return data;
  },

  createMessage: async (orderId: number, content: string): Promise<Message> => {
    const { data } = await api.post<Message>(`/orders/${orderId}/messages`, { content });
    return data;
  },
};

