import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import {
  Text,
  Divider,
  TouchableRipple,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MenuItem {
  label: string;
  icon: string;
  screen: string;
}

interface NavigationDrawerProps {
  menuItems: MenuItem[];
  userName?: string;
  userEmail?: string;
  userRole?: string;
  logoUrl?: string;
}

const NavigationDrawer = ({
  menuItems,
  userName = 'User',
  userEmail = 'user@example.com',
  userRole = 'admin',
  logoUrl,
}: NavigationDrawerProps) => (
  <View style={styles.container}>
    <View style={styles.header}>
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text variant="headlineMedium" style={styles.avatarText}>
            {userName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text variant="titleLarge" style={styles.name} numberOfLines={1}>
        {userName}
      </Text>
      <Text variant="bodySmall" style={styles.email} numberOfLines={1}>
        {userEmail}
      </Text>
      <Text variant="bodySmall" style={styles.role}>
        {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
      </Text>
    </View>

    <Divider />

    <ScrollView style={styles.menu}>
      {menuItems.map((item, index) => (
        <TouchableRipple
          key={index}
          onPress={() => {}}
          style={styles.menuItem}
        >
          <View style={styles.menuItemContent}>
            <MaterialCommunityIcons
              name={item.icon as any}
              size={24}
              color="#1976d2"
              style={styles.menuIcon}
            />
            <Text variant="bodyLarge" style={styles.menuLabel}>
              {item.label}
            </Text>
          </View>
        </TouchableRipple>
      ))}
    </ScrollView>

    <Divider />

    <TouchableRipple onPress={() => {}} style={styles.logoutItem}>
      <View style={styles.menuItemContent}>
        <MaterialCommunityIcons
          name="logout"
          size={24}
          color="#d32f2f"
          style={styles.menuIcon}
        />
        <Text variant="bodyLarge" style={styles.logoutLabel}>
          Logout
        </Text>
      </View>
    </TouchableRipple>
  </View>
);

const getAdminMenuItems = (): MenuItem[] => [
  { label: 'Dashboard', icon: 'view-dashboard', screen: 'Dashboard' },
  { label: 'Profile', icon: 'account', screen: 'Profile' },
];

const getStoreMenuItems = (): MenuItem[] => [
  { label: 'Suppliers', icon: 'store', screen: 'Suppliers' },
  { label: 'Profile', icon: 'account', screen: 'Profile' },
];

const getSupplierMenuItems = (): MenuItem[] => [
  { label: 'Products', icon: 'package-variant', screen: 'SupplierMain' },
  { label: 'Orders', icon: 'cart', screen: 'SupplierMain' },
  { label: 'Profile', icon: 'account', screen: 'Profile' },
];

const meta: Meta<typeof NavigationDrawer> = {
  title: 'Components/Navigation',
  component: NavigationDrawer,
};

export default meta;
type Story = StoryObj<typeof NavigationDrawer>;

export const AdminNavigation: Story = {
  render: () => (
    <View style={styles.wrapper}>
      <NavigationDrawer
        menuItems={getAdminMenuItems()}
        userName="Admin User"
        userEmail="admin@example.com"
        userRole="admin"
      />
    </View>
  ),
};

export const StoreNavigation: Story = {
  render: () => (
    <View style={styles.wrapper}>
      <NavigationDrawer
        menuItems={getStoreMenuItems()}
        userName="Store User"
        userEmail="store@example.com"
        userRole="store"
      />
    </View>
  ),
};

export const SupplierNavigation: Story = {
  render: () => (
    <View style={styles.wrapper}>
      <NavigationDrawer
        menuItems={getSupplierMenuItems()}
        userName="Supplier User"
        userEmail="supplier@example.com"
        userRole="supplier"
      />
    </View>
  ),
};

const styles = StyleSheet.create({
  wrapper: {
    width: 300,
    height: 600,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    opacity: 0.7,
    marginBottom: 4,
  },
  role: {
    opacity: 0.6,
    textTransform: 'capitalize',
  },
  menu: {
    flex: 1,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
  },
  logoutItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  logoutLabel: {
    flex: 1,
    color: '#d32f2f',
  },
});

