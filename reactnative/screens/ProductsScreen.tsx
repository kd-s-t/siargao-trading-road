import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import {
  Text,
  Surface,
  Button,
  Card,
  FAB,
  ActivityIndicator,
  Divider,
  IconButton,
  Switch,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { productService, Product } from '../lib/products';
import { useNavigation } from '@react-navigation/native';

export default function ProductsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  const loadProducts = async () => {
    try {
      const data = await productService.getProducts(showDeleted);
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
  }, [showDeleted]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const openDrawer = () => {
    (navigation as any).openDrawer();
  };

  const handleEdit = (product: Product) => {
    (navigation as any).navigate('EditProduct', { product });
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await productService.deleteProduct(product.id);
              loadProducts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleRestore = (product: Product) => {
    Alert.alert(
      'Restore Product',
      `Are you sure you want to restore "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await productService.restoreProduct(product.id);
              loadProducts();
            } catch (error) {
              Alert.alert('Error', 'Failed to restore product');
            }
          },
        },
      ]
    );
  };

  const activeProducts = products.filter(p => !p.deleted_at);
  const deletedProducts = products.filter(p => p.deleted_at);
  const displayProducts = showDeleted ? products : activeProducts;

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
            onPress={openDrawer}
            style={styles.menuButton}
          />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            My Products
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.filterContainer}>
          <Text variant="bodyMedium">Show deleted items</Text>
          <Switch value={showDeleted} onValueChange={setShowDeleted} />
        </View>
      </Surface>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {displayProducts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                {showDeleted ? 'No deleted products' : 'No products yet'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                {showDeleted
                  ? 'Turn off the filter to see active products'
                  : 'Tap the + button to add your first product'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          displayProducts.map((product) => {
            const isDeleted = !!product.deleted_at;
            return (
              <Card
                key={product.id}
                style={[
                  styles.productCard,
                  isDeleted && styles.deletedCard,
                ]}
              >
                <Card.Content>
                  <View style={styles.productHeader}>
                    <View style={styles.productTitleContainer}>
                      <View style={styles.titleWithBadge}>
                        <Text
                          variant="titleMedium"
                          style={[
                            styles.productName,
                            isDeleted && styles.deletedText,
                          ]}
                        >
                          {product.name}
                        </Text>
                        {isDeleted && (
                          <Surface style={styles.deletedBadge} elevation={0}>
                            <Text variant="labelSmall" style={styles.deletedBadgeText}>
                              Deleted
                            </Text>
                          </Surface>
                        )}
                      </View>
                      <View style={styles.actionButtons}>
                        {isDeleted ? (
                          <IconButton
                            icon="restore"
                            size={20}
                            iconColor="#388e3c"
                            onPress={() => handleRestore(product)}
                          />
                        ) : (
                          <>
                            <IconButton
                              icon="pencil"
                              size={20}
                              onPress={() => handleEdit(product)}
                            />
                            <IconButton
                              icon="delete"
                              size={20}
                              iconColor="#d32f2f"
                              onPress={() => handleDelete(product)}
                            />
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                  <View style={styles.priceStockContainer}>
                    <View style={styles.priceStockItem}>
                      <Text variant="bodySmall" style={styles.priceStockLabel}>
                        Price
                      </Text>
                      <Text
                        variant="titleLarge"
                        style={[
                          styles.productPrice,
                          isDeleted && styles.deletedText,
                        ]}
                      >
                        ₱{product.price.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.priceStockItem}>
                      <Text variant="bodySmall" style={styles.priceStockLabel}>
                        Stock
                      </Text>
                      <Text
                        variant="titleLarge"
                        style={[
                          styles.productStock,
                          isDeleted && styles.deletedText,
                        ]}
                      >
                        {product.stock_quantity} {product.unit || 'units'}
                      </Text>
                    </View>
                  </View>
                  {product.description ? (
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.productDescription,
                        isDeleted && styles.deletedText,
                      ]}
                    >
                      {product.description}
                    </Text>
                  ) : null}
                  <Divider style={styles.divider} />
                  <View style={styles.productInfo}>
                    <View style={styles.infoRow}>
                      <Text variant="bodySmall" style={styles.label}>
                        SKU:
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={isDeleted && styles.deletedText}
                      >
                        {product.sku}
                      </Text>
                    </View>
                    {product.category ? (
                      <View style={styles.infoRow}>
                        <Text variant="bodySmall" style={styles.label}>
                          Category:
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={isDeleted && styles.deletedText}
                        >
                          {product.category}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => (navigation as any).navigate('AddProduct')}
      />
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
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.7,
  },
  productCard: {
    marginBottom: 16,
  },
  deletedCard: {
    opacity: 0.6,
    backgroundColor: '#fafafa',
  },
  productHeader: {
    marginBottom: 12,
  },
  productTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productName: {
    flex: 1,
    fontWeight: 'bold',
  },
  deletedBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deletedBadgeText: {
    color: '#c62828',
    fontWeight: 'bold',
  },
  deletedText: {
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  priceStockContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  priceStockItem: {
    flex: 1,
  },
  priceStockLabel: {
    opacity: 0.7,
    marginBottom: 4,
  },
  productPrice: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  productStock: {
    fontWeight: 'bold',
    color: '#388e3c',
  },
  productDescription: {
    marginBottom: 8,
    opacity: 0.7,
  },
  divider: {
    marginVertical: 12,
  },
  productInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontWeight: '600',
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

