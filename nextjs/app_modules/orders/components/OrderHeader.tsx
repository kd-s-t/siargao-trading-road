import { Typography } from '@mui/material';
import { motion } from 'framer-motion';

export function OrderHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Orders
      </Typography>
    </motion.div>
  );
}

