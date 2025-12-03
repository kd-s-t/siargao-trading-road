import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Typography,
  Avatar,
} from '@mui/material';
import { motion } from 'framer-motion';
import { User } from '@/lib/users';
import { getRoleColor } from '../constants';

interface UserTableProps {
  users: User[];
}

export function UserTable({ users }: UserTableProps) {
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
            <TableCell>Role</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((u, index) => (
            <TableRow
              key={u.id}
              component={motion.tr}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              hover
              sx={{ cursor: 'pointer' }}
              onClick={() => router.push(`/users/${u.id}`)}
            >
              <TableCell>{u.id}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    src={u.logo_url && u.logo_url.trim() !== '' ? u.logo_url : undefined}
                    alt={u.name}
                    sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2">{u.name}</Typography>
                </Box>
              </TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.phone || '-'}</TableCell>
              <TableCell>
                <Chip
                  label={u.role}
                  color={getRoleColor(u.role)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {new Date(u.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/users/${u.id}`);
                  }}
                >
                  {u.role === 'admin' ? 'View Details' : 'Manage'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

