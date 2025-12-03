'use client';

import { useRef } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  CircularProgress,
  Badge,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountCircle as AccountIcon,
  Edit as EditIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { User } from '@/lib/auth';
import { Order } from '@/lib/users';
import { mobileAuthService } from '../services/mobileApi';

type ViewType = 'suppliers' | 'stores' | 'orders' | 'supplier-products' | 'truck' | 'order-detail' | 'profile';

interface MobileDrawerProps {
  mobileUser: User;
  orders: Order[];
  activeView: ViewType;
  uploading: 'logo' | 'banner' | null;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => void;
}

export function MobileDrawer({
  mobileUser,
  orders,
  activeView,
  uploading,
  onViewChange,
  onLogout,
  onImageSelect,
}: MobileDrawerProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const nonDeliveredCount = orders.filter(order => order.status !== 'delivered').length;

  const menuItems = [
    { label: 'Profile', icon: <AccountIcon />, view: 'profile' as const },
    ...(mobileUser?.role === 'supplier' ? [] : [{ label: 'Suppliers', icon: <StoreIcon />, view: 'suppliers' as const }]),
    ...(mobileUser?.role === 'store' ? [] : [{ label: 'Stores', icon: <StoreIcon />, view: 'stores' as const }]),
    { 
      label: 'Orders', 
      icon: (
        <Badge badgeContent={nonDeliveredCount} color="error" overlap="circular">
          <ShoppingCartIcon />
        </Badge>
      ), 
      view: 'orders' as const 
    },
  ];

  return (
    <Box sx={{ pt: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
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
      <Box
        onClick={() => bannerInputRef.current?.click()}
        sx={{
          position: 'relative',
          height: 150,
          bgcolor: '#e0e0e0',
          mb: 8,
          cursor: 'pointer',
          '&:hover .edit-overlay': {
            opacity: 1,
          },
        }}
      >
        {mobileUser?.banner_url && mobileUser.banner_url.trim() !== '' ? (
          <>
            <Box
              component="img"
              src={mobileUser.banner_url}
              alt="Banner"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {uploading === 'banner' ? (
              <Box
                className="edit-overlay"
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
                  opacity: 1,
                }}
              >
                <CircularProgress size={24} sx={{ color: 'white' }} />
              </Box>
            ) : (
              <Box
                className="edit-overlay"
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
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {uploading === 'banner' ? (
              <CircularProgress size={24} />
            ) : (
              <ImageIcon sx={{ fontSize: 40, color: '#999' }} />
            )}
          </Box>
        )}
        <Box
          onClick={(e) => {
            e.stopPropagation();
            logoInputRef.current?.click();
          }}
          sx={{
            position: 'absolute',
            bottom: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            '&:hover .avatar-edit-overlay': {
              opacity: 1,
            },
          }}
        >
          {mobileUser?.logo_url && mobileUser.logo_url.trim() !== '' ? (
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
                  className="avatar-edit-overlay"
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
                      {mobileUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </Typography>
                    <Box
                      className="avatar-edit-overlay"
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
                  </>
                )}
              </Avatar>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ px: 2, pb: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {mobileUser?.name || 'User'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {mobileUser?.email}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
          {mobileUser?.role}
        </Typography>
      </Box>

      <Divider />

      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton
              onClick={() => {
                if (item.view) {
                  onViewChange(item.view);
                }
              }}
              selected={item.view === activeView}
            >
              <ListItemIcon sx={{ color: '#1976d2' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      <ListItem disablePadding>
        <ListItemButton onClick={onLogout}>
          <ListItemIcon sx={{ color: '#d32f2f' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" sx={{ color: '#d32f2f' }} />
        </ListItemButton>
      </ListItem>
    </Box>
  );
}

