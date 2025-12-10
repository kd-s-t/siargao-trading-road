import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Image } from 'react-native';
import {
  Text,
  Surface,
  Button,
  Card,
  ActivityIndicator,
  Divider,
  IconButton,
  TextInput,
  Avatar,
  RadioButton,
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
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash_on_delivery');
  const [deliveryOption, setDeliveryOption] = useState<string>('pickup');
  const [notes, setNotes] = useState<string>('');

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

  const handleSubmitOrder = async () => {
    if (!draftOrder) return;

    const totalQuantity = draftOrder.order_items.reduce((sum, item) => sum + item.quantity, 0);
    const deliveryFee = deliveryOption === 'deliver' ? totalQuantity * 20 : 0;
    const finalTotal = draftOrder.total_amount + deliveryFee;

    Alert.alert(
      'Submit Order',
      `Are you sure you want to submit this order for ₱${finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${deliveryFee > 0 ? ` (includes delivery ₱${deliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              await orderService.submitOrder(draftOrder.id, {
                payment_method: paymentMethod,
                delivery_option: deliveryOption,
                payment_status: paymentMethod === 'gcash' ? 'pending' : undefined,
                notes: notes.trim() || undefined,
                delivery_fee: deliveryFee,
                distance: 0,
              });
              Alert.alert(
                'Success',
                'Order submitted successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation.goBack();
                    },
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to submit order');
            } finally {
              setSubmitting(false);
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
            Truck
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
            <View style={styles.supplierContent}>
              {draftOrder.supplier?.logo_url && draftOrder.supplier.logo_url.trim() !== '' ? (
                <Avatar.Image
                  size={50}
                  source={{ uri: draftOrder.supplier.logo_url }}
                  style={styles.supplierLogo}
                />
              ) : (
                <Avatar.Text
                  size={50}
                  label={draftOrder.supplier?.name?.charAt(0).toUpperCase() || 'S'}
                  style={styles.supplierLogo}
                />
              )}
              <Text variant="titleMedium" style={styles.supplierName}>
                {draftOrder.supplier?.name || 'Supplier'}
              </Text>
            </View>
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

        <Card style={styles.optionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Delivery Method
            </Text>
            <RadioButton.Group
              onValueChange={setDeliveryOption}
              value={deliveryOption}
            >
              <RadioButton.Item label="Pickup" value="pickup" />
              <RadioButton.Item label="Deliver" value="deliver" />
            </RadioButton.Group>
          </Card.Content>
        </Card>

        <Card style={styles.totalCard}>
          <Card.Content>
            <View style={styles.totalRow}>
              <Text variant="titleLarge" style={styles.totalLabel}>
                Subtotal:
              </Text>
              <Text variant="titleLarge" style={styles.totalAmount}>
                ₱{draftOrder.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            {deliveryOption === 'deliver' && (() => {
              const totalQuantity = draftOrder.order_items.reduce((sum, item) => sum + item.quantity, 0);
              const deliveryFee = totalQuantity * 20;
              return (
                <>
                  <View style={[styles.totalRow, { marginTop: 8 }]}>
                    <Text variant="bodyLarge" style={styles.totalLabel}>
                      Delivery Fee:
                    </Text>
                    <Text variant="bodyLarge" style={styles.totalAmount}>
                      ₱{deliveryFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <Divider style={styles.divider} />
                </>
              );
            })()}
            <View style={styles.totalRow}>
              <Text variant="titleLarge" style={styles.totalLabel}>
                Total:
              </Text>
              <Text variant="titleLarge" style={styles.totalAmount}>
                ₱{(() => {
                  const totalQuantity = draftOrder.order_items.reduce((sum, item) => sum + item.quantity, 0);
                  const deliveryFee = deliveryOption === 'deliver' ? totalQuantity * 20 : 0;
                  return (draftOrder.total_amount + deliveryFee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                })()}
              </Text>
            </View>
            {draftOrder.total_amount < 5000 && (
              <Surface style={{ marginTop: 12, padding: 12, backgroundColor: '#fff3cd', borderRadius: 8, borderWidth: 1, borderColor: '#ffc107' }}>
                <Text style={{ color: '#856404', fontSize: 14 }}>
                  Minimum order amount is ₱5,000.00. Add ₱{(5000 - draftOrder.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} more to submit.
                </Text>
              </Surface>
            )}
            <Divider style={styles.divider} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Payment Method
            </Text>
            <RadioButton.Group
              onValueChange={setPaymentMethod}
              value={paymentMethod}
            >
              <RadioButton.Item label="Cash on Delivery" value="cash_on_delivery" />
              <RadioButton.Item label="GCash" value="gcash" />
            </RadioButton.Group>
            <Divider style={styles.divider} />
            <TextInput
              label="Notes (Optional)"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
              mode="outlined"
              style={styles.textInput}
            />
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSubmitOrder}
          loading={submitting}
          disabled={submitting || 
                   draftOrder.total_amount < 5000 || 
                   false}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          Submit Order
        </Button>
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
  supplierContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supplierLogo: {
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  supplierName: {
    fontWeight: 'bold',
    flex: 1,
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
  submitButton: {
    marginTop: 16,
    marginBottom: 32,
    marginHorizontal: 16,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  optionsCard: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  textInput: {
    marginTop: 8,
  },
});

