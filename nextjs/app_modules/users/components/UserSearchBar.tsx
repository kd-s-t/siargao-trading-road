import { TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface UserSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function UserSearchBar({ searchTerm, onSearchChange }: UserSearchBarProps) {
  return (
    <TextField
      fullWidth
      placeholder="Search users..."
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

