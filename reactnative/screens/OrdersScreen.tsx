import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Text,
  Surface,
  Card,
  ActivityIndicator,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Button,
  Snackbar,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { orderService, Order } from '../lib/orders';
import { useNavigation } from '@react-navigation/native';
import api from '../lib/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const statusColors: Record<string, string> = {
  preparing: '#ff9800',
  in_transit: '#2196f3',
  delivered: '#4caf50',
  cancelled: '#f44336',
};

const statusLabels: Record<string, string> = {
  preparing: 'Preparing',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const loadOrders = async () => {
    try {
      setError(null);
      console.log('Loading orders...');
      const data = await orderService.getOrders();
      console.log('Orders loaded:', data?.length || 0, 'orders');
      setOrders(data || []);
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load orders';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const openDrawer = () => {
    (navigation as any).openDrawer();
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || '#757575';
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status] || status;
  };

  const handleDownloadInvoice = async (order: Order) => {
    try {
      const apiUrl = api.defaults.baseURL || 'http://localhost:3020/api';
      const invoiceUrl = `${apiUrl}/orders/${order.id}/invoice`;
      
      const date = new Date(order.created_at);
      const dateStr = date.toISOString().split('T')[0];
      const storeName = order.store?.name || 'Store';
      const sanitizedStoreName = storeName
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
      const fileName = `invoice-${dateStr}-${sanitizedStoreName}-${order.id}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      setSnackbar({ visible: true, message: 'Downloading invoice...', type: 'success' });

      const token = await AsyncStorage.getItem('token');
      const downloadResult = await FileSystem.downloadAsync(invoiceUrl, fileUri, {
        headers: token ? {
          Authorization: `Bearer ${token}`,
        } : {},
      });

      if (downloadResult.status === 200) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save Invoice',
          });
          setSnackbar({ visible: true, message: 'Invoice downloaded successfully', type: 'success' });
        } else {
          setSnackbar({ visible: true, message: 'Sharing is not available on this device', type: 'error' });
        }
      } else {
        setSnackbar({ visible: true, message: 'Failed to download invoice', type: 'error' });
      }
    } catch (error: any) {
      console.error('Failed to download invoice:', error);
      setSnackbar({ visible: true, message: error.message || 'Failed to download invoice', type: 'error' });
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      setUpdatingStatus(orderId);
      await orderService.updateOrderStatus(orderId, status);
      await loadOrders();
      setSnackbar({ visible: true, message: `Order status updated to ${getStatusLabel(status)}`, type: 'success' });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update status';
      setSnackbar({ visible: true, message: errorMessage, type: 'error' });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleMarkDelivered = (orderId: number) => {
    Alert.alert(
      'Mark as Delivered',
      'Are you sure you want to mark this order as delivered?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => handleUpdateStatus(orderId, 'delivered'),
        },
      ]
    );
  };

  const filteredOrders = statusFilter
    ? orders.filter(order => order.status === statusFilter)
    : orders;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <IconButton
            icon="menu"
            size={24}
            onPress={() => (navigation as any).openDrawer()}
            style={styles.menuButton}
          />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Orders
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </Surface>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.filterContainer}>
          <Chip
            selected={statusFilter === null}
            onPress={() => setStatusFilter(null)}
            style={[
              styles.filterChip,
              statusFilter === null && styles.filterChipSelected,
            ]}
            textStyle={statusFilter === null ? styles.filterChipTextSelected : undefined}
          >
            All
          </Chip>
          <Chip
            selected={statusFilter === 'draft'}
            onPress={() => setStatusFilter('draft')}
            style={[
              styles.filterChip,
              statusFilter === 'draft' && styles.filterChipSelected,
            ]}
            textStyle={statusFilter === 'draft' ? styles.filterChipTextSelected : undefined}
          >
            Draft
          </Chip>
          <Chip
            selected={statusFilter === 'preparing'}
            onPress={() => setStatusFilter('preparing')}
            style={[
              styles.filterChip,
              statusFilter === 'preparing' && styles.filterChipSelected,
            ]}
            textStyle={statusFilter === 'preparing' ? styles.filterChipTextSelected : undefined}
          >
            Preparing
          </Chip>
          <Chip
            selected={statusFilter === 'in_transit'}
            onPress={() => setStatusFilter('in_transit')}
            style={[
              styles.filterChip,
              statusFilter === 'in_transit' && styles.filterChipSelected,
            ]}
            textStyle={statusFilter === 'in_transit' ? styles.filterChipTextSelected : undefined}
          >
            In Transit
          </Chip>
          <Chip
            selected={statusFilter === 'delivered'}
            onPress={() => setStatusFilter('delivered')}
            style={[
              styles.filterChip,
              statusFilter === 'delivered' && styles.filterChipSelected,
            ]}
            textStyle={statusFilter === 'delivered' ? styles.filterChipTextSelected : undefined}
          >
            Delivered
          </Chip>
          <Chip
            selected={statusFilter === 'cancelled'}
            onPress={() => setStatusFilter('cancelled')}
            style={[
              styles.filterChip,
              statusFilter === 'cancelled' && styles.filterChipSelected,
            ]}
            textStyle={statusFilter === 'cancelled' ? styles.filterChipTextSelected : undefined}
          >
            Cancelled
          </Chip>
        </View>

        {error ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.errorText}>
                Error loading orders
              </Text>
              <Text variant="bodySmall" style={styles.errorSubtext}>
                {error}
              </Text>
              <Button
                mode="contained"
                onPress={loadOrders}
                style={styles.retryButton}
              >
                Retry
              </Button>
            </Card.Content>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No orders{statusFilter ? ` with status "${getStatusLabel(statusFilter)}"` : ''}
              </Text>
              <Text variant="bodySmall" style={styles.emptySubtext}>
                {statusFilter ? 'Try selecting a different filter' : 'Your orders will appear here once you place them'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const isStore = user?.role === 'store';
            const entity = isStore ? order.supplier : order.store;
            const entityName = isStore ? 'Supplier' : 'Store';
            
            if (!entity) return null;

            return (
            <TouchableOpacity
              key={order.id}
              onPress={() => {
                if ((navigation as any).navigate) {
                  (navigation as any).navigate('OrderDetail', { order });
                }
              }}
              activeOpacity={0.7}
            >
            <Card style={styles.orderCard}>
              {entity.banner_url && entity.banner_url.trim() !== '' ? (
                <Image
                  source={{ uri: entity.banner_url }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              ) : null}
              <Card.Content>
                <View style={styles.orderHeader}>
                  <View style={styles.storeInfo}>
                    {entity.logo_url && entity.logo_url.trim() !== '' ? (
                      <Avatar.Image
                        size={50}
                        source={{ uri: entity.logo_url }}
                        style={styles.storeLogo}
                      />
                    ) : (
                      <Avatar.Text
                        size={50}
                        label={entity.name.charAt(0).toUpperCase()}
                        style={styles.storeLogo}
                      />
                    )}
                    <View>
                      <Text variant="titleMedium" style={styles.orderTitle}>
                        Order #{order.id}
                      </Text>
                      <Text variant="bodySmall" style={styles.storeName}>
                        {entity.name}
                      </Text>
                    </View>
                  </View>
                  <Chip
                    style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(order.status) + '20' },
                    ]}
                    textStyle={{ color: getStatusColor(order.status) }}
                  >
                    {getStatusLabel(order.status)}
                  </Chip>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.orderInfo}>
                  <View style={styles.infoRow}>
                    <Text variant="bodySmall" style={styles.label}>
                      Total Amount:
                    </Text>
                    <Text variant="titleMedium" style={styles.totalAmount}>
                      ₱{order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text variant="bodySmall" style={styles.label}>
                      Items:
                    </Text>
                    <Text variant="bodySmall">
                      {order.order_items.length} item(s)
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text variant="bodySmall" style={styles.label}>
                      Date:
                    </Text>
                    <Text variant="bodySmall">
                      {new Date(order.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {order.shipping_address ? (
                  <>
                    <Divider style={styles.divider} />
                    <View style={styles.addressContainer}>
                      <Text variant="bodySmall" style={styles.label}>
                        Shipping Address:
                      </Text>
                      <Text variant="bodySmall">{order.shipping_address}</Text>
                    </View>
                  </>
                ) : null}

                {order.notes ? (
                  <>
                    <Divider style={styles.divider} />
                    <View style={styles.notesContainer}>
                      <Text variant="bodySmall" style={styles.label}>
                        Notes:
                      </Text>
                      <Text variant="bodySmall">{order.notes}</Text>
                    </View>
                  </>
                ) : null}

                {order.ratings && order.ratings.length > 0 && (
                  <>
                    <Divider style={styles.divider} />
                    <View style={styles.ratingsContainer}>
                      <Text variant="bodySmall" style={styles.label}>
                        Ratings:
                      </Text>
                      {order.ratings.map((rating: any) => (
                        <View key={rating.id} style={styles.ratingItem}>
                          <View style={styles.ratingRow}>
                            <Text variant="bodySmall" style={styles.ratingRater}>
                              {rating.rater?.name || 'Unknown'}
                            </Text>
                            <View style={styles.ratingStars}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <MaterialCommunityIcons
                                  key={star}
                                  name={star <= rating.rating ? 'star' : 'star-outline'}
                                  size={14}
                                  color="#FFD700"
                                />
                              ))}
                            </View>
                          </View>
                          {rating.comment && (
                            <Text variant="bodySmall" style={styles.ratingComment}>
                              &quot;{rating.comment}&quot;
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </>
                )}

                <Divider style={styles.divider} />

                <View style={styles.itemsContainer}>
                  <Text variant="bodySmall" style={styles.label}>
                    Order Items:
                  </Text>
                  {order.order_items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      {item.product.image_url && item.product.image_url.trim() !== '' ? (
                        <Image
                          source={{ uri: item.product.image_url }}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.itemImagePlaceholder}>
                          <Text variant="labelSmall" style={styles.itemPlaceholderText}>
                            No Image
                          </Text>
                        </View>
                      )}
                      <View style={styles.itemInfo}>
                        <Text variant="bodySmall" style={styles.itemName}>
                          {item.product.name}
                        </Text>
                        <Text variant="bodySmall" style={styles.itemDetails}>
                          {item.quantity} x ₱{item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ₱
                          {item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                <Divider style={styles.divider} />

                <View style={styles.actionsContainer}>
                  <Button
                    mode="outlined"
                    icon="download"
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDownloadInvoice(order);
                    }}
                    style={styles.actionButton}
                  >
                    Download Invoice
                  </Button>

                  {user?.role === 'supplier' && order.status === 'preparing' && (
                    <View style={styles.statusButtons}>
                      <Button
                        mode="outlined"
                        onPress={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(order.id, 'in_transit');
                        }}
                        style={styles.statusButton}
                        disabled={updatingStatus === order.id}
                      >
                        Mark In Transit
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={(e) => {
                          e.stopPropagation();
                          handleMarkDelivered(order.id);
                        }}
                        style={styles.statusButton}
                        disabled={updatingStatus === order.id}
                      >
                        Mark Delivered
                      </Button>
                    </View>
                  )}

                  {user?.role === 'supplier' && order.status === 'in_transit' && (
                    <Button
                      mode="outlined"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleMarkDelivered(order.id);
                      }}
                      style={styles.actionButton}
                      disabled={updatingStatus === order.id}
                    >
                      Mark Delivered
                    </Button>
                  )}

                  {user?.role === 'supplier' && order.status === 'delivered' && (
                    <Button
                      mode="outlined"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(order.id, 'in_transit');
                      }}
                      style={styles.actionButton}
                      disabled={updatingStatus === order.id}
                    >
                      Revert to In Transit
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
            </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={snackbar.type === 'error' ? styles.snackbarError : styles.snackbarSuccess}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    margin: 0,
  },
  headerSpacer: {
    width: 48,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  filterChipSelected: {
    backgroundColor: '#1976d2',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 8,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#d32f2f',
  },
  errorSubtext: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 8,
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  orderCard: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#e0e0e0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storeLogo: {
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  orderTitle: {
    fontWeight: 'bold',
  },
  storeName: {
    opacity: 0.7,
    marginTop: 4,
  },
  statusChip: {
    height: 28,
  },
  divider: {
    marginVertical: 12,
  },
  orderInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    opacity: 0.7,
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  addressContainer: {
    marginTop: 4,
  },
  notesContainer: {
    marginTop: 4,
  },
  itemsContainer: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    paddingLeft: 8,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 4,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    flexShrink: 0,
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  itemPlaceholderText: {
    color: '#999',
    fontSize: 9,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontWeight: '600',
  },
  itemDetails: {
    opacity: 0.7,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    marginTop: 4,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  statusButton: {
    flex: 1,
  },
  snackbarSuccess: {
    backgroundColor: '#4caf50',
  },
  snackbarError: {
    backgroundColor: '#f44336',
  },
  ratingsContainer: {
    marginTop: 4,
    gap: 8,
  },
  ratingItem: {
    marginTop: 4,
    paddingLeft: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ratingRater: {
    fontWeight: '600',
    flex: 1,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingComment: {
    marginTop: 4,
    fontStyle: 'italic',
    opacity: 0.8,
  },
});

