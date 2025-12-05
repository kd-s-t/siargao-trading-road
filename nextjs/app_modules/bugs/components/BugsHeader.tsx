import { Typography, Box } from '@mui/material';

interface BugsHeaderProps {
  total: number;
}

export function BugsHeader({ total }: BugsHeaderProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Bug Reports
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Total: {total} bug{total !== 1 ? 's' : ''}
      </Typography>
    </Box>
  );
}

