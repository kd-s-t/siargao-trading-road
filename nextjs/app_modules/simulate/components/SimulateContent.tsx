'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  Drawer,
  IconButton,
  AppBar,
  Toolbar,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  LocalShipping as TruckIcon,
} from '@mui/icons-material';
import AdminLayout from '@/components/AdminLayout';
import { Supplier } from '@/lib/suppliers';
import { User, LoginResponse } from '@/lib/auth';
import { Order } from '@/lib/users';
import { mobileAuthService, mobileOrderService } from '../services/mobileApi';
import { MobileLogin } from './MobileLogin';
import { MobileRegister } from './MobileRegister';
import { MobileDrawer } from './MobileDrawer';
import { useSuppliers, useStores, useSupplierProducts, useMyProducts } from '../hooks/useMobileData';
import { useMobileOrders, useDraftOrder } from '../hooks/useMobileOrders';
import { useMessages } from '../hooks/useMessages';
import { SuppliersView, StoresView, SupplierProductsView, MyProductsView, TruckView, OrdersView, OrderDetailView, ProfileView, RatingsListView } from './views';

export function SimulateContent() {
  const [mobileUser, setMobileUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [activeView, setActiveView] = useState<'suppliers' | 'stores' | 'orders' | 'supplier-products' | 'truck' | 'order-detail' | 'profile' | 'ratings-list' | 'my-products'>('profile');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const { suppliers, loading: loadingSuppliers, loadSuppliers } = useSuppliers();
  const { stores, loading: loadingStores, loadStores } = useStores();
  const { products: supplierProducts, loading: loadingProducts, loadProducts } = useSupplierProducts(selectedSupplier?.id || null);
  const { products: myProducts, loading: loadingMyProducts, loadProducts: loadMyProducts } = useMyProducts();
  const { orders, loading: loadingOrders, loadOrders } = useMobileOrders();
  const { draftOrder, loading: loadingDraftOrder, loadDraftOrder } = useDraftOrder(selectedSupplier?.id || null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ orderId: number; status: string } | null>(null);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const { messages, loading: loadingMessages, loadMessages, sendMessage } = useMessages(selectedOrder?.id || null);

  const handleLoginSuccess = (response: LoginResponse) => {
      setMobileUser(response.user);
  };

  const handleRegisterSuccess = (response: LoginResponse) => {
      setMobileUser(response.user);
      setShowRegister(false);
  };

  const handleMobileLogout = () => {
    sessionStorage.removeItem('mobile_token');
    setMobileUser(null);
    setActiveView('suppliers');
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
    if (mobileUser && activeView === 'suppliers' && mobileUser.role === 'store') {
      loadSuppliers();
    } else if (mobileUser && activeView === 'stores' && mobileUser.role === 'supplier') {
      loadStores();
    } else if (mobileUser && activeView === 'my-products' && mobileUser.role === 'supplier') {
      loadMyProducts();
    }
  }, [mobileUser, activeView, loadSuppliers, loadStores, loadMyProducts]);

  useEffect(() => {
    if (mobileUser && (mobileUser.role === 'supplier' || mobileUser.role === 'store') && activeView !== 'profile' && activeView !== 'ratings-list') {
      loadOrders();
    }
  }, [mobileUser, activeView, loadOrders]);

  useEffect(() => {
    if (activeView === 'orders' && mobileUser && (mobileUser.role === 'supplier' || mobileUser.role === 'store')) {
      loadOrders();
    }
  }, [activeView, mobileUser, loadOrders]);


  const handleSupplierClick = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setActiveView('supplier-products');
    await loadProducts(supplier.id);
  };



  const handleSubmitOrder = async () => {
    if (!draftOrder) return;

    try {
      setError('');
      await mobileOrderService.submitOrder(draftOrder.id);
      await loadDraftOrder();
      setActiveView('orders');
      await loadOrders();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to submit order');
      setTimeout(() => setError(''), 5000);
    }
  };


  const refreshMessages = async () => {
    if (!selectedOrder) return;
    await loadMessages(selectedOrder.id);
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


  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please select an image file', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'File size must be less than 5MB', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setUploading(type);
    try {
      const result = await mobileAuthService.uploadImage(file, 'user');
      const updates = type === 'logo' 
        ? { logo_url: result.url }
        : { banner_url: result.url };
      
      const updatedUser = await mobileAuthService.updateMe(updates);
      setMobileUser(updatedUser);
      
      setToast({ message: 'Image updated successfully', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setToast({ message: err.response?.data?.error || 'Failed to upload image', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setUploading(null);
    }
  };



  const mobileContent = !mobileUser ? (
    showRegister ? (
      <MobileRegister 
        onRegisterSuccess={handleRegisterSuccess} 
        onSwitchToLogin={() => setShowRegister(false)}
      />
    ) : (
      <MobileLogin 
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    )
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
             activeView === 'my-products' ? 'My Products' :
             activeView === 'truck' ? 'Truck' :
             activeView === 'order-detail' ? `Order #${selectedOrder?.id || ''}` :
             activeView === 'profile' ? 'Profile' :
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
        <MobileDrawer
          mobileUser={mobileUser}
          orders={orders}
          activeView={activeView}
          onViewChange={(view) => {
            setActiveView(view);
            setDrawerOpen(false);
          }}
          onLogout={handleMobileLogout}
        />
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
          <SuppliersView
            suppliers={suppliers}
            loading={loadingSuppliers}
            onSupplierClick={handleSupplierClick}
          />
        )}

        {activeView === 'stores' && (
          <StoresView stores={stores} loading={loadingStores} />
        )}

        {activeView === 'my-products' && (
          <MyProductsView
            products={myProducts}
            loading={loadingMyProducts}
            onRefresh={loadMyProducts}
            onError={setError}
            onToast={(message, type) => {
              setToast({ message, type });
              setTimeout(() => setToast(null), 3000);
            }}
          />
        )}

        {activeView === 'supplier-products' && (
          <SupplierProductsView
            products={supplierProducts}
            loading={loadingProducts}
            mobileUser={mobileUser}
            selectedSupplier={selectedSupplier}
            onAddToTruck={async () => {
              if (selectedSupplier) {
                await loadDraftOrder(selectedSupplier.id);
              }
            }}
            onError={setError}
            onToast={(message, type) => {
              setToast({ message, type });
              setTimeout(() => setToast(null), 3000);
            }}
          />
        )}

        {activeView === 'truck' && (
          <TruckView
            draftOrder={draftOrder}
            loading={loadingDraftOrder}
            selectedSupplier={selectedSupplier}
            onViewChange={(view) => setActiveView(view)}
            onDraftOrderReload={loadDraftOrder}
            onSubmitOrder={handleSubmitOrder}
            onError={setError}
          />
        )}

        {activeView === 'orders' && (
          <OrdersView
            orders={orders}
            loading={loadingOrders}
            mobileUser={mobileUser}
            onOrderClick={(order) => {
                      setSelectedOrder(order);
                      setActiveView('order-detail');
            }}
            onUpdateStatus={handleUpdateOrderStatus}
            onMarkDeliveredClick={handleMarkDeliveredClick}
            onToast={(message, type) => {
              setToast({ message, type });
              setTimeout(() => setToast(null), 3000);
            }}
          />
        )}

        {activeView === 'order-detail' && selectedOrder && (
          <OrderDetailView
            order={selectedOrder}
            mobileUser={mobileUser}
            messages={messages}
            refreshingMessages={loadingMessages}
            onRefreshMessages={refreshMessages}
            onSendMessage={sendMessage}
            onUpdateStatus={handleUpdateOrderStatus}
            onMarkDeliveredClick={handleMarkDeliveredClick}
            onToast={(message, type) => {
              setToast({ message, type });
              setTimeout(() => setToast(null), 3000);
            }}
          />
        )}

        {activeView === 'profile' && mobileUser && (
          <ProfileView
            mobileUser={mobileUser}
            uploading={uploading}
            onImageSelect={handleImageSelect}
            onUserUpdate={setMobileUser}
            onRatingsClick={() => setActiveView('ratings-list')}
            onToast={(message, type) => {
              setToast({ message, type });
              setTimeout(() => setToast(null), 3000);
            }}
          />
        )}

        {activeView === 'ratings-list' && (
          <RatingsListView
            mobileUser={mobileUser}
            onBack={() => setActiveView('profile')}
          />
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
          height: 'calc(100vh - 64px - 48px)',
          overflow: 'hidden',
          boxSizing: 'border-box',
          gap: 3,
          mt: -3,
          mx: -3,
          mb: -3,
        }}
      >
        <Box
          sx={{
            width: 410,
            maxWidth: 410,
            height: 'calc(100vh - 64px - 48px - 24px)',
            maxHeight: 'calc(100vh - 64px - 48px - 24px)',
            bgcolor: '#000',
            borderRadius: 4,
            p: 2,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'auto',
            boxSizing: 'border-box',
            mt: 3,
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
            id="mobile-content-container"
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
        <Box
          sx={{
            width: 350,
            maxHeight: 'calc(100vh - 64px - 48px)',
            overflow: 'auto',
            p: 2,
            mt: 3,
          }}
        >
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                API Calls
              </Typography>
              {(() => {
                let endpoint = '';
                let method = 'GET';
                if (!mobileUser) {
                  if (showRegister) {
                    endpoint = '/register';
                    method = 'POST';
                  } else {
                    endpoint = '/login';
                    method = 'POST';
                  }
                } else if (activeView === 'profile') {
                  endpoint = '/me';
                } else if (activeView === 'ratings-list') {
                  endpoint = '/me/ratings';
                } else if (activeView === 'stores') {
                  endpoint = '/stores';
                } else if (activeView === 'my-products') {
                  endpoint = '/products';
                } else if (activeView === 'orders') {
                  endpoint = '/orders';
                }
                
                if (!endpoint) {
                  return (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No API call for this view
                    </Typography>
                  );
                }
                
                return (
                  <Box
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      p: 1.5,
                      bgcolor: '#e8f5e9',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 'bold',
                          color: '#2e7d32',
                        }}
                      >
                        {method} {endpoint}
                      </Typography>
                    </Box>
                  </Box>
                );
              })()}
            </Paper>
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

