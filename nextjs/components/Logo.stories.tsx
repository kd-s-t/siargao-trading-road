import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@mui/material';
import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
}

const Logo = ({ width = 150, height = 60 }: LogoProps) => (
  <Image 
    src="/logo.png" 
    alt="Siargao Trading Road Logo" 
    width={width} 
    height={height} 
    style={{ height: 'auto', width }} 
  />
);

const meta: Meta<typeof Logo> = {
  title: 'Components/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Default: Story = {
  render: () => <Logo />,
};

export const Small: Story = {
  render: () => <Logo width={100} height={40} />,
};

export const Medium: Story = {
  render: () => <Logo width={200} height={80} />,
};

export const Large: Story = {
  render: () => <Logo width={300} height={120} />,
};

export const OnDarkBackground: Story = {
  render: () => (
    <Box sx={{ backgroundColor: '#38b2ac', p: 3, borderRadius: 2 }}>
      <Logo />
    </Box>
  ),
};

export const OnLightBackground: Story = {
  render: () => (
    <Box sx={{ backgroundColor: '#f5f5f5', p: 3, borderRadius: 2 }}>
      <Logo />
    </Box>
  ),
};

