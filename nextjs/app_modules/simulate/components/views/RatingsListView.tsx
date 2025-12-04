'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Divider,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { User } from '@/lib/auth';
import { OrderRating } from '@/lib/users';
import { mobileOrderService } from '../../services/mobileApi';

interface RatingsListViewProps {
  mobileUser: User;
  onBack: () => void;
}

export function RatingsListView({ mobileUser, onBack }: RatingsListViewProps) {
  const [ratings, setRatings] = useState<OrderRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRatings = async () => {
      try {
        setLoading(true);
        const data = await mobileOrderService.getMyRatings();
        setRatings(data);
      } catch (error) {
        console.error('Failed to load ratings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRatings();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={onBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Ratings
        </Typography>
      </Box>

      {ratings.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" align="center" color="text.secondary">
              No ratings yet
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {ratings.map((rating, index) => (
            <Card key={rating.id}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {rating.rater?.name || 'Unknown'}
                  </Typography>
                  <Rating
                    value={rating.rating}
                    readOnly
                    size="small"
                    emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {rating.rating}/5
                  </Typography>
                </Box>
                {rating.comment && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                    &quot;{rating.comment}&quot;
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Order #{rating.order_id} • {new Date(rating.created_at).toLocaleDateString()}
                </Typography>
                {index < ratings.length - 1 && <Divider sx={{ mt: 2 }} />}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

