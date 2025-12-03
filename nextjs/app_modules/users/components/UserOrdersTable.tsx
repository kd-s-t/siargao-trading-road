'use client';

import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { User, UserAnalytics } from '@/lib/users';

interface UserOrdersTableProps {
  user: User;
  analytics: UserAnalytics;
}

export function UserOrdersTable({ user, analytics }: UserOrdersTableProps) {
  const router = useRouter();

  return (
    <Box sx={{ mt: 3 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              {user.role === 'supplier' && <TableCell>Store</TableCell>}
              {user.role === 'store' && <TableCell>Supplier</TableCell>}
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {analytics.orders.map((order, index) => (
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
                {user.role === 'supplier' && (
                  <TableCell>{order.store?.name || '-'}</TableCell>
                )}
                {user.role === 'store' && (
                  <TableCell>{order.supplier?.name || '-'}</TableCell>
                )}
                <TableCell>
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip label={order.status} size="small" />
                </TableCell>
                <TableCell>{order.order_items?.length || 0}</TableCell>
                <TableCell>
                  ₱{order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

