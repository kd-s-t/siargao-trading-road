import Image from 'next/image';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

export function LoginLogo() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Image
          src="/logo.png"
          alt="Siargao Trading Road Logo"
          width={200}
          height={80}
          style={{ height: 80, width: 'auto' }}
        />
      </motion.div>
    </Box>
  );
}

