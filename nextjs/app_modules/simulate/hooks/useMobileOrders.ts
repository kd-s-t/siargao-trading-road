import { useState, useEffect, useRef } from 'react';
import { Order } from '@/lib/users';
import { mobileOrderService } from '../services/mobileApi';

export function useMobileOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const loadOrders = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      setLoading(true);
      const data = await mobileOrderService.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  return { orders, loading, loadOrders };
}

export function useDraftOrder(supplierId: number | null) {
  const [draftOrder, setDraftOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDraftOrder = async (id?: number) => {
    try {
      setLoading(true);
      const order = await mobileOrderService.getDraftOrder(id || supplierId || undefined);
      setDraftOrder(order);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { error?: string } } };
      if (err.response?.status !== 404) {
        console.error('Failed to load draft order:', error);
      }
      setDraftOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return { draftOrder, loading, loadDraftOrder };
}

