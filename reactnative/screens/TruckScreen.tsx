import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import {
  Text,
  Surface,
  Button,
  Card,
  ActivityIndicator,
  Divider,
  IconButton,
  TextInput,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { orderService, Order } from '../lib/orders';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function TruckScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const supplierId = (route.params as any)?.supplierId as number | undefined;
  const { user } = useAuth();

  const [draftOrder, setDraftOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);

  const loadDraftOrder = async () => {
    try {
      const order = await orderService.getDraftOrder(supplierId);
      setDraftOrder(order);
    } catch (error) {
      console.error('Failed to load draft order:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDraftOrder();
  }, [supplierId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDraftOrder();
  };

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) {
      Alert.alert('Error', 'Quantity must be at least 1');
      return;
    }

    setUpdating(itemId);
    try {
      const updatedOrder = await orderService.updateOrderItem(itemId, quantity);
      setDraftOrder(updatedOrder);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderService.removeOrderItem(itemId);
              await loadDraftOrder();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to remove item');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!draftOrder || !draftOrder.order_items || draftOrder.order_items.length === 0) {
    return (
      <View style={styles.container}>
        <Surface style={styles.header} elevation={2}>
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
            />
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Truck
            </Text>
            <View style={{ width: 48 }} />
          </View>
        </Surface>
        <View style={styles.centerContainer}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            Your truck is empty
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Browse Suppliers
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Cart
          </Text>
          <View style={{ width: 48 }} />
        </View>
      </Surface>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Card style={styles.supplierCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.supplierName}>
              {draftOrder.supplier?.name || 'Supplier'}
            </Text>
          </Card.Content>
        </Card>

        {draftOrder.order_items.map((item) => (
          <Card key={item.id} style={styles.itemCard}>
            <Card.Content>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text variant="titleMedium" style={styles.itemName}>
                    {item.product.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.itemPrice}>
                    ₱{item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
                  </Text>
                </View>
                <IconButton
                  icon="delete"
                  size={20}
                  iconColor="#d32f2f"
                  onPress={() => handleRemoveItem(item.id)}
                />
              </View>
              <Divider style={styles.divider} />
              <View style={styles.quantityContainer}>
                <Text variant="bodySmall" style={styles.label}>
                  Quantity:
                </Text>
                <View style={styles.quantityControls}>
                  <IconButton
                    icon="minus"
                    size={20}
                    onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={updating === item.id || item.quantity <= 1}
                  />
                  <Text variant="bodyLarge" style={styles.quantity}>
                    {item.quantity}
                  </Text>
                  <IconButton
                    icon="plus"
                    size={20}
                    onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={updating === item.id}
                  />
                </View>
                <Text variant="titleMedium" style={styles.subtotal}>
                  ₱{item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}

        <Card style={styles.totalCard}>
          <Card.Content>
            <View style={styles.totalRow}>
              <Text variant="titleLarge" style={styles.totalLabel}>
                Total:
              </Text>
              <Text variant="titleLarge" style={styles.totalAmount}>
                ₱{draftOrder.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </Card.Content>
        </Card>
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
    padding: 32,
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
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginTop: 16,
  },
  supplierCard: {
    marginBottom: 16,
  },
  supplierName: {
    fontWeight: 'bold',
  },
  itemCard: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemPrice: {
    opacity: 0.7,
  },
  divider: {
    marginVertical: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    opacity: 0.7,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  quantity: {
    marginHorizontal: 16,
    minWidth: 40,
    textAlign: 'center',
  },
  subtotal: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  totalCard: {
    marginTop: 8,
    marginBottom: 32,
    backgroundColor: '#e3f2fd',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
});

