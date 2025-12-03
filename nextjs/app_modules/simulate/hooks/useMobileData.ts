import { useState, useEffect } from 'react';
import { Supplier } from '@/lib/suppliers';
import { Store } from '@/lib/stores';
import { Product } from '@/lib/users';
import mobileApi from '../services/mobileApi';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const { data } = await mobileApi.get<Supplier[]>('/suppliers');
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  return { suppliers, loading, loadSuppliers };
}

export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStores = async () => {
    try {
      setLoading(true);
      const { data } = await mobileApi.get<Store[]>('/stores');
      setStores(data);
    } catch (error) {
      console.error('Failed to load stores:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stores, loading, loadStores };
}

export function useSupplierProducts(supplierId: number | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = async (id: number) => {
    try {
      setLoading(true);
      const { data } = await mobileApi.get<Product[]>(`/suppliers/${id}/products`);
      setProducts(data);
    } catch (error) {
      console.error('Failed to load supplier products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supplierId) {
      loadProducts(supplierId);
    }
  }, [supplierId]);

  return { products, loading, loadProducts };
}

