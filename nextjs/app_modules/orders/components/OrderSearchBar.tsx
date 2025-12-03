import { TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface OrderSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function OrderSearchBar({ searchTerm, onSearchChange }: OrderSearchBarProps) {
  return (
    <TextField
      fullWidth
      placeholder="Search orders..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      sx={{ mb: 3 }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
    />
  );
}

