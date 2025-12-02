import type { Meta, StoryObj } from '@storybook/react-native';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';

interface LogoProps {
  size?: number;
}

const Logo = ({ size = 60 }: LogoProps) => (
  <View style={[styles.logoPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text variant="headlineLarge" style={styles.logoText}>
      W
    </Text>
  </View>
);

const meta: Meta<typeof Logo> = {
  title: 'Components/Logo',
  component: Logo,
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Default: Story = {
  render: () => (
    <View style={styles.container}>
      <Logo />
    </View>
  ),
};

export const Small: Story = {
  render: () => (
    <View style={styles.container}>
      <Logo size={40} />
    </View>
  ),
};

export const Medium: Story = {
  render: () => (
    <View style={styles.container}>
      <Logo size={80} />
    </View>
  ),
};

export const Large: Story = {
  render: () => (
    <View style={styles.container}>
      <Logo size={120} />
    </View>
  ),
};

export const OnDarkBackground: Story = {
  render: () => (
    <View style={styles.darkContainer}>
      <Logo />
    </View>
  ),
};

export const OnLightBackground: Story = {
  render: () => (
    <View style={styles.lightContainer}>
      <Logo />
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38b2ac',
  },
  lightContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  logoPlaceholder: {
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

