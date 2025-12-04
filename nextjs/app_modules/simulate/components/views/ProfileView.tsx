'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  Avatar,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Image as ImageIcon,
  Facebook,
  Instagram,
  Twitter,
  LinkedIn,
  YouTube,
  Language,
  Email,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { Button, Rating } from '@mui/material';
import { User } from '@/lib/auth';
import { mobileAuthService, mobileOrderService } from '../../services/mobileApi';

interface ProfileViewProps {
  mobileUser: User;
  uploading: 'logo' | 'banner' | null;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => void;
  onUserUpdate: (user: User) => void;
  onRatingsClick?: () => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function ProfileView({
  mobileUser,
  uploading,
  onImageSelect,
  onUserUpdate,
  onRatingsClick,
  onToast,
}: ProfileViewProps) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [analytics, setAnalytics] = useState<{ average_rating?: number; rating_count: number } | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const getUrlEnd = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      if (pathParts.length > 0) {
        return '/' + pathParts[pathParts.length - 1];
      }
      return urlObj.hostname;
    } catch {
      const parts = url.split('/').filter(part => part);
      if (parts.length > 0 && !parts[parts.length - 1].includes('.')) {
        return '/' + parts[parts.length - 1];
      }
      return parts[parts.length - 1] || url;
    }
  };
  const [profileFormData, setProfileFormData] = useState({ 
    name: '', 
    phone: '',
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    youtube: '',
    tiktok: '',
    website: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileUser) {
      setProfileFormData({
        name: mobileUser.name || '',
        phone: mobileUser.phone || '',
        facebook: mobileUser.facebook || '',
        instagram: mobileUser.instagram || '',
        twitter: mobileUser.twitter || '',
        linkedin: mobileUser.linkedin || '',
        youtube: mobileUser.youtube || '',
        tiktok: mobileUser.tiktok || '',
        website: mobileUser.website || '',
      });
      setEditingProfile(false);
    }
  }, [mobileUser]);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!mobileUser) return;
      try {
        setLoadingAnalytics(true);
        const data = await mobileOrderService.getMyAnalytics();
        console.log('ProfileView analytics data:', data);
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        setAnalytics({ average_rating: undefined, rating_count: 0 });
      } finally {
        setLoadingAnalytics(false);
      }
    };
    loadAnalytics();
  }, [mobileUser]);

  const handleSaveProfile = async () => {
    if (!mobileUser) return;

    setSavingProfile(true);
    try {
      const updatedUser = await mobileAuthService.updateMe({
        name: profileFormData.name,
        phone: profileFormData.phone || undefined,
        facebook: profileFormData.facebook || undefined,
        instagram: profileFormData.instagram || undefined,
        twitter: profileFormData.twitter || undefined,
        linkedin: profileFormData.linkedin || undefined,
        youtube: profileFormData.youtube || undefined,
        tiktok: profileFormData.tiktok || undefined,
        website: profileFormData.website || undefined,
      });
      onUserUpdate(updatedUser);
      setEditingProfile(false);
      onToast('Profile updated successfully', 'success');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      onToast(err.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    if (mobileUser) {
      setProfileFormData({
        name: mobileUser.name || '',
        phone: mobileUser.phone || '',
        facebook: mobileUser.facebook || '',
        instagram: mobileUser.instagram || '',
        twitter: mobileUser.twitter || '',
        linkedin: mobileUser.linkedin || '',
        youtube: mobileUser.youtube || '',
        tiktok: mobileUser.tiktok || '',
        website: mobileUser.website || '',
      });
    }
    setEditingProfile(false);
  };

  return (
    <Box>
      <input
        type="file"
        accept="image/*"
        ref={bannerInputRef}
        style={{ display: 'none' }}
        onChange={(e) => onImageSelect(e, 'banner')}
      />
      <input
        type="file"
        accept="image/*"
        ref={logoInputRef}
        style={{ display: 'none' }}
        onChange={(e) => onImageSelect(e, 'logo')}
      />
      <Card sx={{ mb: 2, overflow: 'hidden' }}>
        <Box
          onClick={() => bannerInputRef.current?.click()}
          sx={{
            position: 'relative',
            cursor: 'pointer',
            '&:hover .banner-edit-overlay': { opacity: 1 },
          }}
        >
              {mobileUser.banner_url && mobileUser.banner_url.trim() !== '' ? (
            <>
              <CardMedia
                component="img"
                height="200"
                image={mobileUser.banner_url}
                alt="Banner"
              />
              {uploading === 'banner' ? (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                </Box>
              ) : (
                <Box
                  className="banner-edit-overlay"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <EditIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
              )}
            </>
          ) : (
            <Box
              sx={{
                height: 200,
                bgcolor: '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {uploading === 'banner' ? (
                <CircularProgress size={24} />
              ) : (
                <ImageIcon sx={{ fontSize: 48, color: '#999' }} />
              )}
            </Box>
          )}
        </Box>
        <CardContent sx={{ position: 'relative', pt: 8 }}>
          <Box
            onClick={() => logoInputRef.current?.click()}
            sx={{
              position: 'absolute',
              top: -40,
              left: '50%',
              transform: 'translateX(-50%)',
              cursor: 'pointer',
              '&:hover .logo-edit-overlay': { opacity: 1 },
            }}
          >
            {mobileUser.logo_url && mobileUser.logo_url.trim() !== '' ? (
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={mobileUser.logo_url}
                  sx={{
                    width: 80,
                    height: 80,
                    border: '3px solid white',
                  }}
                />
                {uploading === 'logo' ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: '50%',
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3px solid white',
                    }}
                  >
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  </Box>
                ) : (
                  <Box
                    className="logo-edit-overlay"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'rgba(0, 0, 0, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <EditIcon sx={{ color: 'white', fontSize: 16 }} />
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    border: '3px solid white',
                    bgcolor: '#1976d2',
                  }}
                >
                  {uploading === 'logo' ? (
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  ) : (
                    <>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {mobileUser.name?.charAt(0).toUpperCase() || 'U'}
                      </Typography>
                      <Box
                        className="logo-edit-overlay"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: 'rgba(0, 0, 0, 0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid white',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <EditIcon sx={{ color: 'white', fontSize: 14 }} />
                      </Box>
                    </>
                  )}
                </Avatar>
              </Box>
            )}
          </Box>
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            {editingProfile ? (
              <TextField
                fullWidth
                label="Name"
                value={profileFormData.name}
                onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                margin="normal"
                size="small"
                sx={{ mb: 1 }}
              />
            ) : (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {mobileUser.name}
                </Typography>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    justifyContent: 'center', 
                    mt: 1, 
                    minHeight: 24,
                    ...(analytics && analytics.rating_count > 0 && onRatingsClick ? { cursor: 'pointer' } : {})
                  }}
                  onClick={analytics && analytics.rating_count > 0 && onRatingsClick ? onRatingsClick : undefined}
                >
                  {loadingAnalytics ? (
                    <CircularProgress size={16} />
                  ) : analytics && analytics.rating_count > 0 ? (
                    <>
                      <Rating
                        value={analytics.average_rating || 0}
                        precision={0.1}
                        readOnly
                        size="small"
                        emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {(analytics.average_rating || 0).toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({analytics.rating_count} {analytics.rating_count === 1 ? 'rating' : 'ratings'})
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No ratings yet
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            {(mobileUser.email ||
              mobileUser.facebook ||
              mobileUser.instagram ||
              mobileUser.twitter ||
              mobileUser.linkedin ||
              mobileUser.youtube ||
              mobileUser.tiktok ||
              mobileUser.website) && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 2 }}>
              {mobileUser.email && (
                <Tooltip title={mobileUser.email}>
                  <IconButton
                    component="a"
                    href={`mailto:${mobileUser.email}`}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <Email />
                  </IconButton>
                </Tooltip>
              )}
              {mobileUser.facebook && (
                <Tooltip title={getUrlEnd(mobileUser.facebook)}>
                  <IconButton
                    component="a"
                    href={mobileUser.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#1877F2',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        bgcolor: '#1877F2',
                        color: 'white',
                        borderColor: '#1877F2',
                      },
                    }}
                  >
                    <Facebook />
                  </IconButton>
                </Tooltip>
              )}
              {mobileUser.instagram && (
                <Tooltip title={getUrlEnd(mobileUser.instagram)}>
                  <IconButton
                    component="a"
                    href={mobileUser.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#E4405F',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        bgcolor: '#E4405F',
                        color: 'white',
                        borderColor: '#E4405F',
                      },
                    }}
                  >
                    <Instagram />
                  </IconButton>
                </Tooltip>
              )}
              {mobileUser.twitter && (
                <Tooltip title={getUrlEnd(mobileUser.twitter)}>
                  <IconButton
                    component="a"
                    href={mobileUser.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#000000',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        bgcolor: '#000000',
                        color: 'white',
                        borderColor: '#000000',
                      },
                    }}
                  >
                    <Twitter />
                  </IconButton>
                </Tooltip>
              )}
              {mobileUser.linkedin && (
                <Tooltip title={getUrlEnd(mobileUser.linkedin)}>
                  <IconButton
                    component="a"
                    href={mobileUser.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#0077B5',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        bgcolor: '#0077B5',
                        color: 'white',
                        borderColor: '#0077B5',
                      },
                    }}
                  >
                    <LinkedIn />
                  </IconButton>
                </Tooltip>
              )}
              {mobileUser.youtube && (
                <Tooltip title={getUrlEnd(mobileUser.youtube)}>
                  <IconButton
                    component="a"
                    href={mobileUser.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#FF0000',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        bgcolor: '#FF0000',
                        color: 'white',
                        borderColor: '#FF0000',
                      },
                    }}
                  >
                    <YouTube />
                  </IconButton>
                </Tooltip>
              )}
              {mobileUser.tiktok && (
                <Tooltip title={getUrlEnd(mobileUser.tiktok)}>
                  <IconButton
                    component="a"
                    href={mobileUser.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#000000',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        bgcolor: '#000000',
                        color: 'white',
                        borderColor: '#000000',
                      },
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        fontFamily: 'Arial, sans-serif',
                      }}
                    >
                      TT
                    </Typography>
                  </IconButton>
                </Tooltip>
              )}
              {mobileUser.website && (
                <Tooltip title={getUrlEnd(mobileUser.website)}>
                  <IconButton
                    component="a"
                    href={mobileUser.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'primary.main',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <Language />
                  </IconButton>
                </Tooltip>
              )}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Account Details
            </Typography>
            {!editingProfile ? (
              <Button
                startIcon={<EditIcon />}
                onClick={() => setEditingProfile(true)}
                size="small"
                sx={{ color: 'primary.main' }}
              >
                Edit
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  size="small"
                  variant="contained"
                  color="primary"
                >
                  Save
                </Button>
                <Button
                  startIcon={<CancelIcon />}
                  onClick={handleCancelEdit}
                  disabled={savingProfile}
                  size="small"
                >
                  Cancel
                </Button>
              </Box>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Email
              </Typography>
              <Typography variant="body1">
                {mobileUser.email}
              </Typography>
            </Box>
            {editingProfile ? (
              <TextField
                fullWidth
                label="Phone"
                value={profileFormData.phone}
                onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                margin="normal"
                size="small"
                type="tel"
              />
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Phone
                </Typography>
                <Typography variant="body1">
                  {mobileUser.phone || 'Not set'}
                </Typography>
              </Box>
            )}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                User ID
              </Typography>
              <Typography variant="body1">
                {mobileUser.id}
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Account Created
              </Typography>
              <Typography variant="body1">
                {new Date(mobileUser.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Last Updated
              </Typography>
              <Typography variant="body1">
                {new Date(mobileUser.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>
            </Box>
            {editingProfile && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Social Media Links
                </Typography>
                <TextField
                  fullWidth
                  label="Facebook"
                  value={profileFormData.facebook}
                  onChange={(e) => setProfileFormData({ ...profileFormData, facebook: e.target.value })}
                  margin="normal"
                  size="small"
                  type="url"
                  placeholder="https://facebook.com/..."
                />
                <TextField
                  fullWidth
                  label="Instagram"
                  value={profileFormData.instagram}
                  onChange={(e) => setProfileFormData({ ...profileFormData, instagram: e.target.value })}
                  margin="normal"
                  size="small"
                  type="url"
                  placeholder="https://instagram.com/..."
                />
                <TextField
                  fullWidth
                  label="Twitter/X"
                  value={profileFormData.twitter}
                  onChange={(e) => setProfileFormData({ ...profileFormData, twitter: e.target.value })}
                  margin="normal"
                  size="small"
                  type="url"
                  placeholder="https://twitter.com/..."
                />
                <TextField
                  fullWidth
                  label="LinkedIn"
                  value={profileFormData.linkedin}
                  onChange={(e) => setProfileFormData({ ...profileFormData, linkedin: e.target.value })}
                  margin="normal"
                  size="small"
                  type="url"
                  placeholder="https://linkedin.com/..."
                />
                <TextField
                  fullWidth
                  label="YouTube"
                  value={profileFormData.youtube}
                  onChange={(e) => setProfileFormData({ ...profileFormData, youtube: e.target.value })}
                  margin="normal"
                  size="small"
                  type="url"
                  placeholder="https://youtube.com/..."
                />
                <TextField
                  fullWidth
                  label="TikTok"
                  value={profileFormData.tiktok}
                  onChange={(e) => setProfileFormData({ ...profileFormData, tiktok: e.target.value })}
                  margin="normal"
                  size="small"
                  type="url"
                  placeholder="https://tiktok.com/..."
                />
                <TextField
                  fullWidth
                  label="Website"
                  value={profileFormData.website}
                  onChange={(e) => setProfileFormData({ ...profileFormData, website: e.target.value })}
                  margin="normal"
                  size="small"
                  type="url"
                  placeholder="https://example.com"
                />
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

