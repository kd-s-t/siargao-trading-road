import api from './api';

export interface Product {
  id: number;
  supplier_id: number;
  name: string;
  description?: string;
  sku: string;
  price: number;
  stock_quantity: number;
  unit?: string;
  category?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  sku: string;
  price: number;
  stock_quantity?: number;
  unit?: string;
  category?: string;
  image_url?: string;
}

export const productService = {
  getProducts: async (includeDeleted: boolean = false): Promise<Product[]> => {
    const { data } = await api.get<Product[]>('/products', {
      params: { include_deleted: includeDeleted },
    });
    return data;
  },

  getProduct: async (id: number): Promise<Product> => {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  },

  createProduct: async (product: CreateProductRequest): Promise<Product> => {
    const { data } = await api.post<Product>('/products', product);
    return data;
  },

  updateProduct: async (id: number, product: Partial<CreateProductRequest>): Promise<Product> => {
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

