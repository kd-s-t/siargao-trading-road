import api from './api';
import { Product } from './users';

export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  description: string;
  product_count: number;
  logo_url?: string;
  banner_url?: string;
  average_rating?: number;
  rating_count: number;
}

export const suppliersService = {
  getSuppliers: async (): Promise<Supplier[]> => {
    const { data } = await api.get<Supplier[]>('/suppliers');
    return data;
  },

  getSupplierProducts: async (supplierId: number): Promise<Product[]> => {
    const { data } = await api.get<Product[]>(`/suppliers/${supplierId}/products`);
    return data;
  },
};

