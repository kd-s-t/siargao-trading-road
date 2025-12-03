import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface AdminHeaderProps {
  onRegisterClick: () => void;
}

export function AdminHeader({ onRegisterClick }: AdminHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Admin Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onRegisterClick}
        >
          Register Admin
        </Button>
      </Box>
    </motion.div>
  );
}

