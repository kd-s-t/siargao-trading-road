import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, Linking, TouchableOpacity } from 'react-native';
import {
  Text,
  Surface,
  Button,
  Card,
  Divider,
  TextInput,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../lib/auth';
import { useNavigation } from '@react-navigation/native';
import { ratingService } from '../lib/ratings';

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
    facebook: user?.facebook || '',
    instagram: user?.instagram || '',
    twitter: user?.twitter || '',
    linkedin: user?.linkedin || '',
    youtube: user?.youtube || '',
    tiktok: user?.tiktok || '',
    website: user?.website || '',
  });

  useEffect(() => {
    refreshUser();
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone || '',
        logo_url: user.logo_url || '',
        banner_url: user.banner_url || '',
        facebook: user.facebook || '',
        instagram: user.instagram || '',
        twitter: user.twitter || '',
        linkedin: user.linkedin || '',
        youtube: user.youtube || '',
        tiktok: user.tiktok || '',
        website: user.website || '',
      });
    }
  }, [user]);

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
      const uploadFormData = new FormData();
      const filename = uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : `image/jpeg`;

      uploadFormData.append('file', {
        uri,
        name: filename,
        type: mimeType,
      } as any);

      const response = await authService.uploadImage(uploadFormData);
      
      const updatedFormData = {
        ...formData,
        ...(imageType === 'logo' ? { logo_url: response.url } : { banner_url: response.url }),
      };
      
      setFormData(updatedFormData);

      if (!editing) {
        await authService.updateMe(updatedFormData);
        await refreshUser();
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
                    facebook: user.facebook || '',
                    instagram: user.instagram || '',
                    twitter: user.twitter || '',
                    linkedin: user.linkedin || '',
                    youtube: user.youtube || '',
                    tiktok: user.tiktok || '',
                    website: user.website || '',
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
        <View style={styles.bannerContainer}>
          <TouchableOpacity 
              onPress={() => pickImage('banner')}
              disabled={uploading === 'banner'}
            activeOpacity={0.8}
          >
            {displayData.banner_url ? (
              <>
                <Image source={{ uri: displayData.banner_url }} style={styles.banner} />
                {uploading === 'banner' ? (
                  <View style={styles.bannerEditOverlay}>
                    <ActivityIndicator size="small" color="#ffffff" />
                  </View>
                ) : (
                  <View style={styles.bannerEditOverlay}>
                    <MaterialCommunityIcons name="pencil" size={20} color="#ffffff" />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.bannerPlaceholder}>
                {uploading === 'banner' ? (
                  <ActivityIndicator size="small" color="#666666" />
                ) : (
                  <MaterialCommunityIcons name="image-plus" size={48} color="#999999" />
                )}
              </View>
            )}
          </TouchableOpacity>
          </View>

        <View style={styles.profileCardWrapper}>
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.avatarContainer}>
              <TouchableOpacity 
                onPress={() => pickImage('logo')}
                disabled={uploading === 'logo'}
                activeOpacity={0.7}
              >
              {displayData.logo_url ? (
                  <View style={styles.logoWrapper}>
                <Image source={{ uri: displayData.logo_url }} style={styles.avatarImage} />
                    {uploading === 'logo' ? (
                      <View style={styles.logoEditOverlay}>
                        <ActivityIndicator size="small" color="#ffffff" />
                      </View>
                    ) : (
                      <View style={styles.logoEditOverlay}>
                        <MaterialCommunityIcons name="pencil" size={16} color="#ffffff" />
                      </View>
                    )}
                  </View>
              ) : (
                <View style={styles.avatar}>
                    {uploading === 'logo' ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                  <Text variant="headlineMedium" style={styles.avatarText}>
                    {displayData.name.charAt(0).toUpperCase()}
                  </Text>
                        <View style={styles.avatarEditIcon}>
                          <MaterialCommunityIcons name="pencil" size={14} color="#ffffff" />
                        </View>
                      </>
                    )}
                </View>
              )}
              </TouchableOpacity>
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
              {!editing && (user.role === 'store' || user.role === 'supplier') && (
                <TouchableOpacity
                  onPress={() => {
                    (navigation as any).navigate('RatingsList');
                  }}
                  style={styles.ratingContainer}
                >
                  {user.rating_count && user.rating_count > 0 ? (
                    <View style={styles.ratingContent}>
                      <View style={styles.ratingStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <MaterialCommunityIcons
                            key={star}
                            name={star <= Math.round(user.average_rating || 0) ? 'star' : 'star-outline'}
                            size={20}
                            color="#FFD700"
                          />
                        ))}
                      </View>
                      <Text variant="bodyMedium" style={styles.ratingText}>
                        {user.average_rating?.toFixed(1) || '0.0'} ({user.rating_count} {user.rating_count === 1 ? 'rating' : 'ratings'})
                      </Text>
                    </View>
                  ) : (
                    <Text variant="bodySmall" style={styles.noRatingsText}>
                      No ratings yet
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              {(user.email || user.facebook || user.instagram || user.twitter || user.linkedin || user.youtube || user.tiktok || user.website) && (
                <View style={styles.socialLinks}>
                  {user.email && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`mailto:${user.email}`)}
                      style={styles.socialButton}
                    >
                      <MaterialCommunityIcons name="email" size={24} color="#1976d2" />
                    </TouchableOpacity>
                  )}
                  {user.facebook && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(user.facebook!)}
                      style={styles.socialButton}
                    >
                      <MaterialCommunityIcons name="facebook" size={24} color="#1877F2" />
                    </TouchableOpacity>
                  )}
                  {user.instagram && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(user.instagram!)}
                      style={styles.socialButton}
                    >
                      <MaterialCommunityIcons name="instagram" size={24} color="#E4405F" />
                    </TouchableOpacity>
                  )}
                  {user.twitter && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(user.twitter!)}
                      style={styles.socialButton}
                    >
                      <MaterialCommunityIcons name="twitter" size={24} color="#000000" />
                    </TouchableOpacity>
                  )}
                  {user.linkedin && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(user.linkedin!)}
                      style={styles.socialButton}
                    >
                      <MaterialCommunityIcons name="linkedin" size={24} color="#0077B5" />
                    </TouchableOpacity>
                  )}
                  {user.youtube && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(user.youtube!)}
                      style={styles.socialButton}
                    >
                      <MaterialCommunityIcons name="youtube" size={24} color="#FF0000" />
                    </TouchableOpacity>
                  )}
                  {user.tiktok && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(user.tiktok!)}
                      style={styles.socialButton}
                    >
                      <Text style={styles.tiktokText}>TT</Text>
                    </TouchableOpacity>
                  )}
                  {user.website && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(user.website!)}
                      style={styles.socialButton}
                    >
                      <MaterialCommunityIcons name="web" size={24} color="#1976d2" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.detailsCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Account Details
            </Text>
            </View>
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

            {editing && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleSmall" style={styles.subsectionTitle}>
                  Social Media Links
                </Text>
                <TextInput
                  label="Facebook"
                  value={formData.facebook}
                  onChangeText={(text) => setFormData({ ...formData, facebook: text })}
                  mode="outlined"
                  keyboardType="url"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholder="https://facebook.com/..."
                />
                <TextInput
                  label="Instagram"
                  value={formData.instagram}
                  onChangeText={(text) => setFormData({ ...formData, instagram: text })}
                  mode="outlined"
                  keyboardType="url"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholder="https://instagram.com/..."
                />
                <TextInput
                  label="Twitter/X"
                  value={formData.twitter}
                  onChangeText={(text) => setFormData({ ...formData, twitter: text })}
                  mode="outlined"
                  keyboardType="url"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholder="https://twitter.com/..."
                />
                <TextInput
                  label="LinkedIn"
                  value={formData.linkedin}
                  onChangeText={(text) => setFormData({ ...formData, linkedin: text })}
                  mode="outlined"
                  keyboardType="url"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholder="https://linkedin.com/..."
                />
                <TextInput
                  label="YouTube"
                  value={formData.youtube}
                  onChangeText={(text) => setFormData({ ...formData, youtube: text })}
                  mode="outlined"
                  keyboardType="url"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholder="https://youtube.com/..."
                />
                <TextInput
                  label="TikTok"
                  value={formData.tiktok}
                  onChangeText={(text) => setFormData({ ...formData, tiktok: text })}
                  mode="outlined"
                  keyboardType="url"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholder="https://tiktok.com/..."
                />
                <TextInput
                  label="Website"
                  value={formData.website}
                  onChangeText={(text) => setFormData({ ...formData, website: text })}
                  mode="outlined"
                  keyboardType="url"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholder="https://example.com"
                />
              </>
            )}
          </Card.Content>
        </Card>
        </View>

        {!editing && (
          <View style={styles.logoutContainer}>
            <Button
              mode="contained"
              onPress={handleLogout}
              buttonColor="#d32f2f"
              style={styles.logoutButton}
            >
              Logout
            </Button>
          </View>
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
  bannerContainer: {
    position: 'relative',
    width: '100%',
  },
  banner: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  bannerEditOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCardWrapper: {
    marginTop: -40,
    marginHorizontal: 16,
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  profileCard: {
    width: '100%',
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  editButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  editIconButton: {
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  logoEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 28,
    height: 28,
    justifyContent: 'center',
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
  role: {
    opacity: 0.7,
    textTransform: 'capitalize',
    marginTop: 8,
  },
  ratingContainer: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  ratingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontWeight: '600',
  },
  noRatingsText: {
    opacity: 0.6,
    textAlign: 'center',
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  socialButton: {
    padding: 8,
  },
  tiktokText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  input: {
    marginBottom: 16,
    width: '100%',
  },
  detailsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  logoutContainer: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  sectionEditButton: {
    margin: 0,
    marginLeft: 8,
  },
  subsectionTitle: {
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
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
  logoutButton: {
    width: '100%',
  },
});
