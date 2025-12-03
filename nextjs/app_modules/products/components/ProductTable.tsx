import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Product } from '@/lib/users';
import { PRODUCT_DESCRIPTION_MAX_LENGTH } from '../constants';

interface ProductTableProps {
  products: Product[];
  onDelete: (id: number) => void;
}

export function ProductTable({ products, onDelete }: ProductTableProps) {
  const router = useRouter();

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Image</TableCell>
            <TableCell>Product Name</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell>Supplier</TableCell>
            <TableCell>Category</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">Stock</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product, index) => (
            <TableRow
              key={product.id}
              component={motion.tr}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              hover
            >
              <TableCell>{product.id}</TableCell>
              <TableCell>
                {product.image_url && product.image_url.trim() !== '' ? (
                  <Avatar
                    src={product.image_url}
                    alt={product.name}
                    variant="rounded"
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: '#e0e0e0',
                    }}
                  />
                ) : (
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: '#e0e0e0',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>
                      No Image
                    </Typography>
                  </Avatar>
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {product.name}
                </Typography>
                {product.description && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {product.description.length > PRODUCT_DESCRIPTION_MAX_LENGTH
                      ? `${product.description.substring(0, PRODUCT_DESCRIPTION_MAX_LENGTH)}...`
                      : product.description}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Chip label={product.sku} size="small" variant="outlined" />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {product.supplier?.name || 'N/A'}
                </Typography>
                {product.supplier?.email && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {product.supplier.email}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                {product.category ? (
                  <Chip label={product.category} size="small" />
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight="medium">
                  ₱{product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Chip
                  label={product.stock_quantity}
                  size="small"
                  color={product.stock_quantity > 0 ? 'success' : 'error'}
                />
              </TableCell>
              <TableCell>{product.unit || '-'}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Edit Product">
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/products/${product.id}`)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Product">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDelete(product.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

