import type { Meta, StoryObj } from '@storybook/react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
} from '@mui/material';

const sampleProducts = [
  { id: 1, name: 'Product A', sku: 'SKU001', supplier: 'Supplier 1', category: 'Category 1', price: 100.00, stock: 50, unit: 'pcs' },
  { id: 2, name: 'Product B', sku: 'SKU002', supplier: 'Supplier 2', category: 'Category 2', price: 200.00, stock: 30, unit: 'pcs' },
  { id: 3, name: 'Product C', sku: 'SKU003', supplier: 'Supplier 1', category: 'Category 1', price: 150.00, stock: 0, unit: 'pcs' },
  { id: 4, name: 'Product D', sku: 'SKU004', supplier: 'Supplier 3', category: 'Category 3', price: 300.00, stock: 100, unit: 'kg' },
];

const sampleOrders = [
  { id: 1, store: 'Store A', supplier: 'Supplier 1', status: 'pending', total: 5000.00, items: 5, date: '2024-01-15' },
  { id: 2, store: 'Store B', supplier: 'Supplier 2', status: 'confirmed', total: 3000.00, items: 3, date: '2024-01-16' },
  { id: 3, store: 'Store C', supplier: 'Supplier 1', status: 'delivered', total: 7500.00, items: 8, date: '2024-01-17' },
];

const meta: Meta<typeof Table> = {
  title: 'Components/Table',
  component: Table,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

export const ProductsTable: Story = {
  render: () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell>Supplier</TableCell>
            <TableCell>Category</TableCell>
            <TableCell align="right">Price</TableCell>
            <TableCell align="right">Stock</TableCell>
            <TableCell>Unit</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sampleProducts.map((product) => (
            <TableRow key={product.id} hover>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.supplier}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell align="right">
                ₱{product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell align="right">
                <Chip
                  label={product.stock}
                  color={product.stock > 0 ? 'success' : 'error'}
                  size="small"
                />
              </TableCell>
              <TableCell>{product.unit}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ),
};

export const OrdersTable: Story = {
  render: () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Store</TableCell>
            <TableCell>Supplier</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Total Amount</TableCell>
            <TableCell align="right">Items</TableCell>
            <TableCell>Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sampleOrders.map((order) => (
            <TableRow key={order.id} hover>
              <TableCell>#{order.id}</TableCell>
              <TableCell>{order.store}</TableCell>
              <TableCell>{order.supplier}</TableCell>
              <TableCell>
                <Chip
                  label={order.status}
                  color={
                    order.status === 'delivered' ? 'success' :
                    order.status === 'confirmed' ? 'info' :
                    'warning'
                  }
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                ₱{order.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell align="right">{order.items}</TableCell>
              <TableCell>{order.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ),
};

export const SimpleTable: Story = {
  render: () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
            <TableCell>Admin</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
            <TableCell>Store</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Bob Johnson</TableCell>
            <TableCell>bob@example.com</TableCell>
            <TableCell>Supplier</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  ),
};

export const EmptyTable: Story = {
  render: () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell>Price</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell colSpan={3} align="center">
              <Box sx={{ py: 4 }}>
                No products found
              </Box>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  ),
};

export const DashboardOrdersTable: Story = {
  render: () => {
    const dashboardOrders = [
      { id: 1, store: 'Store A', supplier: 'Supplier 1', status: 'delivered', items: 5, amount: 5000.00, date: '2024-01-15' },
      { id: 2, store: 'Store B', supplier: 'Supplier 2', status: 'in_transit', items: 3, amount: 3000.00, date: '2024-01-16' },
      { id: 3, store: 'Store C', supplier: 'Supplier 1', status: 'preparing', items: 8, amount: 7500.00, date: '2024-01-17' },
      { id: 4, store: 'Store A', supplier: 'Supplier 3', status: 'cancelled', items: 2, amount: 1200.00, date: '2024-01-18' },
    ];

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Store</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dashboardOrders.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.store}</TableCell>
                <TableCell>{order.supplier}</TableCell>
                <TableCell>
                  <Chip
                    label={order.status.replace('_', ' ')}
                    size="small"
                    color={
                      order.status === 'delivered'
                        ? 'success'
                        : order.status === 'in_transit'
                        ? 'info'
                        : order.status === 'preparing'
                        ? 'warning'
                        : order.status === 'cancelled'
                        ? 'error'
                        : 'default'
                    }
                  />
                </TableCell>
                <TableCell>{order.items}</TableCell>
                <TableCell>₱{order.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell>{order.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  },
};

