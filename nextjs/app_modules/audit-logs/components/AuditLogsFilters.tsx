import { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Button,
} from '@mui/material';
import { FilterList as FilterIcon, Clear as ClearIcon } from '@mui/icons-material';

interface AuditLogFilters {
  role?: string;
  user_id?: string;
  endpoint?: string;
}

interface AuditLogsFiltersProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
}

export function AuditLogsFilters({ filters, onFiltersChange }: AuditLogsFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleClear = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FilterIcon />
        <Box component="span" sx={{ fontWeight: 'bold' }}>Filters</Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 16px)' } }}>
            <TextField
              fullWidth
              select
              label="Role"
              value={localFilters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="supplier">Supplier</MenuItem>
              <MenuItem value="store">Store</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 16px)' } }}>
            <TextField
              fullWidth
              label="User ID"
              value={localFilters.user_id || ''}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              size="small"
              type="number"
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 16px)' } }}>
            <TextField
              fullWidth
              label="Endpoint"
              value={localFilters.endpoint || ''}
              onChange={(e) => handleFilterChange('endpoint', e.target.value)}
              size="small"
              placeholder="e.g., /api/products"
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleApply}
            sx={{ backgroundColor: '#38b2ac', '&:hover': { backgroundColor: '#2d9d96' } }}
          >
            Apply Filters
          </Button>
          <Button
            variant="outlined"
            onClick={handleClear}
            startIcon={<ClearIcon />}
          >
            Clear
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
