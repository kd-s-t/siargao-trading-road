import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Surface,
  Button,
  Card,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Siargao Trading Road
          </Text>
          <Button mode="text" onPress={handleLogout}>
            Logout
          </Button>
        </View>
      </Surface>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Welcome, {user?.name}
            </Text>
            <Divider style={styles.divider} />
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Email:
              </Text>
              <Text variant="bodyMedium">{user?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Role:
              </Text>
              <Text variant="bodyMedium" style={styles.role}>
                {user?.role}
              </Text>
            </View>
            {user?.phone ? (
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>
                  Phone:
                </Text>
                <Text variant="bodyMedium">{user.phone}</Text>
              </View>
            ) : null}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  divider: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    opacity: 0.7,
  },
  role: {
    textTransform: 'capitalize',
    fontWeight: '600',
  },
});

