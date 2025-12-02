import type { Meta, StoryObj } from '@storybook/react-native';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Contained: Story = {
  render: () => (
    <View style={styles.container}>
      <Button mode="contained" onPress={() => {}} style={styles.button}>
        Contained
      </Button>
      <Button mode="contained" buttonColor="#1976d2" onPress={() => {}} style={styles.button}>
        Primary
      </Button>
      <Button mode="contained" buttonColor="#388e3c" onPress={() => {}} style={styles.button}>
        Success
      </Button>
      <Button mode="contained" buttonColor="#d32f2f" onPress={() => {}} style={styles.button}>
        Error
      </Button>
    </View>
  ),
};

export const Outlined: Story = {
  render: () => (
    <View style={styles.container}>
      <Button mode="outlined" onPress={() => {}} style={styles.button}>
        Outlined
      </Button>
      <Button mode="outlined" textColor="#1976d2" onPress={() => {}} style={styles.button}>
        Primary
      </Button>
      <Button mode="outlined" textColor="#388e3c" onPress={() => {}} style={styles.button}>
        Success
      </Button>
      <Button mode="outlined" textColor="#d32f2f" onPress={() => {}} style={styles.button}>
        Error
      </Button>
    </View>
  ),
};

export const Text: Story = {
  render: () => (
    <View style={styles.container}>
      <Button mode="text" onPress={() => {}} style={styles.button}>
        Text
      </Button>
      <Button mode="text" textColor="#1976d2" onPress={() => {}} style={styles.button}>
        Primary
      </Button>
      <Button mode="text" textColor="#388e3c" onPress={() => {}} style={styles.button}>
        Success
      </Button>
      <Button mode="text" textColor="#d32f2f" onPress={() => {}} style={styles.button}>
        Error
      </Button>
    </View>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <View style={styles.container}>
      <Button
        mode="contained"
        icon="plus"
        onPress={() => {}}
        style={styles.button}
      >
        Add
      </Button>
      <Button
        mode="contained"
        icon="pencil"
        onPress={() => {}}
        style={styles.button}
      >
        Edit
      </Button>
      <Button
        mode="contained"
        icon="content-save"
        onPress={() => {}}
        style={styles.button}
      >
        Save
      </Button>
      <Button
        mode="outlined"
        icon="delete"
        textColor="#d32f2f"
        onPress={() => {}}
        style={styles.button}
      >
        Delete
      </Button>
      <Button
        mode="text"
        icon="logout"
        onPress={() => {}}
        style={styles.button}
      >
        Logout
      </Button>
    </View>
  ),
};

export const Sizes: Story = {
  render: () => (
    <View style={styles.container}>
      <Button mode="contained" compact onPress={() => {}} style={styles.button}>
        Compact
      </Button>
      <Button mode="contained" onPress={() => {}} style={styles.button}>
        Default
      </Button>
    </View>
  ),
};

export const States: Story = {
  render: () => (
    <View style={styles.container}>
      <Button mode="contained" onPress={() => {}} style={styles.button}>
        Normal
      </Button>
      <Button mode="contained" disabled onPress={() => {}} style={styles.button}>
        Disabled
      </Button>
      <Button mode="contained" loading onPress={() => {}} style={styles.button}>
        Loading
      </Button>
    </View>
  ),
};

export const LoginButton: Story = {
  render: () => (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={() => {}}
        style={styles.fullWidthButton}
        contentStyle={styles.buttonContent}
      >
        Sign In
      </Button>
      <Button
        mode="contained"
        loading
        onPress={() => {}}
        style={styles.fullWidthButton}
        contentStyle={styles.buttonContent}
      >
        Signing in...
      </Button>
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  button: {
    marginVertical: 4,
  },
  fullWidthButton: {
    width: '100%',
    marginVertical: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

