import { Container, CircularProgress } from '@mui/material';
import AdminLayout from '@/components/AdminLayout';

export function DashboardLoading() {
  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    </AdminLayout>
  );
}


