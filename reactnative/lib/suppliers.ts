import api from './api';
import { Product } from './products';

export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  description: string;
  product_count: number;
}

export const supplierService = {
  getSuppliers: async (): Promise<Supplier[]> => {
    const { data } = await api.get<Supplier[]>('/suppliers');
    return data;
  },

  getSupplierProducts: async (supplierId: number): Promise<Product[]> => {
    const { data } = await api.get<Product[]>(`/suppliers/${supplierId}/products`);
    return data;
  },
};

