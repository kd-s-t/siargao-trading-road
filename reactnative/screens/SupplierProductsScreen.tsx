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
  Badge,
  Snackbar,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { supplierService, Supplier } from '../lib/suppliers';
import { productService, Product } from '../lib/products';
import { orderService, Order } from '../lib/orders';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

export default function SupplierProductsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const supplier = (route.params as any)?.supplier as Supplier;
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingToTruck, setAddingToTruck] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [draftOrder, setDraftOrder] = useState<Order | null>(null);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  const loadProducts = async () => {
    try {
      const data = await supplierService.getSupplierProducts(supplier.id);
      setProducts(data);
      setSnackbar({ visible: false, message: '' });
    } catch (error: any) {
      console.error('Failed to load products:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load products';
      setSnackbar({ visible: true, message: errorMessage });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadDraftOrder = async () => {
    try {
      const order = await orderService.getDraftOrder(supplier.id);
      setDraftOrder(order);
    } catch (error) {
      console.error('Failed to load draft order:', error);
    }
  };

  useEffect(() => {
    loadProducts();
    loadDraftOrder();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDraftOrder();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleAddToTruck = async (product: Product) => {
    const quantity = parseInt(quantities[product.id] || '1', 10);

    if (quantity <= 0) {
      Alert.alert('Error', 'Quantity must be greater than 0');
      return;
    }

    if (quantity > product.stock_quantity) {
      Alert.alert(
        'Insufficient Stock',
        `Only ${product.stock_quantity} ${product.unit || 'units'} available in stock`
      );
      return;
    }

    setAddingToTruck(product.id);

    try {
      let draftOrder = await orderService.getDraftOrder(supplier.id);

      if (!draftOrder) {
        draftOrder = await orderService.createDraftOrder(supplier.id);
      }

      const existingItem = draftOrder.order_items?.find(
        (item) => item.product_id === product.id
      );

      if (existingItem) {
        const totalQuantity = existingItem.quantity + quantity;
        if (totalQuantity > product.stock_quantity) {
          const available = product.stock_quantity - existingItem.quantity;
          Alert.alert(
            'Insufficient Stock',
            `You already have ${existingItem.quantity} ${product.unit || 'units'} in truck. Only ${available} ${product.unit || 'units'} more available.`
          );
          setAddingToTruck(null);
          return;
        }
      }

      const updatedOrder = await orderService.addOrderItem(draftOrder.id, product.id, quantity);
      setDraftOrder(updatedOrder);

      await loadProducts();

      setQuantities({ ...quantities, [product.id]: '' });
      Alert.alert('Success', 'Item added to truck');
    } catch (error: any) {
      console.error('Add to truck error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add item to truck';
      Alert.alert('Error', errorMessage);
    } finally {
      setAddingToTruck(null);
    }
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
          <View style={styles.headerLeft}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
            />
            {supplier.logo_url && supplier.logo_url.trim() !== '' ? (
              <Avatar.Image
                size={50}
                source={{ uri: supplier.logo_url }}
                style={styles.logo}
              />
            ) : (
              <Avatar.Text
                size={50}
                label={supplier.name.charAt(0).toUpperCase()}
                style={styles.logo}
              />
            )}
            <Text 
              variant="headlineSmall" 
              style={styles.headerTitle}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {supplier.name}
            </Text>
          </View>
          <View style={styles.truckButtonContainer}>
            <IconButton
              icon="truck"
              mode="contained"
              size={24}
              onPress={() => (navigation as any).navigate('Truck', { supplierId: supplier.id })}
            />
            {draftOrder && draftOrder.order_items && draftOrder.order_items.length > 0 && (
              <Badge style={styles.badge} size={20}>
                {draftOrder.order_items.reduce((sum, item) => sum + item.quantity, 0)}
              </Badge>
            )}
          </View>
        </View>
      </Surface>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {products.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No products available from this supplier
              </Text>
            </Card.Content>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id} style={styles.productCard}>
              <Card.Content>
                <View style={styles.productHeader}>
                  {product.image_url && product.image_url.trim() !== '' ? (
                    <Image
                      source={{ uri: product.image_url }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Text variant="labelSmall" style={styles.placeholderText}>
                        No Image
                      </Text>
                    </View>
                  )}
                  <View style={styles.productInfo}>
                    <Text variant="titleMedium" style={styles.productName}>
                      {product.name}
                    </Text>
                    <Text variant="titleLarge" style={styles.productPrice}>
                      ₱{product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
                {product.description ? (
                  <Text variant="bodySmall" style={styles.productDescription}>
                    {product.description}
                  </Text>
                ) : null}
                <Divider style={styles.divider} />
                <View style={styles.productDetails}>
                  {product.sku ? (
                    <View style={styles.detailRow}>
                      <Text variant="bodySmall" style={styles.label}>
                        SKU:
                      </Text>
                      <Text variant="bodySmall">{product.sku}</Text>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <Text variant="bodySmall" style={styles.label}>
                      Stock:
                    </Text>
                    <Text variant="bodySmall">
                      {product.stock_quantity}{product.unit ? ` ${product.unit}` : ' units'}
                    </Text>
                  </View>
                  {product.category ? (
                    <View style={styles.detailRow}>
                      <Text variant="bodySmall" style={styles.label}>
                        Category:
                      </Text>
                      <Text variant="bodySmall">{product.category}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.addToTruckContainer}>
                  <TextInput
                    label="Quantity"
                    value={quantities[product.id] ?? ''}
                    onChangeText={(text) =>
                      setQuantities({ ...quantities, [product.id]: text })
                    }
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.quantityInput}
                    disabled={addingToTruck === product.id}
                    placeholder="1"
                  />
                  <Button
                    mode="contained"
                    icon="truck"
                    onPress={() => handleAddToTruck(product)}
                    loading={addingToTruck === product.id}
                    disabled={addingToTruck === product.id || product.stock_quantity === 0}
                    style={styles.addButton}
                  >
                    Add to Truck
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbar({ ...snackbar, visible: false }),
        }}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  logo: {
    marginRight: 8,
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  headerTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
    flexShrink: 1,
  },
  truckButtonContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 20,
    height: 20,
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
  productCard: {
    marginBottom: 16,
  },
  productHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    flexShrink: 0,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  placeholderText: {
    color: '#999',
    fontSize: 10,
  },
  productInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    flex: 1,
    fontWeight: 'bold',
  },
  productPrice: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  productDescription: {
    marginBottom: 8,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 12,
  },
  productDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontWeight: '600',
    opacity: 0.7,
  },
  addToTruckContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  quantityInput: {
    flex: 1,
  },
  addButton: {
    minWidth: 120,
  },
});

