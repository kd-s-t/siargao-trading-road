import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Surface,
  Card,
} from 'react-native-paper';
import { productService, Product, CreateProductRequest } from '../lib/products';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function EditProductScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const product = (route.params as any)?.product as Product;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    price: product?.price || 0,
    stock_quantity: product?.stock_quantity || 0,
    unit: product?.unit || '',
    category: product?.category || '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        sku: product.sku,
        price: product.price,
        stock_quantity: product.stock_quantity,
        unit: product.unit || '',
        category: product.category || '',
      });
    }
  }, [product]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.sku || !formData.price) {
      setError('Please fill in required fields (name, SKU, price)');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await productService.updateProduct(product.id, formData);
      navigation.goBack();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Edit Product
          </Text>
          <Button mode="text" onPress={() => navigation.goBack()}>
            Cancel
          </Button>
        </View>
      </Surface>

      <ScrollView style={styles.content}>
        {error ? (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
            </Card.Content>
          </Card>
        ) : null}

        <TextInput
          label="Product Name *"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="SKU *"
          value={formData.sku}
          onChangeText={(text) => setFormData({ ...formData, sku: text })}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Price *"
          value={formData.price.toString()}
          onChangeText={(text) => {
            const num = parseFloat(text) || 0;
            setFormData({ ...formData, price: num });
          }}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.input}
        />

        <TextInput
          label="Stock Quantity *"
          value={formData.stock_quantity?.toString() || '0'}
          onChangeText={(text) => {
            const num = parseInt(text) || 0;
            setFormData({ ...formData, stock_quantity: num });
          }}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInput
          label="Unit (kg, piece, box, etc.)"
          value={formData.unit}
          onChangeText={(text) => setFormData({ ...formData, unit: text })}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Category"
          value={formData.category}
          onChangeText={(text) => setFormData({ ...formData, category: text })}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Description"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={loading}
          disabled={loading}
        >
          Update Product
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  errorCard: {
    marginBottom: 16,
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 32,
    paddingVertical: 4,
  },
});

