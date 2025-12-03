'use client';

import { Box, Card, CardContent, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { User, UserAnalytics } from '@/lib/users';

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
      label: 'Total Earnings',
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
  ];

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
      {stats.map((stat, index) => (
        <Box
          key={index}
          sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}
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
                <Typography variant="h4">{stat.value}</Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
      ))}
    </Box>
  );
}

