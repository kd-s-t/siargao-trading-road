'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
  Typography,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { User, productsService } from '@/lib/users';
import { authService } from '@/lib/auth';

interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  suppliers: User[];
}

export function AddProductDialog({ open, onClose, onSuccess, suppliers }: AddProductDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    stock_quantity: '',
    unit: '',
    category: '',
    image_url: '',
    supplier_id: '',
  });

  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        description: '',
        sku: '',
        price: '',
        stock_quantity: '',
        unit: '',
        category: '',
        image_url: '',
        supplier_id: '',
      });
      setSelectedFile(null);
      setImagePreview(null);
      setError('');
    }
  }, [open]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;

    setUploadingImage(true);
    setError('');

    try {
      const result = await authService.uploadImage(selectedFile, 'product');
      setFormData({ ...formData, image_url: result.url });
      setError('');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.sku || !formData.price || !formData.supplier_id) {
      setError('Please fill in all required fields (Name, SKU, Price, Supplier)');
      return;
    }

    if (selectedFile && !formData.image_url) {
      setError('Please upload the image first');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await productsService.createProduct({
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        unit: formData.unit,
        category: formData.category,
        image_url: formData.image_url || undefined,
        supplier_id: parseInt(formData.supplier_id),
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Product</DialogTitle>
      <DialogContent>
        {error && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#ffebee', borderRadius: 1 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Supplier *"
            select
            value={formData.supplier_id}
            onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
            fullWidth
            required
          >
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.id} value={supplier.id.toString()}>
                {supplier.name} ({supplier.email})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Product Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
          />

          <TextField
            label="SKU *"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            fullWidth
            required
          />

          <TextField
            label="Price *"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            fullWidth
            required
            inputProps={{ min: 0, step: 0.01 }}
          />

          <TextField
            label="Stock Quantity"
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
            fullWidth
            inputProps={{ min: 0 }}
          />

          <TextField
            label="Unit (kg, piece, box, etc.)"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            fullWidth
          />

          <TextField
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            fullWidth
          />

          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Product Image
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            {imagePreview ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={imagePreview}
                    variant="rounded"
                    sx={{ width: 100, height: 100 }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2">{selectedFile?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : ''}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleRemoveImage}
                    disabled={uploadingImage || loading}
                  >
                    Remove
                  </Button>
                </Box>
                {!formData.image_url && (
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    onClick={handleUploadImage}
                    disabled={uploadingImage || loading}
                    fullWidth
                  >
                    {uploadingImage ? <CircularProgress size={20} /> : 'Upload Image'}
                  </Button>
                )}
                {formData.image_url && (
                  <Typography variant="caption" color="success.main">
                    Image uploaded successfully
                  </Typography>
                )}
              </Box>
            ) : (
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                disabled={uploadingImage || loading}
              >
                Select Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </Button>
            )}
          </Box>

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Add Product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

