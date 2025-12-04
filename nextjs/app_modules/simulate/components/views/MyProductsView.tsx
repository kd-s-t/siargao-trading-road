'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  CircularProgress,
  Chip,
  Button,
  IconButton,
  CardActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Product } from '@/lib/users';
import { ProductFormDialog } from './ProductFormDialog';
import { mobileProductService } from '../../services/mobileApi';

interface MyProductsViewProps {
  products: Product[];
  loading: boolean;
  onRefresh: () => void;
  onError: (message: string) => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function MyProductsView({
  products,
  loading,
  onRefresh,
  onError,
  onToast,
}: MyProductsViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleAddClick = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDeleteClick = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setDeleting(productId);
    try {
      await mobileProductService.deleteProduct(productId);
      onToast('Product deleted successfully', 'success');
      onRefresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      onError(err.response?.data?.error || 'Failed to delete product');
      onToast(err.response?.data?.error || 'Failed to delete product', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleDialogSuccess = () => {
    onRefresh();
    onToast(editingProduct ? 'Product updated successfully' : 'Product created successfully', 'success');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
        >
          Add Product
        </Button>
      </Box>

      {products.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No products yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            Add products to start selling
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
          >
            Add Your First Product
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {products.map((product) => (
            <Box key={product.id}>
              <Card>
                {product.image_url && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.image_url}
                    alt={product.name}
                    sx={{ objectFit: 'cover' }}
                  />
                )}
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                      {product.name}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                      ₱{product.price.toFixed(2)}
                    </Typography>
                  </Box>
                  {product.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {product.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    <Chip label={`SKU: ${product.sku}`} size="small" variant="outlined" />
                    {product.category && (
                      <Chip label={product.category} size="small" color="primary" variant="outlined" />
                    )}
                    <Chip 
                      label={`Stock: ${product.stock_quantity} ${product.unit || ''}`} 
                      size="small" 
                      color={product.stock_quantity > 0 ? 'success' : 'error'}
                    />
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditClick(product)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteClick(product.id)}
                    disabled={deleting === product.id}
                    size="small"
                  >
                    {deleting === product.id ? <CircularProgress size={20} /> : <DeleteIcon />}
                  </IconButton>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      <ProductFormDialog
        open={dialogOpen}
        product={editingProduct}
        onClose={() => {
          setDialogOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={handleDialogSuccess}
        onError={onError}
      />
    </Box>
  );
}

