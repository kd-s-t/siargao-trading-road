'use client';

import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { User, UserAnalytics } from '@/lib/users';

interface UserProductsTableProps {
  user: User;
  analytics: UserAnalytics;
}

export function UserProductsTable({ user, analytics }: UserProductsTableProps) {
  return (
    <Box sx={{ mt: 3 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {user.role === 'supplier' ? (
                <>
                  <TableCell>Product Name</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell>Unit</TableCell>
                </>
              ) : (
                <>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Total Spent</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {analytics.products_bought.map((product, index) => (
              <TableRow
                key={product.product_id}
                component={motion.tr}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                {user.role === 'supplier' ? (
                  <>
                    <TableCell>{product.product_name}</TableCell>
                    <TableCell>
                      <Chip label={product.sku || '-'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {product.category ? (
                        <Chip label={product.category} size="small" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      ₱{(product.price ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={product.stock ?? 0}
                        size="small"
                        color={(product.stock ?? 0) > 0 ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>{product.unit || '-'}</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{product.product_name}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>
                      ₱{product.total_spent?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

