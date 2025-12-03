import { Box, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { ProductFilters as ProductFiltersType } from '../types';
import { User } from '@/lib/users';

interface ProductFiltersProps {
  filters: ProductFiltersType;
  suppliers: User[];
  categories: string[];
  onFiltersChange: (filters: ProductFiltersType) => void;
}

export function ProductFilters({ filters, suppliers, categories, onFiltersChange }: ProductFiltersProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      <TextField
        placeholder="Search products..."
        value={filters.searchTerm}
        onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
        sx={{ flexGrow: 1, minWidth: 200 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Filter by Supplier</InputLabel>
        <Select
          value={filters.selectedSupplier}
          onChange={(e) => onFiltersChange({ ...filters, selectedSupplier: e.target.value as number | '' })}
          label="Filter by Supplier"
        >
          <MenuItem value="">All Suppliers</MenuItem>
          {suppliers.map((supplier) => (
            <MenuItem key={supplier.id} value={supplier.id}>
              {supplier.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Filter by Category</InputLabel>
        <Select
          value={filters.selectedCategory}
          onChange={(e) => onFiltersChange({ ...filters, selectedCategory: e.target.value })}
          label="Filter by Category"
        >
          <MenuItem value="">All Categories</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

