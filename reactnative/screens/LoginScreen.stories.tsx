import type { Meta, StoryObj } from '@storybook/react-native';
import LoginScreen from './LoginScreen';

const meta: Meta<typeof LoginScreen> = {
  title: 'Screens/LoginScreen',
  component: LoginScreen,
};

export default meta;
type Story = StoryObj<typeof LoginScreen>;

export const Default: Story = {};

