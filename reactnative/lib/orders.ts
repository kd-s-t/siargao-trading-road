import api from './api';
import { Product } from './products';

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
  };
  supplier_id: number;
  supplier?: {
    id: number;
    name: string;
    email: string;
  };
  status: 'draft' | 'preparing' | 'in_transit' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address?: string;
  notes?: string;
  order_items: OrderItem[];
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
};

