'use client';

import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Supplier } from '@/lib/suppliers';

interface SuppliersViewProps {
  suppliers: Supplier[];
  loading: boolean;
  onSupplierClick: (supplier: Supplier) => void;
}

export function SuppliersView({ suppliers, loading, onSupplierClick }: SuppliersViewProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (suppliers.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1" align="center">
            No suppliers available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {suppliers.map((supplier) => (
        <Card 
          key={supplier.id} 
          sx={{ overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => onSupplierClick(supplier)}
        >
          {supplier.banner_url && supplier.banner_url.trim() !== '' && (
            <CardMedia
              component="img"
              height="180"
              image={supplier.banner_url}
              alt={supplier.name}
            />
          )}
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {supplier.logo_url && supplier.logo_url.trim() !== '' ? (
                <Avatar
                  src={supplier.logo_url}
                  sx={{ width: 80, height: 80, mr: 2, border: '2px solid #e0e0e0' }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mr: 2,
                    border: '2px solid #e0e0e0',
                    bgcolor: '#1976d2',
                  }}
                >
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {supplier.name.charAt(0).toUpperCase()}
                  </Typography>
                </Avatar>
              )}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {supplier.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {supplier.email}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" sx={{ mb: 1.5, opacity: 0.8 }}>
              {supplier.description}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                Products Available:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                {supplier.product_count}
              </Typography>
            </Box>
            {supplier.phone && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                  Phone:
                </Typography>
                <Typography variant="body2">{supplier.phone}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

