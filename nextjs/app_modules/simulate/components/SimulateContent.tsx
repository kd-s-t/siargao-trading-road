'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Chip,
  CircularProgress,
  AppBar,
  Toolbar,
  useMediaQuery,
  useTheme,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountCircle as AccountIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  LocalShipping as TruckIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Phone as PhoneIcon,
  Send as SendIcon,
  ChatBubbleOutline as ChatIcon,
} from '@mui/icons-material';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { suppliersService, Supplier } from '@/lib/suppliers';
import { storesService, Store } from '@/lib/stores';
import { authService, User, LoginResponse } from '@/lib/auth';
import { Product, Order, OrderItem } from '@/lib/users';
import axios from 'axios';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/InvoicePDF';

const mobileApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020/api',
});

mobileApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('mobile_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const mobileAuthService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await mobileApi.post<LoginResponse>('/login', { email, password });
    return data;
  },
  getMe: async (): Promise<User> => {
    const { data } = await mobileApi.get<User>('/me');
    return data;
  },
};

const mobileOrderService = {
  getDraftOrder: async (supplierId?: number): Promise<Order | null> => {
    try {
      const params = supplierId ? { supplier_id: supplierId } : {};
      const { data } = await mobileApi.get<Order>('/orders/draft', { params });
      return data;
    } catch (error: unknown) {
      if ((error as { response?: { status?: number } })?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
  createDraftOrder: async (supplierId: number): Promise<Order> => {
    try {
      const { data } = await mobileApi.post<Order>('/orders/draft', { supplier_id: supplierId });
      return data;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown }; message?: string };
      console.error('CreateDraftOrder API Error:', {
        supplierId,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      throw error;
    }
  },
  addOrderItem: async (orderId: number, productId: number, quantity: number): Promise<Order> => {
    try {
      const { data } = await mobileApi.post<Order>(`/orders/${orderId}/items`, {
        product_id: productId,
        quantity,
      });
      return data;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown }; message?: string };
      console.error('AddOrderItem API Error:', {
        orderId,
        productId,
        quantity,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      throw error;
    }
  },
  updateOrderItem: async (itemId: number, quantity: number): Promise<Order> => {
    const { data } = await mobileApi.put<Order>(`/orders/items/${itemId}`, { quantity });
    return data;
  },
  removeOrderItem: async (itemId: number): Promise<void> => {
    await mobileApi.delete(`/orders/items/${itemId}`);
  },
  submitOrder: async (orderId: number): Promise<Order> => {
    const { data } = await mobileApi.post<Order>(`/orders/${orderId}/submit`);
    return data;
  },
  getOrders: async (): Promise<Order[]> => {
    const { data } = await mobileApi.get<Order[]>('/orders');
    return data;
  },
  updateOrderStatus: async (id: number, status: string): Promise<Order> => {
    const { data } = await mobileApi.put<Order>(`/orders/${id}/status`, { status });
    return data;
  },
};

export function SimulateContent() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileUser, setMobileUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);
  const [activeView, setActiveView] = useState<'suppliers' | 'stores' | 'orders' | 'supplier-products' | 'truck' | 'order-detail'>('suppliers');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [draftOrder, setDraftOrder] = useState<Order | null>(null);
  const [loadingDraftOrder, setLoadingDraftOrder] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ orderId: number; status: string } | null>(null);
  const [orderItemsExpanded, setOrderItemsExpanded] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const handleMobileLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await mobileAuthService.login(email, password);
      if (response.user.role === 'admin') {
        setError('Admin accounts cannot login in mobile simulator');
        setLoading(false);
        return;
      }
      sessionStorage.setItem('mobile_token', response.token);
      setMobileUser(response.user);
      setEmail('');
      setPassword('');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMobileLogout = () => {
    sessionStorage.removeItem('mobile_token');
    setMobileUser(null);
    setActiveView('suppliers');
  };

  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const { data } = await mobileApi.get<Supplier[]>('/suppliers');
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const loadStores = async () => {
    try {
      setLoadingStores(true);
      const { data } = await mobileApi.get<Store[]>('/stores');
      setStores(data);
    } catch (error) {
      console.error('Failed to load stores:', error);
    } finally {
      setLoadingStores(false);
    }
  };

  useEffect(() => {
    const mobileToken = sessionStorage.getItem('mobile_token');
    if (mobileToken) {
      mobileAuthService.getMe()
        .then((userData: User) => {
          if (userData.role !== 'admin') {
            setMobileUser(userData);
          } else {
            sessionStorage.removeItem('mobile_token');
          }
        })
        .catch(() => {
          sessionStorage.removeItem('mobile_token');
        });
    }
  }, []);

  useEffect(() => {
    if (mobileUser) {
      if (mobileUser.role === 'store') {
      loadSuppliers();
      } else if (mobileUser.role === 'supplier') {
      loadStores();
      }
    }
  }, [mobileUser]);

  useEffect(() => {
    if (mobileUser && (mobileUser.role === 'supplier' || mobileUser.role === 'store')) {
      loadOrders();
    }
  }, [mobileUser?.id]);

  useEffect(() => {
    if (activeView === 'orders' && mobileUser && (mobileUser.role === 'supplier' || mobileUser.role === 'store')) {
      loadOrders();
    }
  }, [activeView]);

  const loadSupplierProducts = async (supplierId: number) => {
    try {
      setLoadingProducts(true);
      const { data } = await mobileApi.get<Product[]>(`/suppliers/${supplierId}/products`);
      setSupplierProducts(data);
    } catch (error) {
      console.error('Failed to load supplier products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSupplierClick = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setActiveView('supplier-products');
    await loadSupplierProducts(supplier.id);
  };

  const handleAddToTruck = async (product: Product) => {
    if (!selectedSupplier) return;

    try {
      setError('');
      
      if (mobileUser?.role !== 'store') {
        setError('Only stores can create orders');
        setTimeout(() => setError(''), 5000);
        return;
      }

      let order = await mobileOrderService.getDraftOrder(selectedSupplier.id);
      if (!order) {
        console.log('Creating new draft order for supplier:', selectedSupplier.id, 'by store:', mobileUser.id);
        try {
          order = await mobileOrderService.createDraftOrder(selectedSupplier.id);
          console.log('Created draft order:', order);
        } catch (createErr: unknown) {
          const err = createErr as { response?: { data?: { error?: string } }; message?: string };
          const errorMsg = err.response?.data?.error || err.message || 'Failed to create draft order';
          console.error('Failed to create draft order:', createErr);
          setError(errorMsg);
          setTimeout(() => setError(''), 5000);
          return;
        }
      } else {
        console.log('Using existing draft order:', order);
      }

      if (!order || !order.id) {
        setError('Failed to create or retrieve draft order');
        setTimeout(() => setError(''), 5000);
        return;
      }

      if (order.status !== 'draft') {
        setError(`Order status is ${order.status}, expected draft`);
        setTimeout(() => setError(''), 5000);
        return;
      }

      const quantity = parseInt(quantities[product.id] || '1', 10);
      if (quantity < 1) {
        setError('Quantity must be at least 1');
        setTimeout(() => setError(''), 3000);
        return;
      }

      if (quantity > product.stock_quantity) {
        setError(`Quantity exceeds available stock (${product.stock_quantity})`);
        setTimeout(() => setError(''), 5000);
        return;
      }

      console.log('Adding to truck:', { orderId: order.id, productId: product.id, quantity, supplierId: selectedSupplier.id });
      await mobileOrderService.addOrderItem(order.id, product.id, quantity);
      setQuantities({ ...quantities, [product.id]: '' });
      await loadDraftOrder(selectedSupplier.id);
      setToast({ message: `${product.name} added to truck`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add item to truck';
      console.error('Add to truck error:', err);
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const loadDraftOrder = async (supplierId?: number) => {
    try {
      setLoadingDraftOrder(true);
      setError('');
      const order = await mobileOrderService.getDraftOrder(supplierId);
      setDraftOrder(order);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { error?: string } } };
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error || 'Failed to load draft order');
        setTimeout(() => setError(''), 5000);
      }
      setDraftOrder(null);
    } finally {
      setLoadingDraftOrder(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!draftOrder) return;

    try {
      setError('');
      await mobileOrderService.submitOrder(draftOrder.id);
      setDraftOrder(null);
      setActiveView('orders');
      await loadOrders();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to submit order');
      setTimeout(() => setError(''), 5000);
    }
  };

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const data = await mobileOrderService.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      setError('');
      const updatedOrder = await mobileOrderService.updateOrderStatus(orderId, status);
      await loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      setToast({ message: `Order status updated to ${status.replace('_', ' ')}`, type: 'success' });
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update order status');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleMarkDeliveredClick = (orderId: number) => {
    setPendingStatusUpdate({ orderId, status: 'delivered' });
    setConfirmDialogOpen(true);
  };

  const handleConfirmStatusUpdate = () => {
    if (pendingStatusUpdate) {
      handleUpdateOrderStatus(pendingStatusUpdate.orderId, pendingStatusUpdate.status);
      setConfirmDialogOpen(false);
      setPendingStatusUpdate(null);
    }
  };

  const handleCancelStatusUpdate = () => {
    setConfirmDialogOpen(false);
    setPendingStatusUpdate(null);
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

  const handleDownloadInvoice = async (order: Order) => {
    try {
      const logoBase64 = await loadImageAsBase64('/logo.png');
      const blob = await pdf(<InvoicePDF order={order} logoBase64={logoBase64} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const date = new Date(order.created_at);
      const dateStr = date.toISOString().split('T')[0];
      const storeName = order.store?.name || 'Store';
      const sanitizedStoreName = storeName
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
      
      link.download = `invoice-${dateStr}-${sanitizedStoreName}-${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToast({ message: 'Invoice downloaded successfully', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      setToast({ message: 'Failed to generate invoice', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const drawerContent = (onItemClick?: () => void) => {
    const nonDeliveredCount = orders.filter(order => order.status !== 'delivered').length;

  const menuItems = [
      ...(mobileUser?.role === 'supplier' ? [] : [{ label: 'Suppliers', icon: <StoreIcon />, view: 'suppliers' as const }]),
      ...(mobileUser?.role === 'store' ? [] : [{ label: 'Stores', icon: <StoreIcon />, view: 'stores' as const }]),
      { 
        label: 'Orders', 
        icon: (
          <Badge badgeContent={nonDeliveredCount} color="error" overlap="circular">
            <ShoppingCartIcon />
          </Badge>
        ), 
        view: 'orders' as const 
      },
    { label: 'Profile', icon: <AccountIcon />, view: null },
  ];

    return (
    <Box sx={{ pt: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          position: 'relative',
          height: 150,
          bgcolor: '#e0e0e0',
          mb: 8,
        }}
      >
        {mobileUser?.banner_url && mobileUser.banner_url.trim() !== '' ? (
          <Box
            component="img"
            src={mobileUser.banner_url}
            alt="Banner"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}
        <Box
          sx={{
            position: 'absolute',
            bottom: -40,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {mobileUser?.logo_url && mobileUser.logo_url.trim() !== '' ? (
            <Avatar
              src={mobileUser.logo_url}
              sx={{
                width: 80,
                height: 80,
                border: '3px solid white',
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 80,
                height: 80,
                border: '3px solid white',
                bgcolor: '#1976d2',
              }}
            >
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                {mobileUser?.name?.charAt(0).toUpperCase() || 'U'}
              </Typography>
            </Avatar>
          )}
        </Box>
      </Box>

      <Box sx={{ px: 2, pb: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {mobileUser?.name || 'User'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {mobileUser?.email}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
          {mobileUser?.role}
        </Typography>
      </Box>

      <Divider />

      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton
              onClick={() => {
                if (item.view) {
                  setActiveView(item.view);
                }
                if (onItemClick) {
                  onItemClick();
                }
              }}
              selected={item.view === activeView}
            >
              <ListItemIcon sx={{ color: '#1976d2' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      <ListItem disablePadding>
        <ListItemButton onClick={handleMobileLogout}>
          <ListItemIcon sx={{ color: '#d32f2f' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" sx={{ color: '#d32f2f' }} />
        </ListItemButton>
      </ListItem>
    </Box>
    );
  };

  const mobileContent = !mobileUser ? (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        p: 2.5,
        overflow: 'auto',
      }}
    >
        <Paper
        elevation={3}
          sx={{
          p: 3,
          borderRadius: 2,
          width: '100%',
          maxWidth: 400,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Image
              src="/logo.png"
              alt="Siargao Trading Road Logo"
              width={200}
              height={80}
              style={{ height: 80, width: 'auto' }}
            />
          </Box>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3, opacity: 0.7 }}>
            Sign in to continue
          </Typography>

          {error && (
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: 1,
              bgcolor: '#ffebee',
            }}
          >
            <Typography color="error" align="center" variant="body2">
              {error}
            </Typography>
          </Paper>
          )}

        <form onSubmit={handleMobileLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            variant="outlined"
            sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            variant="outlined"
            sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
            sx={{ mt: 1, py: 1 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>
        </Paper>
    </Box>
  ) : (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#f5f5f5', overflow: 'hidden', position: 'relative', width: '100%' }}>
      <AppBar
        position="relative"
        sx={{
          zIndex: 10,
          bgcolor: '#1976d2',
          width: '100%',
          flexShrink: 0,
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => {
              if (activeView === 'supplier-products' || activeView === 'truck') {
                if (activeView === 'truck') {
                  setActiveView('supplier-products');
                } else {
                  setActiveView('suppliers');
                  setSelectedSupplier(null);
                }
              } else if (activeView === 'order-detail') {
                setActiveView('orders');
                setSelectedOrder(null);
              } else {
                setDrawerOpen(true);
              }
            }}
            sx={{ mr: 2 }}
          >
            {(activeView === 'supplier-products' || activeView === 'truck' || activeView === 'order-detail') ? <ArrowBackIcon /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {activeView === 'suppliers' ? 'Suppliers' : 
             activeView === 'stores' ? 'Stores' : 
             activeView === 'supplier-products' ? selectedSupplier?.name || 'Products' :
             activeView === 'truck' ? 'Truck' :
             activeView === 'order-detail' ? `Order #${selectedOrder?.id || ''}` :
             'Orders'}
          </Typography>
          {activeView === 'supplier-products' && (
            <IconButton
              color="inherit"
              onClick={async () => {
                if (selectedSupplier) {
                  await loadDraftOrder(selectedSupplier.id);
                  setActiveView('truck');
                }
              }}
              title="View Truck"
            >
              <Badge
                badgeContent={draftOrder?.order_items?.length || 0}
                color="error"
                overlap="circular"
              >
                <TruckIcon />
              </Badge>
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        disablePortal
        sx={{
          position: 'absolute',
          width: 280,
          flexShrink: 0,
          zIndex: 20,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            position: 'absolute',
            height: '100%',
            top: 0,
            left: 0,
          },
        }}
      >
        {drawerContent(() => setDrawerOpen(false))}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          overflow: 'auto',
          minHeight: 0,
        }}
      >
        {error && (
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: 1,
              bgcolor: '#ffebee',
        }}
      >
            <Typography color="error" align="center" variant="body2">
              {error}
            </Typography>
          </Paper>
        )}
        {activeView === 'suppliers' && (
          <Box>
            {loadingSuppliers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
              </Box>
            ) : suppliers.length === 0 ? (
              <Card>
                <CardContent>
                  <Typography variant="body1" align="center">
                    No suppliers available
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {suppliers.map((supplier) => (
                  <Card 
                    key={supplier.id} 
                    sx={{ overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => handleSupplierClick(supplier)}
                  >
                    {supplier.banner_url && supplier.banner_url.trim() !== '' ? (
                      <CardMedia
                        component="img"
                        height="180"
                        image={supplier.banner_url}
                        alt={supplier.name}
                      />
                    ) : null}
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {supplier.logo_url && supplier.logo_url.trim() !== '' ? (
                          <Avatar
                            src={supplier.logo_url}
                            sx={{ width: 80, height: 80, mr: 2, border: '2px solid #e0e0e0' }}
                          />
                        ) : (
                          <Avatar
                            sx={{
                              width: 80,
                              height: 80,
                              mr: 2,
                              border: '2px solid #e0e0e0',
                              bgcolor: '#1976d2',
                            }}
                          >
                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {supplier.name.charAt(0).toUpperCase()}
                            </Typography>
                          </Avatar>
                        )}
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {supplier.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {supplier.email}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="body2" sx={{ mb: 1.5, opacity: 0.8 }}>
                        {supplier.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                          Products Available:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          {supplier.product_count}
                        </Typography>
                      </Box>
                      {supplier.phone && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                            Phone:
                          </Typography>
                          <Typography variant="body2">{supplier.phone}</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}

        {activeView === 'stores' && (
          <Box>
            {loadingStores ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
              </Box>
            ) : stores.length === 0 ? (
              <Card>
                <CardContent>
                  <Typography variant="body1" align="center">
                    No stores available
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stores.map((store) => (
                  <Card key={store.id} sx={{ overflow: 'hidden' }}>
                    {store.banner_url && store.banner_url.trim() !== '' ? (
                      <CardMedia
                        component="img"
                        height="180"
                        image={store.banner_url}
                        alt={store.name}
                      />
                    ) : null}
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {store.logo_url && store.logo_url.trim() !== '' ? (
                          <Avatar
                            src={store.logo_url}
                            sx={{ width: 80, height: 80, mr: 2, border: '2px solid #e0e0e0' }}
                          />
                        ) : (
                          <Avatar
                            sx={{
                              width: 80,
                              height: 80,
                              mr: 2,
                              border: '2px solid #e0e0e0',
                              bgcolor: '#1976d2',
                            }}
                          >
                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {store.name.charAt(0).toUpperCase()}
                            </Typography>
                          </Avatar>
                        )}
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {store.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {store.email}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="body2" sx={{ mb: 1.5, opacity: 0.8 }}>
                        {store.description}
                      </Typography>
                      {store.phone && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                            Phone:
                          </Typography>
                          <Typography variant="body2">{store.phone}</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}

        {activeView === 'supplier-products' && (
          <Box>
            {loadingProducts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
      </Box>
            ) : supplierProducts.length === 0 ? (
              <Card>
                <CardContent>
                  <Typography variant="body1" align="center">
                    No products available
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {supplierProducts.map((product) => (
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
                          ₱{product.price.toFixed(2)}
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
            )}
          </Box>
        )}

        {activeView === 'truck' && (
          <Box>
            {loadingDraftOrder ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
              </Box>
            ) : !draftOrder || !draftOrder.order_items || draftOrder.order_items.length === 0 ? (
              <Card>
                <CardContent>
                  <Typography variant="body1" align="center" sx={{ mb: 2 }}>
                    Your truck is empty
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setActiveView('supplier-products')}
                  >
                    Browse Products
                  </Button>
                </CardContent>
              </Card>
            ) : (
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
                            ₱{item.unit_price.toFixed(2)} each
                          </Typography>
                        </Box>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={async () => {
                            try {
                              await mobileOrderService.removeOrderItem(item.id);
                              if (selectedSupplier) {
                                await loadDraftOrder(selectedSupplier.id);
                              }
                            } catch (err: unknown) {
                              setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to remove item');
                            }
                          }}
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
                            onClick={async () => {
                              if (item.quantity > 1) {
                                try {
                                  await mobileOrderService.updateOrderItem(item.id, item.quantity - 1);
                                  if (selectedSupplier) {
                                    await loadDraftOrder(selectedSupplier.id);
                                  }
                                } catch (err: unknown) {
                                  setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update quantity');
                                }
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
                            onClick={async () => {
                              try {
                                await mobileOrderService.updateOrderItem(item.id, item.quantity + 1);
                                if (selectedSupplier) {
                                  await loadDraftOrder(selectedSupplier.id);
                                }
                              } catch (err: unknown) {
                                setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update quantity');
                              }
                            }}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', ml: 2 }}>
                          ₱{item.subtotal.toFixed(2)}
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
                        ₱{draftOrder.total_amount.toFixed(2)}
                      </Typography>
                    </Box>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSubmitOrder}
                      sx={{ mt: 2 }}
                    >
                      Submit Order
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        )}

        {activeView === 'orders' && (
          <Box>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="All"
                onClick={() => setOrderStatusFilter(null)}
                color={orderStatusFilter === null ? 'primary' : 'default'}
                variant={orderStatusFilter === null ? 'filled' : 'outlined'}
                size="small"
              />
              <Chip
                label="Draft"
                onClick={() => setOrderStatusFilter('draft')}
                color={orderStatusFilter === 'draft' ? 'primary' : 'default'}
                variant={orderStatusFilter === 'draft' ? 'filled' : 'outlined'}
                size="small"
              />
              <Chip
                label="Preparing"
                onClick={() => setOrderStatusFilter('preparing')}
                color={orderStatusFilter === 'preparing' ? 'primary' : 'default'}
                variant={orderStatusFilter === 'preparing' ? 'filled' : 'outlined'}
                size="small"
              />
              <Chip
                label="In Transit"
                onClick={() => setOrderStatusFilter('in_transit')}
                color={orderStatusFilter === 'in_transit' ? 'primary' : 'default'}
                variant={orderStatusFilter === 'in_transit' ? 'filled' : 'outlined'}
                size="small"
              />
              <Chip
                label="Delivered"
                onClick={() => setOrderStatusFilter('delivered')}
                color={orderStatusFilter === 'delivered' ? 'primary' : 'default'}
                variant={orderStatusFilter === 'delivered' ? 'filled' : 'outlined'}
                size="small"
              />
              <Chip
                label="Cancelled"
                onClick={() => setOrderStatusFilter('cancelled')}
                color={orderStatusFilter === 'cancelled' ? 'primary' : 'default'}
                variant={orderStatusFilter === 'cancelled' ? 'filled' : 'outlined'}
                size="small"
              />
            </Box>
            {loadingOrders ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
              </Box>
            ) : (() => {
              const filteredOrders = orderStatusFilter 
                ? orders.filter(order => order.status === orderStatusFilter)
                : orders;
              
              if (filteredOrders.length === 0) {
                return (
                  <Card>
                    <CardContent>
                      <Typography variant="body1" align="center">
                        No orders available{orderStatusFilter ? ` with status "${orderStatusFilter}"` : ''}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              }

  return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredOrders.map((order) => (
                  <Card 
                    key={order.id}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => {
                      setSelectedOrder(order);
                      setActiveView('order-detail');
                      setOrderItemsExpanded(false);
                    }}
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
                          ₱{order.total_amount.toFixed(2)}
                        </Typography>
                      </Box>
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
                                  {item.quantity} {item.product.unit || 'units'} × ₱{item.unit_price.toFixed(2)}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', flexShrink: 0 }}>
                                ₱{item.subtotal.toFixed(2)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadInvoice(order)}
                          fullWidth
                        >
                          Download Invoice
                        </Button>
                      </Box>
                      {mobileUser?.role === 'supplier' && order.status === 'preparing' && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleUpdateOrderStatus(order.id, 'in_transit')}
                          >
                            Mark In Transit
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleMarkDeliveredClick(order.id)}
                          >
                            Mark Delivered
                          </Button>
                        </Box>
                      )}
                      {mobileUser?.role === 'supplier' && order.status === 'in_transit' && (
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            fullWidth
                            size="small"
                            onClick={() => handleMarkDeliveredClick(order.id)}
                          >
                            Mark Delivered
                          </Button>
                        </Box>
                      )}
                      {mobileUser?.role === 'supplier' && order.status === 'delivered' && (
                        <Box sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            fullWidth
                            size="small"
                            color="warning"
                            onClick={() => handleUpdateOrderStatus(order.id, 'in_transit')}
                          >
                            Revert to In Transit
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
                </Box>
              );
            })()}
          </Box>
        )}

        {activeView === 'order-detail' && selectedOrder && (
          <Box>
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ p: 0 }}>
                <Box
                  sx={{
                    width: '100%',
                    height: 250,
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: '#e3f2fd',
                    backgroundImage: 'radial-gradient(circle at 2px 2px, #90caf9 1px, transparent 0)',
                    backgroundSize: '20px 20px',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '30%',
                      left: '30%',
                      display: 'flex',
                      flexDirection: 'column',
          alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: '16px solid #1976d2',
                      }}
                    />
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: '#1976d2',
                        border: '3px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '60%',
                      left: '60%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: '16px solid #f44336',
                      }}
                    />
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: '#f44336',
                        border: '3px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '30%',
                      left: '30%',
                      width: 'calc(60% - 30%)',
                      height: 'calc(60% - 30%)',
                      border: '2px dashed #1976d2',
                      borderTop: 'none',
                      borderRight: 'none',
                      pointerEvents: 'none',
                    }}
                  />
                </Box>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: '#1976d2',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Store Location
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: '#f44336',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Truck Location
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Order #{selectedOrder.id}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                    {mobileUser?.role === 'supplier' ? 'Store' : 'Supplier'}:
                  </Typography>
                  <Typography variant="body2">
                    {mobileUser?.role === 'supplier' ? selectedOrder.store?.name : selectedOrder.supplier?.name}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                    Status:
                  </Typography>
                  <Chip 
                    label={selectedOrder.status} 
                    color={
                      selectedOrder.status === 'delivered' ? 'success' :
                      selectedOrder.status === 'cancelled' ? 'error' :
                      selectedOrder.status === 'in_transit' ? 'info' :
                      'default'
                    }
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                    Total:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1.1rem' }}>
                    ₱{selectedOrder.total_amount.toFixed(2)}
                  </Typography>
                </Box>

                {selectedOrder.created_at && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                      Date Created:
                    </Typography>
                    <Typography variant="body2">
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {selectedOrder.updated_at && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                      Last Updated:
                    </Typography>
                    <Typography variant="body2">
                      {new Date(selectedOrder.updated_at).toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {selectedOrder.shipping_address && (
                  <Box sx={{ mb: 2 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7, mb: 0.5 }}>
                      Shipping Address:
                    </Typography>
                    <Typography variant="body2">
                      {selectedOrder.shipping_address}
                    </Typography>
                  </Box>
                )}

                {selectedOrder.notes && (
                  <Box sx={{ mb: 2 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7, mb: 0.5 }}>
                      Notes:
                    </Typography>
                    <Typography variant="body2">
                      {selectedOrder.notes}
                    </Typography>
                  </Box>
                )}

                {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                      Order Items:
                    </Typography>
                    {selectedOrder.order_items.length > 3 ? (
                      <>
                        {selectedOrder.order_items.slice(0, 3).map((item) => (
                          <Card key={item.id} sx={{ mb: 1.5, bgcolor: '#f5f5f5' }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                                {item.product.image_url && item.product.image_url.trim() !== '' ? (
                                  <Box
                                    component="img"
                                    src={item.product.image_url}
                                    alt={item.product.name}
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
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                    {item.product.name}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                  SKU:
                                </Typography>
                                <Typography variant="body2">
                                  {item.product.sku || '-'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                  Quantity:
                                </Typography>
                                <Typography variant="body2">
                                  {item.quantity} {item.product.unit || 'units'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                  Unit Price:
                                </Typography>
                                <Typography variant="body2">
                                  ₱{item.unit_price.toFixed(2)}
                                </Typography>
                              </Box>
                              <Divider sx={{ my: 1 }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Subtotal:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                                  ₱{item.subtotal.toFixed(2)}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                        <Accordion
                          expanded={orderItemsExpanded}
                          onChange={(e, expanded) => setOrderItemsExpanded(expanded)}
                          sx={{ mb: 1.5, bgcolor: '#f5f5f5', '&:before': { display: 'none' } }}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{ px: 1.5, py: 1 }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {orderItemsExpanded 
                                ? `Hide ${selectedOrder.order_items.length - 3} more items`
                                : `Show ${selectedOrder.order_items.length - 3} more items`}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ p: 0 }}>
                            {selectedOrder.order_items.slice(3).map((item) => (
                              <Card key={item.id} sx={{ mb: 1.5, bgcolor: '#fff', mx: 1.5 }}>
                                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                                    {item.product.image_url && item.product.image_url.trim() !== '' ? (
                                      <Box
                                        component="img"
                                        src={item.product.image_url}
                                        alt={item.product.name}
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
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                        {item.product.name}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                      SKU:
                                    </Typography>
                                    <Typography variant="body2">
                                      {item.product.sku || '-'}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                      Quantity:
                                    </Typography>
                                    <Typography variant="body2">
                                      {item.quantity} {item.product.unit || 'units'}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                      Unit Price:
                                    </Typography>
                                    <Typography variant="body2">
                                      ₱{item.unit_price.toFixed(2)}
                                    </Typography>
                                  </Box>
                                  <Divider sx={{ my: 1 }} />
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      Subtotal:
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                                      ₱{item.subtotal.toFixed(2)}
                                    </Typography>
                                  </Box>
                                </CardContent>
                              </Card>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      </>
                    ) : (
                      selectedOrder.order_items.map((item) => (
                        <Card key={item.id} sx={{ mb: 1.5, bgcolor: '#f5f5f5' }}>
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                              {item.product.image_url && item.product.image_url.trim() !== '' ? (
                                <Box
                                  component="img"
                                  src={item.product.image_url}
                                  alt={item.product.name}
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
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                  {item.product.name}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                SKU:
                              </Typography>
                              <Typography variant="body2">
                                {item.product.sku || '-'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                Quantity:
                              </Typography>
                              <Typography variant="body2">
                                {item.quantity} {item.product.unit || 'units'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                Unit Price:
                              </Typography>
                              <Typography variant="body2">
                                ₱{item.unit_price.toFixed(2)}
                              </Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Subtotal:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                                ₱{item.subtotal.toFixed(2)}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>

            {selectedOrder.store && selectedOrder.supplier && (
                  <Card sx={{ mt: 3, mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <ChatIcon />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Chat
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 2,
                          bgcolor: '#fafafa',
                          height: 200,
                          overflowY: 'auto',
                          p: 2,
                          mb: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            alignSelf: 'flex-start',
                            maxWidth: '75%',
                            bgcolor: '#e3f2fd',
                            p: 1.5,
                            borderRadius: 2,
                            borderTopLeftRadius: 0,
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5, opacity: 0.7 }}>
                            {mobileUser?.role === 'supplier' ? selectedOrder.store?.name : selectedOrder.supplier?.name}
                          </Typography>
                          <Typography variant="body2">
                            Hello, when will this order be ready?
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.6 }}>
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            alignSelf: 'flex-end',
                            maxWidth: '75%',
                            bgcolor: '#4caf50',
                            color: 'white',
                            p: 1.5,
                            borderRadius: 2,
                            borderTopRightRadius: 0,
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5, opacity: 0.9 }}>
                            {mobileUser?.role === 'supplier' ? selectedOrder.supplier?.name : selectedOrder.store?.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            It should be ready by tomorrow afternoon.
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Type a message..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && chatMessage.trim()) {
                              setChatMessage('');
                            }
                          }}
                          disabled
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              bgcolor: 'white',
                            },
                          }}
                        />
                        <IconButton
                          color="primary"
                          disabled
                          sx={{
                            bgcolor: '#1976d2',
                            color: 'white',
                            '&:hover': {
                              bgcolor: '#1565c0',
                            },
                            '&.Mui-disabled': {
                              bgcolor: '#e0e0e0',
                              color: '#9e9e9e',
                            },
                          }}
                        >
                          <SendIcon />
                        </IconButton>
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.6, textAlign: 'center' }}>
                        Chat will be functional in mobile app
                      </Typography>
                      
                      {mobileUser?.role === 'supplier' && selectedOrder.store && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Button
                            variant="contained"
                            size="medium"
                            startIcon={<PhoneIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            fullWidth
                            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
                          >
                            Call {selectedOrder.store.name}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card sx={{ mt: 3, mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="medium"
                        startIcon={<DownloadIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadInvoice(selectedOrder);
                        }}
                        fullWidth
                      >
                        Download Invoice
                      </Button>
                      
                      {mobileUser?.role === 'supplier' && selectedOrder.status === 'preparing' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            fullWidth
                            size="medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateOrderStatus(selectedOrder.id, 'in_transit');
                            }}
                          >
                            Mark In Transit
                          </Button>
                          <Button
                            variant="outlined"
                            fullWidth
                            size="medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkDeliveredClick(selectedOrder.id);
                            }}
                          >
                            Mark Delivered
                          </Button>
                        </Box>
                      )}
                      
                      {mobileUser?.role === 'supplier' && selectedOrder.status === 'in_transit' && (
                        <Button
                          variant="outlined"
                          fullWidth
                          size="medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkDeliveredClick(selectedOrder.id);
                          }}
                        >
                          Mark Delivered
                        </Button>
                      )}

                      {mobileUser?.role === 'supplier' && selectedOrder.status === 'delivered' && (
                        <Button
                          variant="outlined"
                          fullWidth
                          size="medium"
                          color="warning"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateOrderStatus(selectedOrder.id, 'in_transit');
                          }}
                        >
                          Revert to In Transit
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <AdminLayout>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          height: 'calc(100vh - 64px)',
          overflow: 'hidden',
          boxSizing: 'border-box',
          pt: 1,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 420,
              height: 'calc(100vh - 64px - 64px)',
              maxHeight: 'calc(100vh - 64px - 64px)',
            bgcolor: '#000',
            borderRadius: 4,
            p: 2,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
              pointerEvents: 'auto',
              boxSizing: 'border-box',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 60,
              height: 4,
              bgcolor: '#333',
              borderRadius: 2,
              zIndex: 1000,
            }}
          />
          <Box
            sx={{
              width: '100%',
              height: '100%',
              bgcolor: '#fff',
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
                pointerEvents: 'auto',
            }}
          >
            {mobileContent}
              {toast && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 80,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    minWidth: 200,
                    maxWidth: '90%',
                    animation: 'slideDown 0.3s ease-out',
                    '@keyframes slideDown': {
                      from: {
                        opacity: 0,
                        transform: 'translateX(-50%) translateY(-20px)',
                      },
                      to: {
                        opacity: 1,
                        transform: 'translateX(-50%) translateY(0)',
                      },
                    },
                  }}
                >
                  <Paper
                    elevation={6}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: toast.type === 'success' ? '#4caf50' : '#f44336',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {toast.message}
                    </Typography>
                  </Paper>
          </Box>
              )}
        </Box>
      </Box>
      </Box>

      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelStatusUpdate}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          Confirm Mark as Delivered
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            Are you sure you want to mark this order as delivered? This action will update the order status permanently.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelStatusUpdate} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmStatusUpdate} color="primary" variant="contained" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}

