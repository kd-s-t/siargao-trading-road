import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import {
  Text,
  Divider,
  TouchableRipple,
  Badge,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { orderService, Order } from '../lib/orders';

export default function DrawerContent(props: DrawerContentComponentProps) {
  const { user, logout } = useAuth();
  const { navigation } = props;
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user && (user.role === 'supplier' || user.role === 'store')) {
      loadOrders();
    }
  }, [user?.id]);

  const loadOrders = async () => {
    try {
      const data = await orderService.getOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to load orders for badge:', error);
    }
  };

  const nonDeliveredCount = orders.filter(order => order.status !== 'delivered').length;

  const menuItems = user?.role === 'store' ? [
    { label: 'Profile', icon: 'account', screen: 'Profile' },
    { label: 'Suppliers', icon: 'store', screen: 'Suppliers' },
    { label: 'Orders', icon: 'cart', screen: 'Orders', badge: nonDeliveredCount },
  ] : user?.role === 'supplier' ? [
    { label: 'Profile', icon: 'account', screen: 'Profile' },
    { label: 'Products', icon: 'package-variant', screen: 'SupplierMain', params: { screen: 'ProductsTab' } },
    { label: 'Orders', icon: 'cart', screen: 'SupplierMain', params: { screen: 'OrdersTab' }, badge: nonDeliveredCount },
  ] : [
    { label: 'Profile', icon: 'account', screen: 'Profile' },
    { label: 'Dashboard', icon: 'view-dashboard', screen: 'Dashboard' },
  ];

  const handleNavigation = (screen: string, params?: any) => {
    if (params) {
      (navigation as any).navigate(screen, params);
    } else {
      (navigation as any).navigate(screen);
    }
    navigation.closeDrawer();
  };

  const handleLogout = async () => {
    await logout();
    navigation.closeDrawer();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          {user?.banner_url && user.banner_url.trim() !== '' ? (
            <View style={styles.bannerContainer}>
              <Image source={{ uri: user.banner_url }} style={styles.banner} resizeMode="cover" />
                </View>
              ) : (
          <View style={styles.bannerPlaceholder} />
              )}
        <View style={styles.avatarContainer}>
            {user?.logo_url && user.logo_url.trim() !== '' ? (
                <Image source={{ uri: user.logo_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                    <Text variant="headlineMedium" style={styles.avatarText}>
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
              </View>
            )}
        </View>
        <View style={styles.headerContent}>
          <Text variant="titleLarge" style={styles.name} numberOfLines={1}>
            {user?.name || 'User'}
          </Text>
          <Text variant="bodySmall" style={styles.email} numberOfLines={1}>
            {user?.email}
          </Text>
          <Text variant="bodySmall" style={styles.role}>
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
          </Text>
        </View>
      </View>

      <Divider />

      <ScrollView style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableRipple
            key={index}
            onPress={() => handleNavigation(item.screen, (item as any).params)}
            style={styles.menuItem}
          >
            <View style={styles.menuItemContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={24}
                  color="#1976d2"
                  style={styles.menuIcon}
                />
                {(item as any).badge !== undefined && (item as any).badge > 0 && (
                  <Badge style={styles.badge} size={18}>
                    {(item as any).badge}
                  </Badge>
                )}
              </View>
              <Text variant="bodyLarge" style={styles.menuLabel}>
                {item.label}
              </Text>
            </View>
          </TouchableRipple>
        ))}
      </ScrollView>

      <Divider />

      <TouchableRipple onPress={handleLogout} style={styles.logoutItem}>
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  bannerContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  banner: {
    width: '100%',
    height: 150,
    backgroundColor: '#e0e0e0',
  },
  bannerPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#e0e0e0',
  },
  avatarContainer: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  headerContent: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
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
  iconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  menuIcon: {
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f44336',
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

