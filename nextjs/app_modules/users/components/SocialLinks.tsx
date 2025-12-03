'use client';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import {
  Facebook,
  Instagram,
  Twitter,
  LinkedIn,
  YouTube,
  Language,
} from '@mui/icons-material';
import { User } from '@/lib/users';

interface SocialLinksProps {
  user: User;
}

export function SocialLinks({ user }: SocialLinksProps) {
  const hasSocialLinks =
    user.facebook ||
    user.instagram ||
    user.twitter ||
    user.linkedin ||
    user.youtube ||
    user.tiktok ||
    user.website;

  if (!hasSocialLinks) return null;

  return (
    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
      {user.facebook && (
        <Tooltip title="Facebook">
          <IconButton
            size="small"
            href={user.facebook}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: '#1877F2' }}
          >
            <Facebook fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {user.instagram && (
        <Tooltip title="Instagram">
          <IconButton
            size="small"
            href={user.instagram}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: '#E4405F' }}
          >
            <Instagram fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {user.twitter && (
        <Tooltip title="Twitter/X">
          <IconButton
            size="small"
            href={user.twitter}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: '#000000' }}
          >
            <Twitter fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {user.linkedin && (
        <Tooltip title="LinkedIn">
          <IconButton
            size="small"
            href={user.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: '#0077B5' }}
          >
            <LinkedIn fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {user.youtube && (
        <Tooltip title="YouTube">
          <IconButton
            size="small"
            href={user.youtube}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: '#FF0000' }}
          >
            <YouTube fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {user.tiktok && (
        <Tooltip title="TikTok">
          <IconButton
            size="small"
            href={user.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: '#000000' }}
          >
            <Typography
              component="span"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              TT
            </Typography>
          </IconButton>
        </Tooltip>
      )}
      {user.website && (
        <Tooltip title="Website">
          <IconButton
            size="small"
            href={user.website}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: 'primary.main' }}
          >
            <Language fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

