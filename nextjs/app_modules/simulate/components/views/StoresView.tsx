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
  Chip,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarTodayIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
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
      {stores.map((store) => {
        const isClosed = store.is_open === false;
        return (
        <Card 
          key={store.id} 
          sx={{ 
            overflow: 'hidden',
            opacity: isClosed ? 0.6 : 1,
            position: 'relative',
            '&::before': isClosed ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0, 0, 0, 0.05)',
              zIndex: 1,
              pointerEvents: 'none',
            } : {},
          }}
        >
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
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {store.name}
                  </Typography>
                  {store.is_open !== undefined && (
                    <Chip
                      label={store.is_open ? 'Open' : 'Closed'}
                      size="small"
                      color={store.is_open ? 'success' : 'error'}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                  Phone:
                </Typography>
                <Typography variant="body2">{store.phone}</Typography>
              </Box>
            )}
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: isClosed ? 'grey.100' : 'primary.50',
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: isClosed ? 'grey.300' : 'primary.200',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTimeIcon sx={{ fontSize: 16, color: isClosed ? 'grey.500' : 'primary.main', mr: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: isClosed ? 'grey.600' : 'primary.main' }}>
                  Available Hours
                </Typography>
              </Box>
              {store.working_days ? (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <CalendarTodayIcon sx={{ fontSize: 12, color: 'text.secondary', mr: 0.5 }} />
                  <Typography variant="caption" sx={{ color: isClosed ? 'text.disabled' : 'text.primary' }}>
                    {store.working_days}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                  No working days set
                </Typography>
              )}
              {store.opening_time && store.closing_time ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ fontSize: 12, color: 'text.secondary', mr: 0.5 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: isClosed ? 'text.disabled' : 'text.primary' }}>
                    {store.opening_time} - {store.closing_time}
                  </Typography>
                </Box>
              ) : store.opening_time ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ fontSize: 12, color: 'text.secondary', mr: 0.5 }} />
                  <Typography variant="caption" sx={{ color: isClosed ? 'text.disabled' : 'text.primary' }}>
                    Opens: {store.opening_time}
                  </Typography>
                </Box>
              ) : store.closing_time ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon sx={{ fontSize: 12, color: 'text.secondary', mr: 0.5 }} />
                  <Typography variant="caption" sx={{ color: isClosed ? 'text.disabled' : 'text.primary' }}>
                    Closes: {store.closing_time}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                  No time range set
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
        );
      })}
    </Box>
  );
}

