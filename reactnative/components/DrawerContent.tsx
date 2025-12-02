import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import {
  Text,
  Divider,
  TouchableRipple,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DrawerContent() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const menuItems = user?.role === 'store' ? [
    { label: 'Suppliers', icon: 'store', screen: 'Suppliers' },
    { label: 'Profile', icon: 'account', screen: 'Profile' },
  ] : user?.role === 'supplier' ? [
    { label: 'Products', icon: 'package-variant', screen: 'SupplierMain' },
    { label: 'Orders', icon: 'cart', screen: 'SupplierMain' },
    { label: 'Profile', icon: 'account', screen: 'Profile' },
  ] : [
    { label: 'Dashboard', icon: 'view-dashboard', screen: 'Dashboard' },
    { label: 'Profile', icon: 'account', screen: 'Profile' },
  ];

  const handleNavigation = (screen: string) => {
    (navigation as any).navigate(screen);
    (navigation as any).closeDrawer();
  };

  const handleLogout = async () => {
    await logout();
    (navigation as any).closeDrawer();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {user?.logo_url ? (
          <Image source={{ uri: user.logo_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text variant="headlineMedium" style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        )}
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

      <Divider />

      <ScrollView style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableRipple
            key={index}
            onPress={() => handleNavigation(item.screen)}
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

