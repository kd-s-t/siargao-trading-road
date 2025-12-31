'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Paper, CircularProgress, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { productsService } from '@/lib/users';
import { useProducts, useProductFilters } from '@/app_modules/products/hooks';
import { ProductHeader } from './ProductHeader';
import { ProductFilters } from './ProductFilters';
import { ProductTable } from './ProductTable';
import { AddProductDialog } from './AddProductDialog';
import { BulkImportDialog } from './BulkImportDialog';

export function ProductsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { products, suppliers, loading, loadData } = useProducts();
  const { filters, setFilters, filteredProducts } = useProductFilters(products);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);

  useEffect(() => {
    const redirect = !authLoading && (!user || user.role !== 'admin');
    if (redirect) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await productsService.deleteProduct(id);
      loadData();
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category).filter((c): c is string => Boolean(c))));

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {(authLoading || loading) && (
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress />
          </Container>
        )}
        {!authLoading && !loading && user && (
          <>
            <ProductHeader
              onAddClick={() => setAddDialogOpen(true)}
              onBulkImportClick={() => setBulkImportDialogOpen(true)}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Paper sx={{ p: 3, mt: 2 }}>
                <ProductFilters
                  filters={filters}
                  suppliers={suppliers}
                  categories={categories}
                  onFiltersChange={setFilters}
                />

                <ProductTable products={filteredProducts} onDelete={handleDelete} />

                {filteredProducts.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      No products found
                    </Typography>
                  </Box>
                )}
              </Paper>
            </motion.div>

            <AddProductDialog
              open={addDialogOpen}
              onClose={() => setAddDialogOpen(false)}
              onSuccess={loadData}
              suppliers={suppliers}
            />

            <BulkImportDialog
              open={bulkImportDialogOpen}
              onClose={() => setBulkImportDialogOpen(false)}
              onSuccess={loadData}
              suppliers={suppliers}
            />
          </>
        )}
      </Container>
    </AdminLayout>
  );
}

