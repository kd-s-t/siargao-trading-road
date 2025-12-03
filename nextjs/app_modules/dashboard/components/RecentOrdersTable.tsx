import { useRouter } from 'next/navigation';
import {
  Paper,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import { DashboardAnalytics } from '@/lib/users';

interface RecentOrdersTableProps {
  analytics: DashboardAnalytics;
}

export function RecentOrdersTable({ analytics }: RecentOrdersTableProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'in_transit':
        return 'info';
      case 'preparing':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.1 }}
    >
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Recent Orders
          </Typography>
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer' }}
            onClick={() => router.push('/orders')}
          >
            View All
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Store</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytics.recent_orders.slice(0, 10).map((order, index) => (
                <TableRow
                  key={order.id}
                  component={motion.tr}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.store?.name || '-'}</TableCell>
                  <TableCell>{order.supplier?.name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status.replace('_', ' ')}
                      size="small"
                      color={getStatusColor(order.status)}
                    />
                  </TableCell>
                  <TableCell>{order.order_items?.length || 0}</TableCell>
                  <TableCell>₱{order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="primary"
                      sx={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/orders/${order.id}`);
                      }}
                    >
                      View Details
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {analytics.recent_orders.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No orders found
            </Typography>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
}

