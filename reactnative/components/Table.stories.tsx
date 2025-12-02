import type { Meta, StoryObj } from '@storybook/react-native';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Surface, Chip } from 'react-native-paper';

interface ProductCardProps {
  name: string;
  sku: string;
  supplier: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
}

const ProductCard = ({ name, sku, supplier, category, price, stock, unit }: ProductCardProps) => (
  <Card style={styles.card}>
    <Card.Content>
      <View style={styles.row}>
        <Text variant="titleMedium" style={styles.label}>
          Name:
        </Text>
        <Text variant="bodyMedium" style={styles.value}>
          {name}
        </Text>
      </View>
      <View style={styles.row}>
        <Text variant="titleMedium" style={styles.label}>
          SKU:
        </Text>
        <Text variant="bodyMedium" style={styles.value}>
          {sku}
        </Text>
      </View>
      <View style={styles.row}>
        <Text variant="titleMedium" style={styles.label}>
          Supplier:
        </Text>
        <Text variant="bodyMedium" style={styles.value}>
          {supplier}
        </Text>
      </View>
      <View style={styles.row}>
        <Text variant="titleMedium" style={styles.label}>
          Category:
        </Text>
        <Text variant="bodyMedium" style={styles.value}>
          {category}
        </Text>
      </View>
      <View style={styles.row}>
        <Text variant="titleMedium" style={styles.label}>
          Price:
        </Text>
        <Text variant="bodyMedium" style={styles.value}>
          ₱{price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
      <View style={styles.row}>
        <Text variant="titleMedium" style={styles.label}>
          Stock:
        </Text>
        <Chip
          style={[styles.chip, stock > 0 ? styles.chipSuccess : styles.chipError]}
          textStyle={styles.chipText}
        >
          {stock} {unit}
        </Chip>
      </View>
    </Card.Content>
  </Card>
);

const meta: Meta<typeof ProductCard> = {
  title: 'Components/Table',
  component: ProductCard,
};

export default meta;
type Story = StoryObj<typeof ProductCard>;

export const ProductsList: Story = {
  render: () => {
    const products = [
      { id: 1, name: 'Product A', sku: 'SKU001', supplier: 'Supplier 1', category: 'Category 1', price: 100.00, stock: 50, unit: 'pcs' },
      { id: 2, name: 'Product B', sku: 'SKU002', supplier: 'Supplier 2', category: 'Category 2', price: 200.00, stock: 30, unit: 'pcs' },
      { id: 3, name: 'Product C', sku: 'SKU003', supplier: 'Supplier 1', category: 'Category 1', price: 150.00, stock: 0, unit: 'pcs' },
      { id: 4, name: 'Product D', sku: 'SKU004', supplier: 'Supplier 3', category: 'Category 3', price: 300.00, stock: 100, unit: 'kg' },
    ];

    return (
      <ScrollView style={styles.container}>
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </ScrollView>
    );
  },
};

export const OrdersList: Story = {
  render: () => {
    const orders = [
      { id: 1, store: 'Store A', supplier: 'Supplier 1', status: 'delivered', items: 5, amount: 5000.00, date: '2024-01-15' },
      { id: 2, store: 'Store B', supplier: 'Supplier 2', status: 'in_transit', items: 3, amount: 3000.00, date: '2024-01-16' },
      { id: 3, store: 'Store C', supplier: 'Supplier 1', status: 'preparing', items: 8, amount: 7500.00, date: '2024-01-17' },
    ];

    return (
      <ScrollView style={styles.container}>
        {orders.map((order) => (
          <Card key={order.id} style={styles.card}>
            <Card.Content>
              <View style={styles.row}>
                <Text variant="titleMedium" style={styles.label}>
                  ID:
                </Text>
                <Text variant="bodyMedium" style={styles.value}>
                  #{order.id}
                </Text>
              </View>
              <View style={styles.row}>
                <Text variant="titleMedium" style={styles.label}>
                  Store:
                </Text>
                <Text variant="bodyMedium" style={styles.value}>
                  {order.store}
                </Text>
              </View>
              <View style={styles.row}>
                <Text variant="titleMedium" style={styles.label}>
                  Supplier:
                </Text>
                <Text variant="bodyMedium" style={styles.value}>
                  {order.supplier}
                </Text>
              </View>
              <View style={styles.row}>
                <Text variant="titleMedium" style={styles.label}>
                  Status:
                </Text>
                <Chip
                  style={[
                    styles.chip,
                    order.status === 'delivered' ? styles.chipSuccess :
                    order.status === 'in_transit' ? styles.chipInfo :
                    order.status === 'preparing' ? styles.chipWarning :
                    styles.chipError
                  ]}
                  textStyle={styles.chipText}
                >
                  {order.status.replace('_', ' ')}
                </Chip>
              </View>
              <View style={styles.row}>
                <Text variant="titleMedium" style={styles.label}>
                  Amount:
                </Text>
                <Text variant="bodyMedium" style={styles.value}>
                  ₱{order.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.row}>
                <Text variant="titleMedium" style={styles.label}>
                  Items:
                </Text>
                <Text variant="bodyMedium" style={styles.value}>
                  {order.items}
                </Text>
              </View>
              <View style={styles.row}>
                <Text variant="titleMedium" style={styles.label}>
                  Date:
                </Text>
                <Text variant="bodyMedium" style={styles.value}>
                  {order.date}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    );
  },
};

export const EmptyState: Story = {
  render: () => (
    <View style={styles.container}>
      <Card style={styles.emptyCard}>
        <Card.Content>
          <Text variant="bodyLarge" style={styles.emptyText}>
            No products found
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Tap the + button to add your first product
          </Text>
        </Card.Content>
      </Card>
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  label: {
    fontWeight: '600',
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
  chip: {
    alignSelf: 'flex-end',
  },
  chipSuccess: {
    backgroundColor: '#4caf50',
  },
  chipError: {
    backgroundColor: '#f44336',
  },
  chipInfo: {
    backgroundColor: '#2196f3',
  },
  chipWarning: {
    backgroundColor: '#ff9800',
  },
  chipText: {
    color: '#ffffff',
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.7,
  },
});

