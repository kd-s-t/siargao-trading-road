import { Box, Typography } from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';

interface AuditLogsHeaderProps {
  total: number;
}

export function AuditLogsHeader({ total }: AuditLogsHeaderProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <AssessmentIcon sx={{ fontSize: 40, color: '#38b2ac' }} />
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Audit Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total: {total} logs
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

