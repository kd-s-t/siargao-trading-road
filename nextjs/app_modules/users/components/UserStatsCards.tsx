'use client';

import { Box, Card, CardContent, Typography, Rating } from '@mui/material';
import { motion } from 'framer-motion';
import { User, UserAnalytics } from '@/lib/users';
import { Star as StarIcon } from '@mui/icons-material';

interface UserStatsCardsProps {
  user: User;
  analytics: UserAnalytics;
}

export function UserStatsCards({ user, analytics }: UserStatsCardsProps) {
  const stats = [
    {
      label: 'Total Orders',
      value: analytics.total_orders,
      delay: 0,
    },
    {
      label: user.role === 'supplier' ? 'Total Earnings' : 'Total Spend',
      value: `₱${analytics.total_earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      delay: 0.1,
    },
    {
      label: user.role === 'supplier' ? 'Total Stock' : 'Products Bought',
      value: analytics.total_products_bought,
      delay: 0.2,
    },
    {
      label: user.role === 'supplier' ? 'Products Registered' : 'Unique Products',
      value: analytics.products_bought.length,
      delay: 0.3,
    },
    {
      label: 'Average Rating',
      value: analytics.average_rating ?? 0,
      rating: true,
      ratingCount: analytics.rating_count ?? 0,
      delay: 0.4,
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
      {stats.map((stat, index) => (
        <Box
          key={index}
          sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: stat.rating ? 'calc(25% - 18px)' : 'calc(25% - 18px)' } }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: stat.delay }}
          >
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  {stat.label}
                </Typography>
                {stat.rating ? (
                  <Box>
                    {stat.ratingCount > 0 ? (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Rating
                            value={stat.value as number}
                            precision={0.1}
                            readOnly
                            size="large"
                            emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                          />
                          <Typography variant="h5" component="span">
                            {(stat.value as number).toFixed(1)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          ({stat.ratingCount} {stat.ratingCount === 1 ? 'rating' : 'ratings'})
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        No ratings yet
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="h4">{stat.value}</Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Box>
      ))}
    </Box>
  );
}

