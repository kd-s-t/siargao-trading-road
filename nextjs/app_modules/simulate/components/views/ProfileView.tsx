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
} from '@mui/icons-material';
import { User } from '@/lib/auth';
import { mobileAuthService } from '../../services/mobileApi';

interface ProfileViewProps {
  mobileUser: User;
  uploading: 'logo' | 'banner' | null;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => void;
  onUserUpdate: (user: User) => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function ProfileView({
  mobileUser,
  uploading,
  onImageSelect,
  onUserUpdate,
  onToast,
}: ProfileViewProps) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ name: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileUser) {
      setProfileFormData({
        name: mobileUser.name || '',
        phone: mobileUser.phone || '',
      });
      setEditingProfile(false);
    }
  }, [mobileUser]);

  const handleSaveProfile = async () => {
    if (!mobileUser) return;

    setSavingProfile(true);
    try {
      const updatedUser = await mobileAuthService.updateMe({
        name: profileFormData.name,
        phone: profileFormData.phone || undefined,
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
          onClick={() => editingProfile && bannerInputRef.current?.click()}
          sx={{
            position: 'relative',
            cursor: editingProfile ? 'pointer' : 'default',
            '&:hover .banner-edit-overlay': editingProfile ? { opacity: 1 } : {},
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
              {editingProfile && (
                <>
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
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <EditIcon sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                  )}
                </>
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
              {editingProfile && uploading === 'banner' ? (
                <CircularProgress size={24} />
              ) : (
                <ImageIcon sx={{ fontSize: 48, color: '#999' }} />
              )}
            </Box>
          )}
        </Box>
        <CardContent sx={{ position: 'relative', pt: 8 }}>
          <Box
            onClick={() => editingProfile && logoInputRef.current?.click()}
            sx={{
              position: 'absolute',
              top: -40,
              left: '50%',
              transform: 'translateX(-50%)',
              cursor: editingProfile ? 'pointer' : 'default',
              '&:hover .logo-edit-overlay': editingProfile ? { opacity: 1 } : {},
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
                {editingProfile && (
                  <>
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
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: '#1976d2',
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
                    )}
                  </>
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
                  {editingProfile && uploading === 'logo' ? (
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  ) : (
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {mobileUser.name?.charAt(0).toUpperCase() || 'U'}
                    </Typography>
                  )}
                </Avatar>
                {editingProfile && uploading !== 'logo' && (
                  <Box
                    className="logo-edit-overlay"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: '#1976d2',
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
                )}
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
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {mobileUser.name}
              </Typography>
            )}
            {mobileUser.email && (
              <Tooltip title={mobileUser.email}>
                <IconButton
                  component="a"
                  href={`mailto:${mobileUser.email}`}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  <Email />
                </IconButton>
              </Tooltip>
            )}
            {(mobileUser.facebook ||
              mobileUser.instagram ||
              mobileUser.twitter ||
              mobileUser.linkedin ||
              mobileUser.youtube ||
              mobileUser.tiktok ||
              mobileUser.website) && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 2 }}>
              {mobileUser.facebook && (
                <Tooltip title="Facebook">
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
                <Tooltip title="Instagram">
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
                <Tooltip title="Twitter/X">
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
                <Tooltip title="LinkedIn">
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
                <Tooltip title="YouTube">
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
                <Tooltip title="TikTok">
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
                <Tooltip title="Website">
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
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Account Details
          </Typography>
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
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

