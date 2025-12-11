import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
  ActivityIndicator,
  Menu,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const THEME_COLORS = {
  primary: {
    main: '#1a3a5f',
    light: '#2c5282',
    dark: '#0f2538',
  },
  secondary: {
    main: '#38b2ac',
    light: '#4fd1c7',
    dark: '#2c9aa0',
  },
};

const validatePhilippineMobile = (mobile: string): boolean => {
  const cleaned = mobile.replace(/\D/g, '');
  if (cleaned.startsWith('63')) {
    return cleaned.length === 12 && cleaned.substring(2, 3) === '9';
  }
  if (cleaned.startsWith('0')) {
    return cleaned.length === 11 && cleaned.substring(1, 2) === '9';
  }
  return cleaned.length === 10 && cleaned.startsWith('9');
};

function AnimatedBackground() {
  const animatedValue = useSharedValue(0);

  React.useEffect(() => {
    animatedValue.value = withRepeat(
      withTiming(1, { duration: 4000 }),
      -1,
      true
    );
  }, []);

  const gradient1Style = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedValue.value,
      [0, 0.5, 1],
      [1, 0, 1],
      'clamp'
    );
    return { opacity };
  }, []);

  const gradient2Style = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedValue.value,
      [0, 0.5, 1],
      [0, 1, 0],
      'clamp'
    );
    return { opacity };
  }, []);

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, gradient1Style]} pointerEvents="none">
        <LinearGradient
          colors={[
            THEME_COLORS.primary.main,
            THEME_COLORS.secondary.main,
            THEME_COLORS.primary.light,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, gradient2Style]} pointerEvents="none">
        <LinearGradient
          colors={[
            THEME_COLORS.secondary.main,
            THEME_COLORS.primary.light,
            THEME_COLORS.secondary.light,
          ]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </>
  );
}

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'supplier' | 'store'>('supplier');
  const [roleMenuVisible, setRoleMenuVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigation = useNavigation();


  const handleSubmit = async () => {
    if (!name || !email || !mobile || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!validatePhilippineMobile(mobile)) {
      setError('Please enter a valid Philippine mobile number (e.g., 9606075119)');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register(email, password, name, mobile, role);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <AnimatedBackground />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/splash.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Surface style={styles.surface} elevation={3}>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Create a new account
          </Text>

          {error ? (
            <Surface style={styles.errorContainer} elevation={1}>
              <Text style={styles.errorText}>{error}</Text>
            </Surface>
          ) : null}

          <TextInput
            label="Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            autoCapitalize="words"
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            label="Email *"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
            disabled={loading}
          />

          <TextInput
            label="Mobile *"
            value={mobile}
            onChangeText={setMobile}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            disabled={loading}
          />
          <Text variant="bodySmall" style={styles.helperText}>
            Philippine mobile number (e.g., 9606075119)
          </Text>

          <TextInput
            label="Password *"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            style={styles.input}
            disabled={loading}
          />
          <Text variant="bodySmall" style={styles.helperText}>
            Must be at least 6 characters
          </Text>

          <Menu
            visible={roleMenuVisible}
            onDismiss={() => setRoleMenuVisible(false)}
            anchor={
              <TextInput
                label="I am a *"
                value={role === 'supplier' ? "I'm a Supplier" : "I'm a Store Owner"}
                mode="outlined"
                style={styles.input}
                disabled={loading}
                right={
                  <TextInput.Icon
                    icon="chevron-down"
                    onPress={() => setRoleMenuVisible(true)}
                  />
                }
                editable={false}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setRole('supplier');
                setRoleMenuVisible(false);
              }}
              title="I'm a Supplier"
            />
            <Menu.Item
              onPress={() => {
                setRole('store');
                setRoleMenuVisible(false);
              }}
              title="I'm a Store Owner"
            />
          </Menu>

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={[styles.button, { backgroundColor: THEME_COLORS.primary.main }]}
            disabled={loading}
            loading={loading}
            buttonColor={THEME_COLORS.primary.main}
          >
            Register
          </Button>

          <View style={styles.switchContainer}>
            <Text variant="bodyMedium" style={styles.switchText}>
              Already have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={() => (navigation as any).navigate('Login')}
              compact
              textColor={THEME_COLORS.primary.main}
            >
              Sign in
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 0,
  },
  surface: {
    padding: 24,
    borderRadius: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 17,
  },
  logo: {
    width: 320,
    height: 128,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  errorContainer: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 4,
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  switchText: {
    opacity: 0.7,
  },
  helperText: {
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 12,
    opacity: 0.6,
  },
});

