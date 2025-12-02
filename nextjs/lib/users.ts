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
  created_at: string;
  updated_at: string;
}

export interface UserAnalytics {
  total_orders: number;
  total_earnings: number;
  total_products_bought: number;
  orders: Order[];
  products_bought: ProductBought[];
  recent_orders: Order[];
}

export interface ProductBought {
  product_id: number;
  product_name: string;
  quantity?: number;
  total_spent?: number;
  price?: number;
  stock?: number;
  unit?: string;
  category?: string;
  sku?: string;
}

export interface Order {
  id: number;
  store_id: number;
  supplier_id: number;
  store?: User;
  supplier?: User;
  status: string;
  total_amount: number;
  shipping_address?: string;
  notes?: string;
  order_items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Product {
  id: number;
  supplier_id: number;
  supplier?: User;
  name: string;
  description?: string;
  sku: string;
  price: number;
  stock_quantity: number;
  unit?: string;
  category?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const usersService = {
  getUsers: async (): Promise<User[]> => {
    const { data } = await api.get<User[]>('/users');
    return data;
  },

  getUser: async (id: number): Promise<User> => {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  },

  getUserAnalytics: async (id: number): Promise<UserAnalytics> => {
    const { data } = await api.get<UserAnalytics>(`/users/${id}/analytics`);
    return data;
  },

  getMyAnalytics: async (): Promise<UserAnalytics> => {
    const { data } = await api.get<UserAnalytics>('/me/analytics');
    return data;
  },

  registerUser: async (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: 'supplier' | 'store' | 'admin';
    admin_level?: number;
  }): Promise<User> => {
    const { data } = await api.post<User>('/users/register', userData);
    return data;
  },
};

export const ordersService = {
  getOrders: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/orders');
    return data;
  },

  getOrder: async (id: number): Promise<Order> => {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },

  sendInvoiceEmail: async (id: number): Promise<void> => {
    await api.post(`/orders/${id}/send-invoice`);
  },
};

export interface DashboardAnalytics {
  total_users: number;
  total_suppliers: number;
  total_stores: number;
  total_orders: number;
  total_earnings: number;
  recent_orders: Order[];
  daily_stats: DailyStat[];
}

export interface DailyStat {
  date: string;
  orders: number;
  earnings: number;
}

export const analyticsService = {
  getDashboardAnalytics: async (): Promise<DashboardAnalytics> => {
    const { data } = await api.get<DashboardAnalytics>('/dashboard/analytics');
    return data;
  },
};

export const productsService = {
  getProducts: async (includeDeleted?: boolean): Promise<Product[]> => {
    const params = includeDeleted ? '?include_deleted=true' : '';
    const { data } = await api.get<Product[]>(`/products${params}`);
    return data;
  },

  getProduct: async (id: number): Promise<Product> => {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  },

  createProduct: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> => {
    const { data } = await api.post<Product>('/products', product);
    return data;
  },

  updateProduct: async (id: number, product: Partial<Product>): Promise<Product> => {
    const { data } = await api.put<Product>(`/products/${id}`, product);
    return data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  restoreProduct: async (id: number): Promise<Product> => {
    const { data } = await api.post<Product>(`/products/${id}/restore`);
    return data;
  },
};

