import { Typography, Box, Button } from '@mui/material';
import { Add as AddIcon, Upload as UploadIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface ProductHeaderProps {
  onAddClick: () => void;
  onBulkImportClick: () => void;
}

export function ProductHeader({ onAddClick, onBulkImportClick }: ProductHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" component="h1">
        Products
      </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={onBulkImportClick}
          >
            Bulk Import
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddClick}
          >
            Add Product
          </Button>
        </Box>
      </Box>
    </motion.div>
  );
}

