import { Box, Card, CardContent, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { DashboardAnalytics } from '@/lib/users';

interface StatCardsProps {
  analytics: DashboardAnalytics;
}

export function StatCards({ analytics }: StatCardsProps) {
  const averageOrderValue = analytics.total_orders > 0 
    ? analytics.total_earnings / analytics.total_orders 
    : 0;

  const last7Days = analytics.daily_stats.slice(-7);
  const last7DaysTotal = last7Days.reduce((sum, stat) => sum + stat.orders, 0);
  const last7DaysEarnings = last7Days.reduce((sum, stat) => sum + stat.earnings, 0);

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total Users
                </Typography>
                <Typography variant="h4">
                  {analytics.total_users}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Suppliers
                </Typography>
                <Typography variant="h4">
                  {analytics.total_suppliers}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Stores
                </Typography>
                <Typography variant="h4">
                  {analytics.total_stores}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total Orders
                </Typography>
                <Typography variant="h4">
                  {analytics.total_orders}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total Transaction Volume
                </Typography>
                <Typography variant="h5" color="primary">
                  ₱{analytics.total_earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Average Order Value
                </Typography>
                <Typography variant="h5">
                  ₱{averageOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Last 7 Days Orders
                </Typography>
                <Typography variant="h5">
                  {last7DaysTotal}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ₱{last7DaysEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
      </Box>
    </>
  );
}

