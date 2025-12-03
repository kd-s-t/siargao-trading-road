import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersService, Order } from '@/lib/users';

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersService.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, loadOrders };
}

export function useOrderFilters(orders: Order[], searchTerm: string) {
  const filteredOrders = orders.filter(
    (o) =>
      o.id.toString().includes(searchTerm) ||
      o.store?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return { filteredOrders };
}

