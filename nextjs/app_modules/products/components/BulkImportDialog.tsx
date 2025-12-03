'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, Description as DescriptionIcon, Download as DownloadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { Product, User, productsService } from '@/lib/users';

interface BulkImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  suppliers: User[];
}

interface ParsedProduct {
  name: string;
  description?: string;
  sku: string;
  price: number;
  stock_quantity?: number;
  unit?: string;
  category?: string;
  image_url?: string;
  supplier_id: number;
  supplier_email?: string;
  errors?: string[];
}

export function BulkImportDialog({ open, onClose, onSuccess, suppliers }: BulkImportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setParsedProducts([]);
      setValidationErrors([]);
      setError('');
      setTabValue(0);
    }
  }, [open]);

  const downloadCSVTemplate = () => {
    const sampleSupplier = suppliers.length > 0 ? suppliers[0] : null;
    const headers = ['name', 'sku', 'price', 'supplier_id', 'supplier_email', 'description', 'stock_quantity', 'unit', 'category', 'image_url'];
    const sampleData = [
      [
        'Sample Product 1',
        'SAMPLE-001',
        '1000.00',
        sampleSupplier ? sampleSupplier.id.toString() : '',
        sampleSupplier ? sampleSupplier.email : '',
        'Sample product description',
        '50',
        'piece',
        'Sample Category',
        ''
      ],
      [
        'Sample Product 2',
        'SAMPLE-002',
        '2000.00',
        sampleSupplier ? sampleSupplier.id.toString() : '',
        '',
        'Another sample product',
        '100',
        'box',
        'Another Category',
        ''
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSONTemplate = () => {
    const sampleSupplier = suppliers.length > 0 ? suppliers[0] : null;
    const sampleData = [
      {
        name: 'Sample Product 1',
        sku: 'SAMPLE-001',
        price: 1000.00,
        supplier_id: sampleSupplier ? sampleSupplier.id : null,
        supplier_email: sampleSupplier ? sampleSupplier.email : null,
        description: 'Sample product description',
        stock_quantity: 50,
        unit: 'piece',
        category: 'Sample Category',
        image_url: ''
      },
      {
        name: 'Sample Product 2',
        sku: 'SAMPLE-002',
        price: 2000.00,
        supplier_id: sampleSupplier ? sampleSupplier.id : null,
        description: 'Another sample product',
        stock_quantity: 100,
        unit: 'box',
        category: 'Another Category'
      }
    ];

    const jsonContent = JSON.stringify(sampleData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_import_template.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcelTemplate = () => {
    const sampleSupplier = suppliers.length > 0 ? suppliers[0] : null;
    const headers = ['name', 'sku', 'price', 'supplier_id', 'supplier_email', 'description', 'stock_quantity', 'unit', 'category', 'image_url'];
    const sampleData = [
      {
        name: 'Sample Product 1',
        sku: 'SAMPLE-001',
        price: 1000.00,
        supplier_id: sampleSupplier ? sampleSupplier.id : '',
        supplier_email: sampleSupplier ? sampleSupplier.email : '',
        description: 'Sample product description',
        stock_quantity: 50,
        unit: 'piece',
        category: 'Sample Category',
        image_url: ''
      },
      {
        name: 'Sample Product 2',
        sku: 'SAMPLE-002',
        price: 2000.00,
        supplier_id: sampleSupplier ? sampleSupplier.id : '',
        supplier_email: '',
        description: 'Another sample product',
        stock_quantity: 100,
        unit: 'box',
        category: 'Another Category',
        image_url: ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, 'product_import_template.xlsx');
  };

  const validateProduct = (product: ParsedProduct, index: number): string[] => {
    const errors: string[] = [];
    
    if (!product.name || product.name.trim() === '') {
      errors.push(`Row ${index + 1}: Name is required`);
    }
    if (!product.sku || product.sku.trim() === '') {
      errors.push(`Row ${index + 1}: SKU is required`);
    }
    if (!product.price || product.price <= 0) {
      errors.push(`Row ${index + 1}: Price must be greater than 0`);
    }
    if (!product.supplier_id || product.supplier_id === 0) {
      if (product.supplier_email) {
        const supplier = suppliers.find(s => s.email === product.supplier_email);
        if (!supplier) {
          errors.push(`Row ${index + 1}: Invalid supplier email`);
        }
      } else {
        errors.push(`Row ${index + 1}: Supplier ID or email is required`);
      }
    } else if (!suppliers.find(s => s.id === product.supplier_id)) {
      errors.push(`Row ${index + 1}: Invalid supplier_id`);
    }
    
    return errors;
  };

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[];

        if (jsonData.length === 0) {
          setError('Excel file is empty');
          return;
        }

        const products: ParsedProduct[] = [];
        const errors: string[] = [];

        jsonData.forEach((row, index) => {
          const product: ParsedProduct = {
            name: String(row.name || row.Name || row.NAME || ''),
            description: String(row.description || row.Description || row.DESCRIPTION || ''),
            sku: String(row.sku || row.SKU || row.Sku || ''),
            price: parseFloat(String(row.price || row.Price || row.PRICE || 0)),
            stock_quantity: Number(row.stock_quantity || row['stock quantity'] || row['Stock Quantity'] || row['STOCK_QUANTITY'] || 0),
            unit: String(row.unit || row.Unit || row.UNIT || ''),
            category: String(row.category || row.Category || row.CATEGORY || ''),
            image_url: String(row.image_url || row['image url'] || row['Image URL'] || row['IMAGE_URL'] || ''),
            supplier_id: 0,
            supplier_email: String(row.supplier_email || row['supplier email'] || row['Supplier Email'] || row['SUPPLIER_EMAIL'] || ''),
          };

          if (row.supplier_id || row['supplier id'] || row['Supplier ID'] || row['SUPPLIER_ID']) {
            product.supplier_id = parseInt(String(row.supplier_id || row['supplier id'] || row['Supplier ID'] || row['SUPPLIER_ID'] || '0'));
          } else if (product.supplier_email) {
            const supplier = suppliers.find(s => s.email === product.supplier_email);
            if (supplier) {
              product.supplier_id = supplier.id;
            }
          }

          const productErrors = validateProduct(product, index);
          if (productErrors.length > 0) {
            product.errors = productErrors;
            errors.push(...productErrors);
          }

          products.push(product);
        });

        setParsedProducts(products);
        setValidationErrors(errors);
        if (errors.length > 0) {
          setError(`Found ${errors.length} validation error(s). Please review the table below.`);
        } else {
          setError('');
        }
      } catch (err: unknown) {
        setError(`Failed to parse Excel file: ${(err as Error).message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        const productsArray = Array.isArray(jsonData) ? jsonData : [jsonData];

        if (productsArray.length === 0) {
          setError('JSON file is empty');
          return;
        }

        const products: ParsedProduct[] = [];
        const errors: string[] = [];

        productsArray.forEach((row, index) => {
          const product: ParsedProduct = {
            name: String(row.name || ''),
            description: row.description || '',
            sku: String(row.sku || ''),
            price: parseFloat(row.price || 0),
            stock_quantity: row.stock_quantity || row.stockQuantity || 0,
            unit: row.unit || '',
            category: row.category || '',
            image_url: row.image_url || row.imageUrl || '',
            supplier_id: row.supplier_id || row.supplierId || 0,
            supplier_email: row.supplier_email || row.supplierEmail || '',
          };

          if (product.supplier_email && !product.supplier_id) {
            const supplier = suppliers.find(s => s.email === product.supplier_email);
            if (supplier) {
              product.supplier_id = supplier.id;
            }
          }

          const productErrors = validateProduct(product, index);
          if (productErrors.length > 0) {
            product.errors = productErrors;
            errors.push(...productErrors);
          }

          products.push(product);
        });

        setParsedProducts(products);
        setValidationErrors(errors);
        if (errors.length > 0) {
          setError(`Found ${errors.length} validation error(s). Please review the table below.`);
        } else {
          setError('');
        }
      } catch (err: unknown) {
        setError(`Failed to parse JSON file: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'excel' | 'json') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'excel') {
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!validExtensions.includes(fileExtension)) {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }
      parseExcel(file);
    } else {
      if (!file.name.endsWith('.json')) {
        setError('Please select a valid JSON file');
        return;
      }
      parseJSON(file);
    }
  };

  const handleSubmit = async () => {
    if (parsedProducts.length === 0) {
      setError('No products to import');
      return;
    }

    if (validationErrors.length > 0) {
      setError('Please fix validation errors before importing');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const productsToCreate = parsedProducts.map(p => ({
        name: p.name,
        description: p.description || '',
        sku: p.sku,
        price: p.price,
        stock_quantity: p.stock_quantity || 0,
        unit: p.unit || '',
        category: p.category || '',
        image_url: p.image_url || undefined,
        supplier_id: p.supplier_id,
      }));

      await productsService.bulkCreateProducts(productsToCreate);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to import products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Bulk Import Products</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity={validationErrors.length > 0 ? 'warning' : 'error'} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label="Excel" icon={<DescriptionIcon />} iconPosition="start" />
          <Tab label="JSON" icon={<DescriptionIcon />} iconPosition="start" />
        </Tabs>

        <Box sx={{ mb: 3 }}>
          {tabValue === 0 ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Upload an Excel file (.xlsx or .xls). Expected columns: name, sku, price, supplier_id (or supplier_email), description, stock_quantity, unit, category, image_url
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  disabled={loading}
                >
                  Select Excel File
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleFileSelect(e, 'excel')}
                    style={{ display: 'none' }}
                  />
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadExcelTemplate}
                  disabled={loading}
                >
                  Download Excel Template
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadCSVTemplate}
                  disabled={loading}
                >
                  Download CSV Template
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Upload a JSON file. Expected format: array of product objects with fields: name, sku, price, supplier_id (or supplier_email), description, stock_quantity, unit, category, image_url
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  disabled={loading}
                >
                  Select JSON File
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => handleFileSelect(e, 'json')}
                    style={{ display: 'none' }}
                  />
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadJSONTemplate}
                  disabled={loading}
                >
                  Download JSON Template
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        {parsedProducts.length > 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Preview ({parsedProducts.length} products)
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Errors</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>₱{product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        {suppliers.find(s => s.id === product.supplier_id)?.name || 'Invalid'}
                      </TableCell>
                      <TableCell>{product.stock_quantity || 0}</TableCell>
                      <TableCell>{product.category || '-'}</TableCell>
                      <TableCell>
                        {product.errors && product.errors.length > 0 ? (
                          <Typography variant="caption" color="error">
                            {product.errors.join(', ')}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || parsedProducts.length === 0 || validationErrors.length > 0}
        >
          {loading ? <CircularProgress size={24} /> : `Import ${parsedProducts.length} Products`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

