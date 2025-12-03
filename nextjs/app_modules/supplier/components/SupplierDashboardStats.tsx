import { Box, Card, CardContent, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { UserAnalytics } from '@/lib/users';

interface SupplierDashboardStatsProps {
  analytics: UserAnalytics;
}

export function SupplierDashboardStats({ analytics }: SupplierDashboardStatsProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
      <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h3" color="primary">
                {analytics.total_orders}
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Box>

      <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Earnings
              </Typography>
              <Typography variant="h3" color="primary">
                ₱{analytics.total_earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Box>

      <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Products Registered
              </Typography>
              <Typography variant="h3" color="primary">
                {analytics.products_bought.length}
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </Box>
  );
}

