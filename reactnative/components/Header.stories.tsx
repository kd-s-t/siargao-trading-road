import type { Meta, StoryObj } from '@storybook/react-native';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, Button } from 'react-native-paper';

interface HeaderProps {
  title: string;
  showLogout?: boolean;
  backgroundColor?: string;
}

const Header = ({ title, showLogout = false, backgroundColor = '#1976d2' }: HeaderProps) => (
  <Surface style={[styles.header, { backgroundColor }]} elevation={2}>
    <View style={styles.headerContent}>
      <Text variant="headlineSmall" style={styles.headerTitle}>
        {title}
      </Text>
      {showLogout && (
        <Button mode="text" textColor="#ffffff" onPress={() => {}}>
          Logout
        </Button>
      )}
    </View>
  </Surface>
);

const meta: Meta<typeof Header> = {
  title: 'Components/Header',
  component: Header,
};

export default meta;
type Story = StoryObj<typeof Header>;

export const AdminHeader: Story = {
  render: () => (
    <View style={styles.container}>
      <Header title="Wholesale Admin" showLogout backgroundColor="#38b2ac" />
    </View>
  ),
};

export const StoreHeader: Story = {
  render: () => (
    <View style={styles.container}>
      <Header title="Wholesale Store" showLogout backgroundColor="#10b981" />
    </View>
  ),
};

export const SupplierHeader: Story = {
  render: () => (
    <View style={styles.container}>
      <Header title="Wholesale Supplier" showLogout backgroundColor="#3b82f6" />
    </View>
  ),
};

export const ProductsHeader: Story = {
  render: () => (
    <View style={styles.container}>
      <Header title="My Products" backgroundColor="#1976d2" />
    </View>
  ),
};

export const MinimalHeader: Story = {
  render: () => (
    <View style={styles.container}>
      <Header title="Wholesale" />
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

