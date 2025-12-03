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
import { Store } from '@/lib/stores';

interface StoresViewProps {
  stores: Store[];
  loading: boolean;
}

export function StoresView({ stores, loading }: StoresViewProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (stores.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1" align="center">
            No stores available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {stores.map((store) => (
        <Card key={store.id} sx={{ overflow: 'hidden' }}>
          {store.banner_url && store.banner_url.trim() !== '' && (
            <CardMedia
              component="img"
              height="180"
              image={store.banner_url}
              alt={store.name}
            />
          )}
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {store.logo_url && store.logo_url.trim() !== '' ? (
                <Avatar
                  src={store.logo_url}
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
                    {store.name.charAt(0).toUpperCase()}
                  </Typography>
                </Avatar>
              )}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {store.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {store.email}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" sx={{ mb: 1.5, opacity: 0.8 }}>
              {store.description}
            </Typography>
            {store.phone && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                  Phone:
                </Typography>
                <Typography variant="body2">{store.phone}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

