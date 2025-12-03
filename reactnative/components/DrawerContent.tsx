import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import {
  Text,
  Divider,
  TouchableRipple,
  ActivityIndicator,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authService } from '../lib/auth';

export default function DrawerContent() {
  const { user, logout, refreshUser } = useAuth();
  const navigation = useNavigation();
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);

  const menuItems = user?.role === 'store' ? [
    { label: 'Suppliers', icon: 'store', screen: 'Suppliers' },
    { label: 'Orders', icon: 'cart', screen: 'Orders' },
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

  const pickImage = async (type: 'logo' | 'banner') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'banner' ? [16, 9] : [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri, type);
    }
  };

  const uploadImage = async (uri: string, imageType: 'logo' | 'banner') => {
    setUploading(imageType);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('file', {
        uri,
        name: filename,
        type: mimeType,
      } as any);

      const response = await authService.uploadImage(formData);
      
      const updates = imageType === 'logo' 
        ? { logo_url: response.url }
        : { banner_url: response.url };

      await authService.updateMe(updates);
      await refreshUser();
      
      Alert.alert('Success', 'Image updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => pickImage('banner')}
          disabled={uploading === 'banner'}
          activeOpacity={0.7}
        >
          {user?.banner_url && user.banner_url.trim() !== '' ? (
            <View style={styles.bannerContainer}>
              <Image source={{ uri: user.banner_url }} style={styles.banner} resizeMode="cover" />
              {uploading === 'banner' ? (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              ) : (
                <View style={styles.editOverlay}>
                  <MaterialCommunityIcons name="pencil" size={20} color="#ffffff" />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.bannerPlaceholder}>
              {uploading === 'banner' ? (
                <ActivityIndicator size="small" color="#666666" />
              ) : (
                <MaterialCommunityIcons name="image-plus" size={32} color="#999999" />
              )}
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.avatarContainer}>
          <TouchableOpacity 
            onPress={() => pickImage('logo')}
            disabled={uploading === 'logo'}
            activeOpacity={0.7}
          >
            {user?.logo_url && user.logo_url.trim() !== '' ? (
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: user.logo_url }} style={styles.avatar} />
                {uploading === 'logo' ? (
                  <View style={styles.avatarUploadOverlay}>
                    <ActivityIndicator size="small" color="#ffffff" />
                  </View>
                ) : (
                  <View style={styles.avatarEditOverlay}>
                    <MaterialCommunityIcons name="pencil" size={16} color="#ffffff" />
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                {uploading === 'logo' ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Text variant="headlineMedium" style={styles.avatarText}>
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                    <View style={styles.avatarEditIcon}>
                      <MaterialCommunityIcons name="pencil" size={14} color="#ffffff" />
                    </View>
                  </>
                )}
              </View>
            )}
          </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  avatarWrapper: {
    position: 'relative',
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
    position: 'relative',
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarUploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
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

