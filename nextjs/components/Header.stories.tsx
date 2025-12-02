import type { Meta, StoryObj } from '@storybook/react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import Image from 'next/image';

const meta: Meta<typeof AppBar> = {
  title: 'Components/Header',
  component: AppBar,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof AppBar>;

export const AdminHeader: Story = {
  render: () => (
    <AppBar
      position="static"
      sx={{
        backgroundColor: '#38b2ac',
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <Image src="/logo.png" alt="Logo" width={150} height={60} style={{ height: 'auto', width: 150 }} />
        </Box>
        <Typography variant="body2" sx={{ mr: 2 }}>
          Admin User (admin)
        </Typography>
        <Button color="inherit" startIcon={<LogoutIcon />}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  ),
};

export const StoreHeader: Story = {
  render: () => (
    <AppBar
      position="static"
      sx={{
        backgroundColor: '#10b981',
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <Image src="/logo.png" alt="Logo" width={150} height={60} style={{ height: 'auto', width: 150 }} />
        </Box>
        <Typography variant="body2" sx={{ mr: 2 }}>
          Store User (store)
        </Typography>
        <Button color="inherit" startIcon={<LogoutIcon />}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  ),
};

export const SupplierHeader: Story = {
  render: () => (
    <AppBar
      position="static"
      sx={{
        backgroundColor: '#3b82f6',
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <Image src="/logo.png" alt="Logo" width={150} height={60} style={{ height: 'auto', width: 150 }} />
        </Box>
        <Typography variant="body2" sx={{ mr: 2 }}>
          Supplier User (supplier)
        </Typography>
        <Button color="inherit" startIcon={<LogoutIcon />}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  ),
};

export const MinimalHeader: Story = {
  render: () => (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <Image src="/logo.png" alt="Logo" width={150} height={60} style={{ height: 'auto', width: 150 }} />
        </Box>
      </Toolbar>
    </AppBar>
  ),
};

export const LandingPageHeader: Story = {
  render: () => (
    <Box sx={{ position: 'relative', minHeight: '200px', bgcolor: '#1a3a5f' }}>
      <AppBar 
        position="static" 
        elevation={0} 
        sx={{ 
          bgcolor: 'transparent', 
          color: 'white', 
          position: 'relative', 
          zIndex: 1 
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <Image src="/logo.png" alt="Logo" width={150} height={40} style={{ height: 40, width: 'auto' }} />
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 4, color: 'white', textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Siargao Trading Road
        </Typography>
        <Typography variant="body1">
          Connecting suppliers and stores in Siargao
        </Typography>
      </Box>
    </Box>
  ),
};

