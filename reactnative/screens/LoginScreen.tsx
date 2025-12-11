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

function AnimatedBackground() {
  const animatedValue = useSharedValue(0);
  const shineValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withRepeat(
      withTiming(1, { duration: 4000 }),
      -1,
      true
    );
    shineValue.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      false
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
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
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
    </View>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigation = useNavigation();


  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* <AnimatedBackground /> */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={[THEME_COLORS.primary.main, THEME_COLORS.secondary.main]}
          style={StyleSheet.absoluteFill}
        />
      </View>
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
            Sign in to continue
          </Text>

          {error ? (
            <Surface style={styles.errorContainer} elevation={1}>
              <Text style={styles.errorText}>{error}</Text>
            </Surface>
          ) : null}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
            editable={!loading}
            pointerEvents="auto"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            style={styles.input}
            editable={!loading}
            pointerEvents="auto"
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={[styles.button, { backgroundColor: THEME_COLORS.primary.main }]}
              disabled={loading}
              loading={loading}
              buttonColor={THEME_COLORS.primary.main}
            >
              Sign In
            </Button>
          </View>

          <View style={styles.switchContainer}>
            <Text variant="bodyMedium" style={styles.switchText}>
              Don't have an account?{' '}
            </Text>
            <Button
              mode="text"
              onPress={() => (navigation as any).navigate('Register')}
              compact
              textColor={THEME_COLORS.primary.main}
            >
              Register
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
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 20,
  },
  surface: {
    padding: 24,
    borderRadius: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 32,
  },
  logo: {
    width: 320,
    height: 128,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
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
  buttonContainer: {
    marginTop: 8,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 4,
  },
  button: {
    paddingVertical: 4,
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    height: '100%',
  },
  shineGradient: {
    flex: 1,
    width: '100%',
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
});

