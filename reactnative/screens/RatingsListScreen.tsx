import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Surface,
  Card,
  Divider,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ratingService, OrderRating } from '../lib/ratings';

export default function RatingsListScreen() {
  const navigation = useNavigation();
  const [ratings, setRatings] = useState<OrderRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const data = await ratingService.getMyRatings();
      setRatings(data);
    } catch (error: any) {
      console.error('Failed to load ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Loading ratings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Ratings
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </Surface>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {ratings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No ratings yet
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.ratingsList}>
            {ratings.map((rating, index) => (
              <Card key={rating.id} style={styles.ratingCard}>
                <Card.Content>
                  <View style={styles.ratingHeader}>
                    <Text variant="bodyMedium" style={styles.raterName}>
                      {rating.rater?.name || 'Unknown'}
                    </Text>
                    <View style={styles.ratingStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <MaterialCommunityIcons
                          key={star}
                          name={star <= rating.rating ? 'star' : 'star-outline'}
                          size={20}
                          color="#FFD700"
                        />
                      ))}
                      <Text variant="bodySmall" style={styles.ratingValue}>
                        {rating.rating}/5
                      </Text>
                    </View>
                  </View>
                  {rating.comment && (
                    <Text variant="bodySmall" style={styles.ratingComment}>
                      &quot;{rating.comment}&quot;
                    </Text>
                  )}
                  <Text variant="labelSmall" style={styles.ratingDate}>
                    Order #{rating.order_id} • {new Date(rating.created_at).toLocaleDateString()}
                  </Text>
                  {index < ratings.length - 1 && <Divider style={styles.ratingDivider} />}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    margin: 0,
    marginRight: 8,
  },
  headerSpacer: {
    width: 48,
  },
  headerTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  ratingsList: {
    gap: 16,
  },
  ratingCard: {
    marginBottom: 8,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  raterName: {
    fontWeight: '600',
    flex: 1,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    marginLeft: 4,
    fontWeight: '600',
  },
  ratingComment: {
    marginTop: 8,
    marginBottom: 8,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  ratingDate: {
    marginTop: 4,
    opacity: 0.6,
  },
  ratingDivider: {
    marginTop: 16,
  },
});

