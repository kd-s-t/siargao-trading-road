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
import { supplierService, Supplier } from '../lib/suppliers';
import { productService, Product } from '../lib/products';
import { orderService } from '../lib/orders';
import { useNavigation, useRoute } from '@react-navigation/native';

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

  const loadProducts = async () => {
    try {
      const data = await supplierService.getSupplierProducts(supplier.id);
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleAddToTruck = async (product: Product) => {
    setAddingToTruck(product.id);

    try {
      let draftOrder = await orderService.getDraftOrder(supplier.id);

      if (!draftOrder) {
        draftOrder = await orderService.createDraftOrder(supplier.id);
      }

      const quantity = parseInt(quantities[product.id] || '1', 10);
      await orderService.addOrderItem(draftOrder.id, product.id, quantity);

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
            <Text variant="headlineSmall" style={styles.headerTitle}>
              {supplier.name}
            </Text>
          </View>
          <Button
            mode="contained"
            icon="truck"
            onPress={() => (navigation as any).navigate('Truck', { supplierId: supplier.id })}
          >
            Truck
          </Button>
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
                  <View style={styles.productInfo}>
                    <Text variant="titleMedium" style={styles.productName}>
                      {product.name}
                    </Text>
                    <Text variant="titleLarge" style={styles.productPrice}>
                      ₱{product.price.toFixed(2)}
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
                  <View style={styles.detailRow}>
                    <Text variant="bodySmall" style={styles.label}>
                      Stock:
                    </Text>
                    <Text variant="bodySmall">
                      {product.stock_quantity} {product.unit || 'units'}
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
                    value={quantities[product.id] || '1'}
                    onChangeText={(text) =>
                      setQuantities({ ...quantities, [product.id]: text })
                    }
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.quantityInput}
                    disabled={addingToTruck === product.id}
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
  },
  headerTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
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
    marginBottom: 8,
  },
  productInfo: {
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

