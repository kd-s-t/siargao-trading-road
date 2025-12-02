import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Toolbar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
}

const getAdminMenuItems = (): MenuItem[] => [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Users', icon: <PeopleIcon />, path: '/users' },
  { text: 'Admins', icon: <AdminIcon />, path: '/admins' },
  { text: 'Orders', icon: <ShoppingCartIcon />, path: '/orders' },
  { text: 'Products', icon: <InventoryIcon />, path: '/products' },
];

const getStoreMenuItems = (): MenuItem[] => [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/store/dashboard' },
  { text: 'Orders', icon: <ShoppingCartIcon />, path: '/store/orders' },
  { text: 'Products', icon: <InventoryIcon />, path: '/store/products' },
];

const getSupplierMenuItems = (): MenuItem[] => [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/supplier/dashboard' },
  { text: 'Orders', icon: <ShoppingCartIcon />, path: '/supplier/orders' },
  { text: 'Products', icon: <InventoryIcon />, path: '/supplier/products' },
];

interface NavigationDrawerProps {
  menuItems: MenuItem[];
  selectedPath?: string;
}

const NavigationDrawer = ({ menuItems, selectedPath = '/dashboard' }: NavigationDrawerProps) => (
  <Drawer
    variant="permanent"
    sx={{
      width: drawerWidth,
      flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: drawerWidth,
        boxSizing: 'border-box',
      },
    }}
  >
    <Toolbar />
    <Box sx={{ overflow: 'auto' }}>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={selectedPath === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  </Drawer>
);

const meta: Meta<typeof NavigationDrawer> = {
  title: 'Components/Navigation',
  component: NavigationDrawer,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof NavigationDrawer>;

export const AdminNavigation: Story = {
  render: () => (
    <Box sx={{ display: 'flex' }}>
      <NavigationDrawer menuItems={getAdminMenuItems()} selectedPath="/dashboard" />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Box>Content area</Box>
      </Box>
    </Box>
  ),
};

export const StoreNavigation: Story = {
  render: () => (
    <Box sx={{ display: 'flex' }}>
      <NavigationDrawer menuItems={getStoreMenuItems()} selectedPath="/store/dashboard" />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Box>Content area</Box>
      </Box>
    </Box>
  ),
};

export const SupplierNavigation: Story = {
  render: () => (
    <Box sx={{ display: 'flex' }}>
      <NavigationDrawer menuItems={getSupplierMenuItems()} selectedPath="/supplier/dashboard" />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Box>Content area</Box>
      </Box>
    </Box>
  ),
};

export const NavigationOnly: Story = {
  render: () => (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      <NavigationDrawer menuItems={getAdminMenuItems()} selectedPath="/products" />
    </Box>
  ),
};

