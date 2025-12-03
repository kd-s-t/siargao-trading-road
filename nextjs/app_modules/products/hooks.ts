import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { productsService, Product } from '@/lib/users';
import { usersService, User } from '@/lib/users';
import { ProductFilters } from './types';

export function useProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsData, usersData] = await Promise.all([
        productsService.getProducts(),
        usersService.getUsers(),
      ]);
      setProducts(productsData);
      const supplierUsers = usersData.filter(u => u.role === 'supplier');
      setSuppliers(supplierUsers);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
    }
  }, [user, loadData]);

  return { products, suppliers, loading, loadData };
}

export function useProductFilters(products: Product[]) {
  const [filters, setFilters] = useState<ProductFilters>({
    searchTerm: '',
    selectedSupplier: '',
    selectedCategory: '',
  });

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesSupplier = filters.selectedSupplier === '' || p.supplier_id === filters.selectedSupplier;
    const matchesCategory = filters.selectedCategory === '' || p.category === filters.selectedCategory;

    return matchesSearch && matchesSupplier && matchesCategory;
  });

  return { filters, setFilters, categories, filteredProducts };
}

