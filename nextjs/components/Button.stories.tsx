import type { Meta, StoryObj } from '@storybook/react';
import { Button, Box, Stack } from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Logout as LogoutIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Contained: Story = {
  render: () => (
    <Stack spacing={2} direction="row">
      <Button variant="contained">Contained</Button>
      <Button variant="contained" color="primary">Primary</Button>
      <Button variant="contained" color="secondary">Secondary</Button>
      <Button variant="contained" color="success">Success</Button>
      <Button variant="contained" color="error">Error</Button>
    </Stack>
  ),
};

export const Outlined: Story = {
  render: () => (
    <Stack spacing={2} direction="row">
      <Button variant="outlined">Outlined</Button>
      <Button variant="outlined" color="primary">Primary</Button>
      <Button variant="outlined" color="secondary">Secondary</Button>
      <Button variant="outlined" color="success">Success</Button>
      <Button variant="outlined" color="error">Error</Button>
    </Stack>
  ),
};

export const Text: Story = {
  render: () => (
    <Stack spacing={2} direction="row">
      <Button variant="text">Text</Button>
      <Button variant="text" color="primary">Primary</Button>
      <Button variant="text" color="secondary">Secondary</Button>
      <Button variant="text" color="success">Success</Button>
      <Button variant="text" color="error">Error</Button>
    </Stack>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Stack spacing={2} direction="row">
      <Button variant="contained" startIcon={<AddIcon />}>Add</Button>
      <Button variant="contained" startIcon={<EditIcon />}>Edit</Button>
      <Button variant="contained" startIcon={<SaveIcon />}>Save</Button>
      <Button variant="outlined" startIcon={<DeleteIcon />} color="error">Delete</Button>
      <Button variant="text" startIcon={<LogoutIcon />}>Logout</Button>
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack spacing={2} direction="row" alignItems="center">
      <Button variant="contained" size="small">Small</Button>
      <Button variant="contained" size="medium">Medium</Button>
      <Button variant="contained" size="large">Large</Button>
    </Stack>
  ),
};

export const States: Story = {
  render: () => (
    <Stack spacing={2} direction="row">
      <Button variant="contained">Normal</Button>
      <Button variant="contained" disabled>Disabled</Button>
      <Button variant="contained" color="primary">Primary</Button>
    </Stack>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <Box sx={{ width: 400 }}>
      <Stack spacing={2}>
        <Button variant="contained" fullWidth>Full Width Button</Button>
        <Button variant="outlined" fullWidth>Full Width Outlined</Button>
      </Stack>
    </Box>
  ),
};

export const LandingPageDownload: Story = {
  render: () => (
    <Stack spacing={2} direction="row">
      <Button
        variant="contained"
        size="large"
        startIcon={<DownloadIcon />}
        sx={{
          py: 1.5,
          px: 4,
          fontSize: '1.1rem',
          fontWeight: 600,
          borderRadius: 2,
          textTransform: 'none',
          boxShadow: 4,
          '&:hover': {
            boxShadow: 6,
          },
        }}
      >
        Download Mobile App
      </Button>
    </Stack>
  ),
};

export const LoginButton: Story = {
  render: () => (
    <Box sx={{ width: 400 }}>
      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        sx={{
          mt: 2,
          mb: 2,
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: 2,
        }}
      >
        Sign In
      </Button>
    </Box>
  ),
};

export const LoadingButton: Story = {
  render: () => (
    <Box sx={{ width: 400 }}>
      <Button
        fullWidth
        variant="contained"
        size="large"
        disabled
        sx={{
          mt: 2,
          mb: 2,
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, border: '2px solid', borderColor: 'inherit', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span>Signing in...</span>
        </Box>
      </Button>
    </Box>
  ),
};

