'use client';

import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Order } from '@/lib/users';
import { mobileOrderService } from '../../services/mobileApi';
import { Supplier } from '@/lib/suppliers';

interface TruckViewProps {
  draftOrder: Order | null;
  loading: boolean;
  selectedSupplier: Supplier | null;
  onViewChange: (view: 'supplier-products' | 'suppliers') => void;
  onDraftOrderReload: (supplierId?: number) => Promise<void>;
  onSubmitOrder: () => Promise<void>;
  onError: (message: string) => void;
}

export function TruckView({
  draftOrder,
  loading,
  selectedSupplier,
  onViewChange,
  onDraftOrderReload,
  onSubmitOrder,
  onError,
}: TruckViewProps) {
  const handleRemoveItem = async (itemId: number) => {
    try {
      await mobileOrderService.removeOrderItem(itemId);
      if (selectedSupplier) {
        await onDraftOrderReload(selectedSupplier.id);
      }
    } catch (err: unknown) {
      onError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to remove item');
    }
  };

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    try {
      await mobileOrderService.updateOrderItem(itemId, quantity);
      if (selectedSupplier) {
        await onDraftOrderReload(selectedSupplier.id);
      }
    } catch (err: unknown) {
      onError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update quantity');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!draftOrder || !draftOrder.order_items || draftOrder.order_items.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1" align="center" sx={{ mb: 2 }}>
            Your truck is empty
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={() => onViewChange('supplier-products')}
          >
            Browse Products
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {draftOrder.order_items.map((item) => (
        <Card key={item.id}>
          {item.product.image_url && item.product.image_url.trim() !== '' && (
            <CardMedia
              component="img"
              height="150"
              image={item.product.image_url}
              alt={item.product.name}
              sx={{ objectFit: 'cover' }}
            />
          )}
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {item.product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ₱{item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
                </Typography>
              </Box>
              <IconButton
                color="error"
                size="small"
                onClick={() => handleRemoveItem(item.id)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Quantity:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => {
                    if (item.quantity > 1) {
                      handleUpdateQuantity(item.id, item.quantity - 1);
                    }
                  }}
                  disabled={item.quantity <= 1}
                >
                  <RemoveIcon />
                </IconButton>
                <Typography variant="body1" sx={{ minWidth: 40, textAlign: 'center' }}>
                  {item.quantity}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', ml: 2 }}>
                ₱{item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ))}
      <Card sx={{ bgcolor: '#e3f2fd', mt: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Total:
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              ₱{draftOrder.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Button
            fullWidth
            variant="contained"
            onClick={onSubmitOrder}
            sx={{ mt: 2 }}
          >
            Submit Order
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

