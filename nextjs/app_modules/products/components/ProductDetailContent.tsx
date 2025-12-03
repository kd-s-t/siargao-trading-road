'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Box,
  Chip,
  Button,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { productsService, Product } from '@/lib/users';

export function ProductDetailContent() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirect = !authLoading && (!authUser || authUser.role !== 'admin');
    redirect && router.push('/login');
  }, [authUser, authLoading, router]);

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const productData = await productsService.getProduct(productId);
      setProduct(productData);
    } catch (error) {
      console.error('Failed to load product data:', error);
      router.push('/products');
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  useEffect(() => {
    authUser?.role === 'admin' && productId && loadProduct();
  }, [authUser, productId, loadProduct]);

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {(authLoading || loading) && (
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Container>
        )}
        {!authLoading && !loading && authUser && product && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => router.push('/products')}
                  sx={{ mb: 2 }}
                >
                  Back to Products
                </Button>
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ flex: { xs: '1', md: '2' } }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" component="h1" gutterBottom>
                        {product.name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip label={product.sku} size="small" variant="outlined" />
                        {product.category && (
                          <Chip label={product.category} size="small" color="primary" />
                        )}
                        <Chip
                          label={product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                          size="small"
                          color={product.stock_quantity > 0 ? 'success' : 'error'}
                        />
                      </Box>

                      {product.description && (
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                          {product.description}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Typography variant="caption" color="text.secondary">
                              Price
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                              ₱{product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Paper>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Typography variant="caption" color="text.secondary">
                              Stock Quantity
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                              {product.stock_quantity} {product.unit || ''}
                            </Typography>
                          </Paper>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                <Box sx={{ flex: { xs: '1', md: '1' } }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Product Information
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Product ID
                          </Typography>
                          <Typography variant="body1">{product.id}</Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            SKU
                          </Typography>
                          <Typography variant="body1">{product.sku}</Typography>
                        </Box>
                        
                        {product.unit && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Unit
                            </Typography>
                            <Typography variant="body1">{product.unit}</Typography>
                          </Box>
                        )}
                        
                        {product.category && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Category
                            </Typography>
                            <Typography variant="body1">{product.category}</Typography>
                          </Box>
                        )}
                        
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Supplier
                          </Typography>
                          <Typography variant="body1">
                            {product.supplier?.name || 'N/A'}
                          </Typography>
                          {product.supplier?.email && (
                            <Typography variant="caption" color="text.secondary">
                              {product.supplier.email}
                            </Typography>
                          )}
                        </Box>
                        
                        {product.created_at && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Created At
                            </Typography>
                            <Typography variant="body1">
                              {new Date(product.created_at).toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                        
                        {product.updated_at && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Updated At
                            </Typography>
                            <Typography variant="body1">
                              {new Date(product.updated_at).toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </motion.div>
          </>
        )}
      </Container>
    </AdminLayout>
  );
}

