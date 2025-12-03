'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { LocalShipping as TruckIcon } from '@mui/icons-material';
import { Product } from '@/lib/users';
import { mobileOrderService } from '../../services/mobileApi';
import { User } from '@/lib/auth';
import { Supplier } from '@/lib/suppliers';

interface SupplierProductsViewProps {
  products: Product[];
  loading: boolean;
  mobileUser: User | null;
  selectedSupplier: Supplier | null;
  onAddToTruck: () => Promise<void>;
  onError: (message: string) => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function SupplierProductsView({
  products,
  loading,
  mobileUser,
  selectedSupplier,
  onAddToTruck,
  onError,
  onToast,
}: SupplierProductsViewProps) {
  const [quantities, setQuantities] = useState<Record<number, string>>({});

  const handleAddToTruck = async (product: Product) => {
    if (!selectedSupplier) return;

    try {
      onError('');
      
      if (mobileUser?.role !== 'store') {
        onError('Only stores can create orders');
        return;
      }

      let order = await mobileOrderService.getDraftOrder(selectedSupplier.id);
      if (!order) {
        try {
          order = await mobileOrderService.createDraftOrder(selectedSupplier.id);
        } catch (createErr: unknown) {
          const err = createErr as { response?: { data?: { error?: string } }; message?: string };
          const errorMsg = err.response?.data?.error || err.message || 'Failed to create draft order';
          onError(errorMsg);
          return;
        }
      }

      if (!order || !order.id) {
        onError('Failed to create or retrieve draft order');
        return;
      }

      if (order.status !== 'draft') {
        onError(`Order status is ${order.status}, expected draft`);
        return;
      }

      const quantity = parseInt(quantities[product.id] || '1', 10);
      if (quantity < 1) {
        onError('Quantity must be at least 1');
        return;
      }

      if (quantity > product.stock_quantity) {
        onError(`Quantity exceeds available stock (${product.stock_quantity})`);
        return;
      }

      await mobileOrderService.addOrderItem(order.id, product.id, quantity);
      setQuantities({ ...quantities, [product.id]: '' });
      await onAddToTruck();
      onToast(`${product.name} added to truck`, 'success');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add item to truck';
      onError(errorMessage);
      onToast(errorMessage, 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1" align="center">
            No products available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {products.map((product) => (
        <Card key={product.id}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              {product.image_url && product.image_url.trim() !== '' ? (
                <Box
                  component="img"
                  src={product.image_url}
                  alt={product.name}
                  sx={{
                    width: 80,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 1,
                    flexShrink: 0,
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: '#e0e0e0',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>
                    No Image
                  </Typography>
                </Box>
              )}
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {product.name}
                </Typography>
              </Box>
            </Box>
            {product.description && (
              <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                {product.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                Price:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                ₱{product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                Stock:
              </Typography>
              <Typography variant="body2">
                {product.stock_quantity} {product.unit || 'units'}
              </Typography>
            </Box>
            {product.category && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                  Category:
                </Typography>
                <Typography variant="body2">{product.category}</Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                type="number"
                label="Quantity"
                value={quantities[product.id] || '1'}
                onChange={(e) => setQuantities({ ...quantities, [product.id]: e.target.value })}
                size="small"
                sx={{ width: 100 }}
                inputProps={{ min: 1, max: product.stock_quantity }}
              />
              <Button
                variant="contained"
                startIcon={<TruckIcon />}
                onClick={() => handleAddToTruck(product)}
                disabled={product.stock_quantity === 0}
                sx={{ flexGrow: 1 }}
              >
                Add to Truck
              </Button>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

