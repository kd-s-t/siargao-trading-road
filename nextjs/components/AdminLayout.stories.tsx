import type { Meta, StoryObj } from '@storybook/react';
import AdminLayout from './AdminLayout';
import { AuthProvider } from '@/contexts/AuthContext';

const meta: Meta<typeof AdminLayout> = {
  title: 'Components/AdminLayout',
  component: AdminLayout,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <AuthProvider>
        <div style={{ height: '100vh' }}>
          <Story />
        </div>
      </AuthProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AdminLayout>;

export const Default: Story = {
  args: {
    children: <div>Admin Content</div>,
  },
};

