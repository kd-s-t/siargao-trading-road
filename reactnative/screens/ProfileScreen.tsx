import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import {
  Text,
  Surface,
  Button,
  Card,
  Divider,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../lib/auth';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const navigation = useNavigation();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    logo_url: user?.logo_url || '',
    banner_url: user?.banner_url || '',
  });

  const handleLogout = async () => {
    await logout();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await authService.updateMe(formData);
      await refreshUser();
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
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
      
      if (imageType === 'logo') {
        setFormData({ ...formData, logo_url: response.url });
      } else {
        setFormData({ ...formData, banner_url: response.url });
      }

      Alert.alert('Success', 'Image uploaded successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return null;
  }

  const displayData = editing ? formData : {
    name: user.name,
    phone: user.phone || '',
    logo_url: user.logo_url || '',
    banner_url: user.banner_url || '',
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Profile
          </Text>
          <View style={styles.headerButtons}>
            {editing ? (
              <>
                <Button mode="text" onPress={() => {
                  setEditing(false);
                  setFormData({
                    name: user.name,
                    phone: user.phone || '',
                    logo_url: user.logo_url || '',
                    banner_url: user.banner_url || '',
                  });
                }}>
                  Cancel
                </Button>
                <Button mode="text" onPress={handleSave} disabled={loading}>
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button mode="text" onPress={() => setEditing(true)}>
                  Edit
                </Button>
                <Button mode="text" onPress={() => navigation.goBack()}>
                  Back
                </Button>
              </>
            )}
          </View>
        </View>
      </Surface>

      <ScrollView style={styles.content}>
        {displayData.banner_url ? (
          <Image source={{ uri: displayData.banner_url }} style={styles.banner} />
        ) : editing ? (
          <View style={styles.bannerPlaceholder}>
            <Button
              mode="outlined"
              onPress={() => pickImage('banner')}
              disabled={uploading === 'banner'}
              loading={uploading === 'banner'}
            >
              {uploading === 'banner' ? 'Uploading...' : 'Add Banner'}
            </Button>
          </View>
        ) : null}

        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.avatarContainer}>
              {displayData.logo_url ? (
                <Image source={{ uri: displayData.logo_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text variant="headlineMedium" style={styles.avatarText}>
                    {displayData.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {editing && (
                <Button
                  mode="outlined"
                  compact
                  onPress={() => pickImage('logo')}
                  disabled={uploading === 'logo'}
                  loading={uploading === 'logo'}
                  style={styles.uploadLogoButton}
                >
                  {uploading === 'logo' ? 'Uploading...' : 'Change Logo'}
                </Button>
              )}
              {editing ? (
                <TextInput
                  label="Name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  mode="outlined"
                  style={styles.input}
                />
              ) : (
                <Text variant="headlineMedium" style={styles.name}>
                  {displayData.name}
                </Text>
              )}
              <Text variant="bodyMedium" style={styles.role}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Account Details
            </Text>
            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text variant="bodySmall" style={styles.label}>
                Email:
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {user.email}
              </Text>
            </View>

            {editing ? (
              <TextInput
                label="Phone"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
              />
            ) : (
              displayData.phone && (
                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.label}>
                    Phone:
                  </Text>
                  <Text variant="bodyMedium" style={styles.value}>
                    {displayData.phone}
                  </Text>
                </View>
              )
            )}

            <View style={styles.detailRow}>
              <Text variant="bodySmall" style={styles.label}>
                User ID:
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {user.id}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text variant="bodySmall" style={styles.label}>
                Account Created:
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {formatDate(user.created_at)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodySmall" style={styles.label}>
                Last Updated:
              </Text>
              <Text variant="bodyMedium" style={styles.value}>
                {formatDate(user.updated_at)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {!editing && (
          <Card style={styles.actionsCard}>
            <Card.Content>
              <Button
                mode="contained"
                onPress={handleLogout}
                buttonColor="#d32f2f"
                style={styles.logoutButton}
              >
                Logout
              </Button>
            </Card.Content>
          </Card>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  banner: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  bannerPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    marginTop: -40,
    marginHorizontal: 16,
    marginBottom: 16,
    zIndex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  uploadLogoButton: {
    marginBottom: 16,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  role: {
    opacity: 0.7,
    textTransform: 'capitalize',
  },
  input: {
    marginBottom: 16,
    width: '100%',
  },
  detailsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    opacity: 0.7,
    flex: 1,
  },
  value: {
    flex: 2,
    textAlign: 'right',
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  logoutButton: {
    marginTop: 8,
  },
});
