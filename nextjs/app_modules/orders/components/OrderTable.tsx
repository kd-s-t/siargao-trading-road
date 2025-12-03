import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Order } from '@/lib/users';
import { getStatusColor } from '../constants';

interface OrderTableProps {
  orders: Order[];
}

export function OrderTable({ orders }: OrderTableProps) {
  const router = useRouter();

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Store</TableCell>
            <TableCell>Supplier</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Total Amount</TableCell>
            <TableCell>Items</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((o, index) => (
            <TableRow
              key={o.id}
              component={motion.tr}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              hover
              sx={{ cursor: 'pointer' }}
              onClick={() => router.push(`/orders/${o.id}`)}
            >
              <TableCell>{o.id}</TableCell>
              <TableCell>{o.store?.name || '-'}</TableCell>
              <TableCell>{o.supplier?.name || '-'}</TableCell>
              <TableCell>
                <Chip
                  label={o.status}
                  color={getStatusColor(o.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>₱{o.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell>{o.order_items?.length || 0}</TableCell>
              <TableCell>
                {new Date(o.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/orders/${o.id}`);
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
  );
}

