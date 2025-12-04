import { Box, Pagination } from '@mui/material';

interface BugsPaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export function BugsPagination({ page, pages, onPageChange }: BugsPaginationProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
      <Pagination
        count={pages}
        page={page}
        onChange={(_, value) => onPageChange(value)}
        color="primary"
        showFirstButton
        showLastButton
      />
    </Box>
  );
}

