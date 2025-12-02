import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Surface,
  Card,
  ActivityIndicator,
  Divider,
  IconButton,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { supplierService, Supplier } from '../lib/suppliers';
import { useNavigation } from '@react-navigation/native';

export default function SuppliersScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSuppliers = async () => {
    try {
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSuppliers();
  };

  const handleSupplierPress = (supplier: Supplier) => {
    (navigation as any).navigate('SupplierProducts', { supplier });
  };

  const openDrawer = () => {
    (navigation as any).openDrawer();
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
          <IconButton
            icon="menu"
            size={24}
            onPress={openDrawer}
            style={styles.menuButton}
          />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Suppliers
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
        {suppliers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No suppliers available
              </Text>
            </Card.Content>
          </Card>
        ) : (
          suppliers.map((supplier) => (
            <Card
              key={supplier.id}
              style={styles.supplierCard}
              onPress={() => handleSupplierPress(supplier)}
            >
              <Card.Content>
                <Text variant="titleMedium" style={styles.supplierName}>
                  {supplier.name}
                </Text>
                <Text variant="bodySmall" style={styles.supplierEmail}>
                  {supplier.email}
                </Text>
                <Divider style={styles.divider} />
                <Text variant="bodyMedium" style={styles.description}>
                  {supplier.description}
                </Text>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.label}>
                    Products Available:
                  </Text>
                  <Text variant="bodySmall" style={styles.productCount}>
                    {supplier.product_count}
                  </Text>
                </View>
                {supplier.phone ? (
                  <View style={styles.infoRow}>
                    <Text variant="bodySmall" style={styles.label}>
                      Phone:
                    </Text>
                    <Text variant="bodySmall">{supplier.phone}</Text>
                  </View>
                ) : null}
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
  emptyCard: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  supplierCard: {
    marginBottom: 16,
  },
  supplierName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  supplierEmail: {
    opacity: 0.7,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
  },
  description: {
    marginBottom: 12,
    opacity: 0.8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    opacity: 0.7,
  },
  productCount: {
    fontWeight: '600',
    color: '#1976d2',
  },
});

