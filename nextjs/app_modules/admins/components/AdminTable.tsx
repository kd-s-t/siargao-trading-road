import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { User } from '@/lib/users';

interface AdminTableProps {
  admins: User[];
}

function getLevelColor(level?: number): 'error' | 'warning' | 'default' {
  if (!level) return 'default';
  switch (level) {
    case 1:
      return 'error';
    case 2:
      return 'warning';
    case 3:
      return 'default';
    default:
      return 'default';
  }
}

export function AdminTable({ admins }: AdminTableProps) {
  const router = useRouter();

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Admin Level</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {admins.map((a, index) => (
            <TableRow
              key={a.id}
              component={motion.tr}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              hover
              sx={{ cursor: 'pointer' }}
              onClick={() => router.push(`/users/${a.id}`)}
            >
              <TableCell>{a.id}</TableCell>
              <TableCell>{a.name}</TableCell>
              <TableCell>{a.email}</TableCell>
              <TableCell>{a.phone || '-'}</TableCell>
              <TableCell>
                <Chip
                  label={`Level ${a.admin_level ?? 1}`}
                  color={getLevelColor(a.admin_level)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {new Date(a.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/users/${a.id}`);
                  }}
                >
                  View Details
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

