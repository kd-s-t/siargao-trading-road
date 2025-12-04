import { Box, TextField, MenuItem } from '@mui/material';

interface BugsFiltersProps {
  filters: {
    status?: string;
    platform?: string;
  };
  onFiltersChange: (filters: { status?: string; platform?: string }) => void;
}

export function BugsFilters({ filters, onFiltersChange }: BugsFiltersProps) {
  return (
    <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            select
            fullWidth
            label="Status"
            value={filters.status ?? ''}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value || undefined })}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="investigating">Investigating</MenuItem>
            <MenuItem value="fixed">Fixed</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </TextField>
      <TextField
        select
        fullWidth
        label="Platform"
        value={filters.platform ?? ''}
        onChange={(e) => onFiltersChange({ ...filters, platform: e.target.value || undefined })}
        size="small"
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="ios">iOS</MenuItem>
        <MenuItem value="android">Android</MenuItem>
        <MenuItem value="web">Web</MenuItem>
      </TextField>
    </Box>
  );
}

