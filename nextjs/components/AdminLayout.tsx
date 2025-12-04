'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Logout as LogoutIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Assessment as AssessmentIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { bugsService } from '@/lib/bugs';

const drawerWidth = 240;

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unresolvedBugsCount, setUnresolvedBugsCount] = useState(0);

  const adminLevel = user?.admin_level ?? 1;
  const isLevel1 = adminLevel === 1;

  useEffect(() => {
    if (isLevel1 && user) {
      const fetchUnresolvedBugs = async () => {
        try {
          const response = await bugsService.getBugReports({ limit: 1000 });
          const unresolved = response.data.filter(
            (bug) => bug.status !== 'resolved' && bug.status !== 'closed'
          );
          setUnresolvedBugsCount(unresolved.length);
        } catch (error) {
          console.error('Failed to fetch unresolved bugs count:', error);
        }
      };

      fetchUnresolvedBugs();
      const interval = setInterval(fetchUnresolvedBugs, 30000);
      return () => clearInterval(interval);
    }
  }, [isLevel1, user]);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Users', icon: <PeopleIcon />, path: '/users' },
    ...(isLevel1 ? [{ text: 'Admins', icon: <AdminIcon />, path: '/admins' }] : []),
    ...(isLevel1 ? [{ text: 'Audit Logs', icon: <AssessmentIcon />, path: '/audit-logs' }] : []),
    { text: 'Orders', icon: <ShoppingCartIcon />, path: '/orders' },
    { text: 'Products', icon: <InventoryIcon />, path: '/products' },
    { text: 'Simulate', icon: <PhoneAndroidIcon />, path: '/simulate' },
    ...(isLevel1
      ? [
          {
            text: 'Bugs',
            icon: (
              <Badge badgeContent={unresolvedBugsCount} color="error" overlap="circular">
                <BugReportIcon sx={{ color: 'red' }} />
              </Badge>
            ),
            path: '/bugs',
          },
        ]
      : []),
  ].filter(Boolean);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#38b2ac',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <Image src="/logo.png" alt="Logo" width={150} height={60} style={{ height: 'auto', width: 150 }} />
            
          </Box>
          {user && (
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.name} ({user.role})
            </Typography>
          )}
          <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

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
                  selected={pathname === item.path}
                  onClick={() => router.push(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

