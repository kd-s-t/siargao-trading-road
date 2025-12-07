'use client';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { Order } from '@/lib/users';
import { User } from '@/lib/auth';
import { downloadInvoice } from '../../utils/invoice';

interface OrdersViewProps {
  orders: Order[];
  loading: boolean;
  mobileUser: User | null;
  orderStatusFilter: string | null;
  onOrderClick: (order: Order) => void;
  onUpdateStatus: (orderId: number, status: string) => Promise<void>;
  onMarkDeliveredClick: (orderId: number) => void;
  onMarkPaymentAsPaid?: (orderId: number) => Promise<void>;
  onFilterChange: (status: string | null) => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function OrdersView({
  orders,
  loading,
  mobileUser,
  orderStatusFilter,
  onOrderClick,
  onUpdateStatus,
  onMarkDeliveredClick,
  onMarkPaymentAsPaid,
  onFilterChange,
  onToast,
}: OrdersViewProps) {
  const handleDownloadInvoice = async (order: Order) => {
    await downloadInvoice(
      order,
      (msg) => onToast(msg, 'success'),
      (msg) => onToast(msg, 'error')
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (orders.length === 0) {
    return (
      <>
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label="All" onClick={() => onFilterChange(null)} color={orderStatusFilter === null ? 'primary' : 'default'} variant={orderStatusFilter === null ? 'filled' : 'outlined'} size="small" />
          <Chip label="Draft" onClick={() => onFilterChange('draft')} color={orderStatusFilter === 'draft' ? 'primary' : 'default'} variant={orderStatusFilter === 'draft' ? 'filled' : 'outlined'} size="small" />
          <Chip label="Preparing" onClick={() => onFilterChange('preparing')} color={orderStatusFilter === 'preparing' ? 'primary' : 'default'} variant={orderStatusFilter === 'preparing' ? 'filled' : 'outlined'} size="small" />
          <Chip label="In Transit" onClick={() => onFilterChange('in_transit')} color={orderStatusFilter === 'in_transit' ? 'primary' : 'default'} variant={orderStatusFilter === 'in_transit' ? 'filled' : 'outlined'} size="small" />
          <Chip label="Delivered" onClick={() => onFilterChange('delivered')} color={orderStatusFilter === 'delivered' ? 'primary' : 'default'} variant={orderStatusFilter === 'delivered' ? 'filled' : 'outlined'} size="small" />
          <Chip label="Cancelled" onClick={() => onFilterChange('cancelled')} color={orderStatusFilter === 'cancelled' ? 'primary' : 'default'} variant={orderStatusFilter === 'cancelled' ? 'filled' : 'outlined'} size="small" />
        </Box>
        <Card>
          <CardContent>
            <Typography variant="body1" align="center">
              No orders available{orderStatusFilter ? ` with status "${orderStatusFilter}"` : ''}
            </Typography>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip label="All" onClick={() => onFilterChange(null)} color={orderStatusFilter === null ? 'primary' : 'default'} variant={orderStatusFilter === null ? 'filled' : 'outlined'} size="small" />
        <Chip label="Draft" onClick={() => onFilterChange('draft')} color={orderStatusFilter === 'draft' ? 'primary' : 'default'} variant={orderStatusFilter === 'draft' ? 'filled' : 'outlined'} size="small" />
        <Chip label="Preparing" onClick={() => onFilterChange('preparing')} color={orderStatusFilter === 'preparing' ? 'primary' : 'default'} variant={orderStatusFilter === 'preparing' ? 'filled' : 'outlined'} size="small" />
        <Chip label="In Transit" onClick={() => onFilterChange('in_transit')} color={orderStatusFilter === 'in_transit' ? 'primary' : 'default'} variant={orderStatusFilter === 'in_transit' ? 'filled' : 'outlined'} size="small" />
        <Chip label="Delivered" onClick={() => onFilterChange('delivered')} color={orderStatusFilter === 'delivered' ? 'primary' : 'default'} variant={orderStatusFilter === 'delivered' ? 'filled' : 'outlined'} size="small" />
        <Chip label="Cancelled" onClick={() => onFilterChange('cancelled')} color={orderStatusFilter === 'cancelled' ? 'primary' : 'default'} variant={orderStatusFilter === 'cancelled' ? 'filled' : 'outlined'} size="small" />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {orders.map((order) => (
          <Card 
            key={order.id}
            sx={{ 
              cursor: 'pointer',
              '&:hover': { boxShadow: 4 },
            }}
            onClick={() => onOrderClick(order)}
          >
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Order #{order.id}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                  {mobileUser?.role === 'supplier' ? 'Store' : 'Supplier'}:
                </Typography>
                <Typography variant="body2">
                  {mobileUser?.role === 'supplier' ? order.store?.name : order.supplier?.name}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                  Status:
                </Typography>
                <Chip 
                  label={order.status} 
                  color={
                    order.status === 'delivered' ? 'success' :
                    order.status === 'cancelled' ? 'error' :
                    order.status === 'in_transit' ? 'info' :
                    'default'
                  }
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                  Total:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                  ₱{order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
              {order.payment_method && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                    Payment Method:
                  </Typography>
                  <Typography variant="body2">
                    {order.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : 
                     order.payment_method === 'gcash' ? 'GCash' : 
                     order.payment_method}
                  </Typography>
                </Box>
              )}
              {order.payment_status && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                    Payment Status:
                  </Typography>
                  <Chip 
                    label={order.payment_status === 'paid' ? 'Paid' : 
                           order.payment_status === 'pending' ? 'Pending' : 
                           order.payment_status === 'failed' ? 'Failed' : 
                           order.payment_status}
                    color={
                      order.payment_status === 'paid' ? 'success' :
                      order.payment_status === 'pending' ? 'warning' :
                      order.payment_status === 'failed' ? 'error' :
                      'default'
                    }
                    size="small"
                  />
                </Box>
              )}
              {order.order_items && order.order_items.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 1.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Items:
                  </Typography>
                  {order.order_items.map((item) => (
                    <Box 
                      key={item.id} 
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        mb: 1.5,
                        p: 1,
                        bgcolor: '#f5f5f5',
                        borderRadius: 1,
                      }}
                    >
                      {item.product.image_url && item.product.image_url.trim() !== '' ? (
                        <Box
                          component="img"
                          src={item.product.image_url}
                          alt={item.product.name}
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            bgcolor: '#e0e0e0',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#999', fontSize: '0.6rem' }}>
                            No Image
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.25 }}>
                          {item.product.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {item.quantity} {item.product.unit || 'units'} × ₱{item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', flexShrink: 0 }}>
                        ₱{item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
              {order.status === 'delivered' && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadInvoice(order);
                    }}
                    fullWidth
                  >
                    Download Invoice
                  </Button>
                </Box>
              )}
              {mobileUser?.role === 'supplier' && order.status === 'preparing' && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(order.id, 'in_transit');
                    }}
                  >
                    Mark In Transit
                  </Button>
                </Box>
              )}
              {mobileUser?.role === 'supplier' && order.status === 'in_transit' && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkDeliveredClick(order.id);
                    }}
                  >
                    Mark Delivered
                  </Button>
                </Box>
              )}
              {mobileUser?.role === 'supplier' && order.payment_method === 'gcash' && order.payment_status === 'pending' && onMarkPaymentAsPaid && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    color="success"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await onMarkPaymentAsPaid(order.id);
                        onToast('Payment marked as paid', 'success');
                      } catch (err: unknown) {
                        const error = err as { response?: { data?: { error?: string } } };
                        onToast(error.response?.data?.error || 'Failed to mark payment as paid', 'error');
                      }
                    }}
                  >
                    Mark Payment as Paid
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </>
  );
}

