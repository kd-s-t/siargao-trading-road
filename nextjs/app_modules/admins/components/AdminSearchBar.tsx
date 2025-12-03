import { TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface AdminSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function AdminSearchBar({ searchTerm, onSearchChange }: AdminSearchBarProps) {
  return (
    <TextField
      fullWidth
      placeholder="Search admins..."
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

