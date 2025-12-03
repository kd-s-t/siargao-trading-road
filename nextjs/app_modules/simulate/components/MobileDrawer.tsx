'use client';

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
  Badge,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { User } from '@/lib/auth';
import { Order } from '@/lib/users';

type ViewType = 'suppliers' | 'stores' | 'orders' | 'supplier-products' | 'truck' | 'order-detail' | 'profile';

interface MobileDrawerProps {
  mobileUser: User;
  orders: Order[];
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
}

export function MobileDrawer({
  mobileUser,
  orders,
  activeView,
  onViewChange,
  onLogout,
}: MobileDrawerProps) {
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
      <Box
        sx={{
          position: 'relative',
          height: 150,
          bgcolor: '#e0e0e0',
          mb: 8,
        }}
      >
        {mobileUser?.banner_url && mobileUser.banner_url.trim() !== '' ? (
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
        ) : null}
        <Box
          sx={{
            position: 'absolute',
            bottom: -40,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {mobileUser?.logo_url && mobileUser.logo_url.trim() !== '' ? (
            <Avatar
              src={mobileUser.logo_url}
              sx={{
                width: 80,
                height: 80,
                border: '3px solid white',
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 80,
                height: 80,
                border: '3px solid white',
                bgcolor: '#1976d2',
              }}
            >
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                {mobileUser?.name?.charAt(0).toUpperCase() || 'U'}
              </Typography>
            </Avatar>
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

