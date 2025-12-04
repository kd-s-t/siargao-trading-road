import { Box, Pagination } from '@mui/material';

interface AuditLogsPaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export function AuditLogsPagination({ page, pages, onPageChange }: AuditLogsPaginationProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
      <Pagination
        count={pages}
        page={page}
        onChange={(_, newPage) => onPageChange(newPage)}
        color="primary"
        showFirstButton
        showLastButton
      />
    </Box>
  );
}

