'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import { Product } from '@/lib/users';
import { mobileProductService, mobileAuthService } from '../../services/mobileApi';

interface ProductFormDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function ProductFormDialog({
  open,
  product,
  onClose,
  onSuccess,
  onError,
}: ProductFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    stock_quantity: '',
    unit: '',
    category: '',
    image_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        price: product.price?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '',
        unit: product.unit || '',
        category: product.category || '',
        image_url: product.image_url || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        sku: '',
        price: '',
        stock_quantity: '',
        unit: '',
        category: '',
        image_url: '',
      });
    }
  }, [product, open]);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const result = await mobileAuthService.uploadImage(file, 'product');
      setFormData({ ...formData, image_url: result.url });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      onError(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.sku || !formData.price) {
      onError('Please fill in all required fields');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      onError('Price must be a valid number >= 0');
      return;
    }

    const stockQuantity = formData.stock_quantity ? parseInt(formData.stock_quantity, 10) : 0;
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      onError('Stock quantity must be a valid number >= 0');
      return;
    }

    setSaving(true);
    try {
      if (product) {
        await mobileProductService.updateProduct(product.id, {
          name: formData.name,
          description: formData.description || undefined,
          sku: formData.sku,
          price,
          stock_quantity: stockQuantity,
          unit: formData.unit || undefined,
          category: formData.category || undefined,
          image_url: formData.image_url || undefined,
        });
      } else {
        await mobileProductService.createProduct({
          name: formData.name,
          description: formData.description || undefined,
          sku: formData.sku,
          price,
          stock_quantity: stockQuantity,
          unit: formData.unit || undefined,
          category: formData.category || undefined,
          image_url: formData.image_url || undefined,
        });
      }
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      onError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            fullWidth
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={saving}
          />
          <TextField
            fullWidth
            label="SKU *"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            required
            disabled={saving}
          />
          <TextField
            fullWidth
            label="Price *"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
            disabled={saving}
            inputProps={{ min: 0, step: 0.01 }}
          />
          <TextField
            fullWidth
            label="Stock Quantity"
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
            disabled={saving}
            inputProps={{ min: 0 }}
          />
          <TextField
            fullWidth
            label="Unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            disabled={saving}
            placeholder="e.g., kg, pcs, box"
          />
          <TextField
            fullWidth
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            disabled={saving}
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            disabled={saving}
          />
          <Box>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              id="product-image-upload"
              onChange={handleImageSelect}
              disabled={uploading || saving}
            />
            <label htmlFor="product-image-upload">
              <Button
                variant="outlined"
                component="span"
                disabled={uploading || saving}
                fullWidth
              >
                {uploading ? <CircularProgress size={20} /> : formData.image_url ? 'Change Image' : 'Upload Image'}
              </Button>
            </label>
            {formData.image_url && (
              <Box sx={{ mt: 1 }}>
                <img
                  src={formData.image_url}
                  alt="Product"
                  style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 4 }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>
          {saving ? <CircularProgress size={20} /> : product ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

