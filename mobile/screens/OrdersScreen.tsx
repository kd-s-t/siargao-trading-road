import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Surface,
  Button,
  Card,
  ActivityIndicator,
  Divider,
  Chip,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { orderService, Order } from '../lib/orders';
import { useNavigation } from '@react-navigation/native';

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
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
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

  const handleLogout = async () => {
    await logout();
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || '#757575';
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status] || status;
  };

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
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Orders
          </Text>
          <Button mode="text" onPress={handleLogout}>
            Logout
          </Button>
        </View>
      </Surface>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {orders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No orders yet
              </Text>
            </Card.Content>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} style={styles.orderCard}>
              <Card.Content>
                <View style={styles.orderHeader}>
                  <View>
                    <Text variant="titleMedium" style={styles.orderTitle}>
                      Order #{order.id}
                    </Text>
                    <Text variant="bodySmall" style={styles.storeName}>
                      {order.store.name}
                    </Text>
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
                      ₱{order.total_amount.toFixed(2)}
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

                <Divider style={styles.divider} />

                <View style={styles.itemsContainer}>
                  <Text variant="bodySmall" style={styles.label}>
                    Order Items:
                  </Text>
                  {order.order_items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text variant="bodySmall" style={styles.itemName}>
                          {item.product.name}
                        </Text>
                        <Text variant="bodySmall" style={styles.itemDetails}>
                          {item.quantity} x ₱{item.unit_price.toFixed(2)} = ₱
                          {item.subtotal.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  orderCard: {
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
    marginTop: 8,
    paddingLeft: 8,
  },
  itemInfo: {
    gap: 4,
  },
  itemName: {
    fontWeight: '600',
  },
  itemDetails: {
    opacity: 0.7,
  },
});

