'use client';

import { Paper, Box, Typography, Avatar, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { User } from '@/lib/users';
import { SocialLinks } from './SocialLinks';

interface UserProfileCardProps {
  user: User;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Paper sx={{ mb: 3, overflow: 'hidden', position: 'relative' }}>
        {user.banner_url && (
          <Box
            sx={{
              width: '100%',
              height: 200,
              backgroundImage: `url(${user.banner_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: 'grey.200',
            }}
          />
        )}
        <Box sx={{ p: 3, pt: user.banner_url ? 8 : 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar
              src={user.logo_url}
              alt={user.name}
              sx={{
                width: 100,
                height: 100,
                border: '4px solid white',
                boxShadow: 3,
                position: 'absolute',
                top: user.banner_url ? 150 : 24,
                left: 24,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, ml: user.banner_url ? 12 : 0 }}>
              <Typography variant="h5" gutterBottom>
                {user.name}
              </Typography>
              <Typography color="text.secondary">Email: {user.email}</Typography>
              <Typography color="text.secondary">Phone: {user.phone || '-'}</Typography>
              <Chip
                label={user.role}
                color={user.role === 'admin' ? 'error' : user.role === 'supplier' ? 'primary' : 'success'}
                sx={{ mt: 1, mb: 1 }}
              />
              <SocialLinks user={user} />
            </Box>
            <Box>
              <Typography color="text.secondary">
                Created: {new Date(user.created_at).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}

