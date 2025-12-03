'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  CircularProgress,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Avatar,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Download as DownloadIcon, Email as EmailIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { ordersService, Order } from '@/lib/users';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/InvoicePDF';

export function OrderDetailContent() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = Number(params.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirect = !authLoading && (!authUser || authUser.role !== 'admin');
    redirect && router.push('/login');
  }, [authUser, authLoading, router]);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const orderData = await ordersService.getOrder(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to load order data:', error);
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    authUser?.role === 'admin' && orderId && loadOrder();
  }, [authUser, orderId, loadOrder]);

  const getStatusColor = (status: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
    const statusMap: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
      'delivered': 'success',
      'in_transit': 'info',
      'preparing': 'warning',
      'cancelled': 'error',
    };
    return statusMap[status] || 'default';
  };

  const loadImageAsBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to load image:', error);
      return '';
    }
  };

  const handleDownloadInvoice = async () => {
    order && (async () => {
      const logoBase64 = await loadImageAsBase64('/logo.png');
      const blob = await pdf(<InvoicePDF order={order} logoBase64={logoBase64} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date(order.created_at);
      const dateStr = date.toISOString().split('T')[0];
      const storeName = order.store?.name || 'Store';
      const sanitizedStoreName = storeName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
      link.download = `invoice-${dateStr}-${sanitizedStoreName}-${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    })();
  };

  const handleSendInvoiceEmail = async () => {
    order && (async () => {
      await ordersService.sendInvoiceEmail(order.id);
      alert('Invoice sent successfully!');
    })().catch(() => {
      alert('Failed to send invoice. Please try again.');
    });
  };

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {(authLoading || loading) && (
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Container>
        )}
        {!authLoading && !loading && authUser && order && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push('/orders')}
                  >
                    Back to Orders
                  </Button>
                  <Typography variant="h4" component="h1">
                    Order #{order.id}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadInvoice}
                  >
                    Download Invoice
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<EmailIcon />}
                    onClick={handleSendInvoiceEmail}
                  >
                    Send Invoice
                  </Button>
                </Box>
              </Box>
            </motion.div>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Box sx={{ flex: { xs: '1', md: '2' } }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Order Items
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Image</TableCell>
                            <TableCell>Product</TableCell>
                            <TableCell>SKU</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Unit Price</TableCell>
                            <TableCell align="right">Subtotal</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {order.order_items?.map((item, index) => (
                            <TableRow
                              key={item.id}
                              component={motion.tr}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                              <TableCell>
                                {item.product?.image_url && item.product.image_url.trim() !== '' ? (
                                  <Avatar
                                    src={item.product.image_url}
                                    alt={item.product?.name || 'Product'}
                                    variant="rounded"
                                    sx={{
                                      width: 60,
                                      height: 60,
                                      bgcolor: '#e0e0e0',
                                    }}
                                  />
                                ) : (
                                  <Avatar
                                    variant="rounded"
                                    sx={{
                                      width: 60,
                                      height: 60,
                                      bgcolor: '#e0e0e0',
                                    }}
                                  >
                                    <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>
                                      No Image
                                    </Typography>
                                  </Avatar>
                                )}
                              </TableCell>
                              <TableCell>{item.product?.name || 'N/A'}</TableCell>
                              <TableCell>{item.product?.sku || '-'}</TableCell>
                              <TableCell align="right">{item.quantity}</TableCell>
                              <TableCell align="right">₱{item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                              <TableCell align="right">₱{item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {order.order_items?.length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                          No items in this order
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </motion.div>
              </Box>

              <Box sx={{ flex: { xs: '1', md: '1' } }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Order Information
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        ₱{order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Date Created
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {new Date(order.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {new Date(order.updated_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Paper>

                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Store Information
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Store Name
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {order.store?.name || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {order.store?.email || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {order.store?.phone || 'N/A'}
                      </Typography>
                    </Box>
                  </Paper>

                  <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Supplier Information
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Supplier Name
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {order.supplier?.name || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {order.supplier?.email || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {order.supplier?.phone || 'N/A'}
                      </Typography>
                    </Box>
                  </Paper>

                  {order.shipping_address && (
                    <Paper sx={{ p: 3, mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Shipping Address
                      </Typography>
                      <Typography variant="body1">
                        {order.shipping_address}
                      </Typography>
                    </Paper>
                  )}

                  {order.notes && (
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Notes
                      </Typography>
                      <Typography variant="body1">
                        {order.notes}
                      </Typography>
                    </Paper>
                  )}
                </motion.div>
              </Box>
            </Box>
          </>
        )}
      </Container>
    </AdminLayout>
  );
}

