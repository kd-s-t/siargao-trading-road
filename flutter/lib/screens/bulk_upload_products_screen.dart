import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:csv/csv.dart';
import 'package:excel/excel.dart' hide Border;
import 'package:siargao_trading_road/services/product_service.dart';
import 'package:siargao_trading_road/utils/snackbar_helper.dart';

class BulkUploadProductsScreen extends StatefulWidget {
  const BulkUploadProductsScreen({super.key});

  @override
  State<BulkUploadProductsScreen> createState() => _BulkUploadProductsScreenState();
}

class _BulkUploadProductsScreenState extends State<BulkUploadProductsScreen> {
  bool _loading = false;
  bool _uploading = false;
  String? _error;
  String? _fileName;
  List<Map<String, dynamic>> _parsedProducts = [];
  List<String> _validationErrors = [];
  int? _createdCount;
  int? _failedCount;
  List<String>? _uploadErrors;

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['csv', 'xlsx', 'xls'],
      );

      if (result != null && result.files.single.path != null) {
        setState(() {
          _fileName = result.files.single.name;
          _error = null;
          _parsedProducts = [];
          _validationErrors = [];
          _createdCount = null;
          _failedCount = null;
          _uploadErrors = null;
        });

        await _parseFile(result.files.single.path!);
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to pick file: ${e.toString()}';
      });
    }
  }

  Future<void> _parseFile(String filePath) async {
    setState(() {
      _loading = true;
      _error = null;
      _parsedProducts = [];
      _validationErrors = [];
    });

    try {
      final file = File(filePath);
      final extension = filePath.split('.').last.toLowerCase();

      if (extension == 'csv') {
        await _parseCsv(file);
      } else if (extension == 'xlsx' || extension == 'xls') {
        await _parseExcel(file);
      } else {
        setState(() {
          _error = 'Unsupported file format. Please use CSV or Excel files.';
          _loading = false;
        });
        return;
      }

      if (_parsedProducts.isEmpty) {
        setState(() {
          _error = 'No valid products found in the file.';
          _loading = false;
        });
        return;
      }

      _validateProducts();

      setState(() {
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to parse file: ${e.toString()}';
        _loading = false;
      });
    }
  }

  Future<void> _parseCsv(File file) async {
    final content = await file.readAsString();
    final rows = const CsvToListConverter().convert(content);

    if (rows.isEmpty) {
      throw Exception('CSV file is empty');
    }

    final headers = rows[0].map((e) => e.toString().trim().toLowerCase()).toList();
    final headerMap = <String, int>{};
    for (var i = 0; i < headers.length; i++) {
      headerMap[headers[i]] = i;
    }

    final requiredHeaders = ['name', 'sku', 'price'];
    for (var header in requiredHeaders) {
      if (!headerMap.containsKey(header)) {
        throw Exception('Missing required column: $header');
      }
    }

    _parsedProducts = [];
    for (var i = 1; i < rows.length; i++) {
      final row = rows[i];
      if (row.isEmpty || row.every((cell) => cell.toString().trim().isEmpty)) {
        continue;
      }

      final product = <String, dynamic>{};
      
      if (headerMap.containsKey('name')) {
        product['name'] = row[headerMap['name']!].toString().trim();
      }
      if (headerMap.containsKey('description')) {
        product['description'] = row[headerMap['description']!].toString().trim();
      }
      if (headerMap.containsKey('sku')) {
        product['sku'] = row[headerMap['sku']!].toString().trim();
      }
      if (headerMap.containsKey('price')) {
        final priceStr = row[headerMap['price']!].toString().trim();
        product['price'] = double.tryParse(priceStr.replaceAll(',', '')) ?? 0.0;
      }
      if (headerMap.containsKey('stock_quantity') || headerMap.containsKey('stock quantity')) {
        final stockKey = headerMap.containsKey('stock_quantity') ? 'stock_quantity' : 'stock quantity';
        final stockStr = row[headerMap[stockKey]!].toString().trim();
        product['stock_quantity'] = int.tryParse(stockStr.replaceAll(',', '')) ?? 0;
      }
      if (headerMap.containsKey('unit')) {
        product['unit'] = row[headerMap['unit']!].toString().trim();
      }
      if (headerMap.containsKey('category')) {
        product['category'] = row[headerMap['category']!].toString().trim();
      }
      if (headerMap.containsKey('image_url') || headerMap.containsKey('image url')) {
        final imageKey = headerMap.containsKey('image_url') ? 'image_url' : 'image url';
        product['image_url'] = row[headerMap[imageKey]!].toString().trim();
      }

      if (product['name'] != null && product['name'].toString().isNotEmpty) {
        _parsedProducts.add(product);
      }
    }
  }

  Future<void> _parseExcel(File file) async {
    final bytes = await file.readAsBytes();
    final excel = Excel.decodeBytes(bytes);

    if (excel.tables.isEmpty) {
      throw Exception('Excel file has no sheets');
    }

    final sheet = excel.tables[excel.tables.keys.first]!;
    if (sheet.rows.isEmpty) {
      throw Exception('Excel sheet is empty');
    }

    final headerRow = sheet.rows[0];
    final headers = headerRow.map((cell) => cell?.value?.toString().trim().toLowerCase() ?? '').toList();
    final headerMap = <String, int>{};
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].isNotEmpty) {
        headerMap[headers[i]] = i;
      }
    }

    final requiredHeaders = ['name', 'sku', 'price'];
    for (var header in requiredHeaders) {
      if (!headerMap.containsKey(header)) {
        throw Exception('Missing required column: $header');
      }
    }

    _parsedProducts = [];
    for (var i = 1; i < sheet.rows.length; i++) {
      final row = sheet.rows[i];
      if (row.isEmpty || row.every((cell) => cell?.value?.toString().trim().isEmpty ?? true)) {
        continue;
      }

      final product = <String, dynamic>{};
      
      if (headerMap.containsKey('name')) {
        product['name'] = row[headerMap['name']!]?.value?.toString().trim() ?? '';
      }
      if (headerMap.containsKey('description')) {
        product['description'] = row[headerMap['description']!]?.value?.toString().trim() ?? '';
      }
      if (headerMap.containsKey('sku')) {
        product['sku'] = row[headerMap['sku']!]?.value?.toString().trim() ?? '';
      }
      if (headerMap.containsKey('price')) {
        final priceValue = row[headerMap['price']!]?.value;
        if (priceValue != null) {
          if (priceValue is num) {
            product['price'] = (priceValue as num).toDouble();
          } else {
            final priceStr = priceValue.toString().trim().replaceAll(',', '');
            product['price'] = double.tryParse(priceStr) ?? 0.0;
          }
        } else {
          product['price'] = 0.0;
        }
      } else {
        product['price'] = 0.0;
      }
      if (headerMap.containsKey('stock_quantity') || headerMap.containsKey('stock quantity')) {
        final stockKey = headerMap.containsKey('stock_quantity') ? 'stock_quantity' : 'stock quantity';
        final stockValue = row[headerMap[stockKey]!]?.value;
        if (stockValue != null) {
          if (stockValue is num) {
            product['stock_quantity'] = (stockValue as num).toInt();
          } else {
            final stockStr = stockValue.toString().trim().replaceAll(',', '');
            product['stock_quantity'] = int.tryParse(stockStr) ?? 0;
          }
        } else {
          product['stock_quantity'] = 0;
        }
      } else {
        product['stock_quantity'] = 0;
      }
      if (headerMap.containsKey('unit')) {
        product['unit'] = row[headerMap['unit']!]?.value?.toString().trim() ?? '';
      }
      if (headerMap.containsKey('category')) {
        product['category'] = row[headerMap['category']!]?.value?.toString().trim() ?? '';
      }
      if (headerMap.containsKey('image_url') || headerMap.containsKey('image url')) {
        final imageKey = headerMap.containsKey('image_url') ? 'image_url' : 'image url';
        product['image_url'] = row[headerMap[imageKey]!]?.value?.toString().trim() ?? '';
      }

      if (product['name'] != null && product['name'].toString().isNotEmpty) {
        _parsedProducts.add(product);
      }
    }
  }

  void _validateProducts() {
    _validationErrors = [];
    for (var i = 0; i < _parsedProducts.length; i++) {
      final product = _parsedProducts[i];
      final rowNum = i + 2;

      if (product['name'] == null || product['name'].toString().trim().isEmpty) {
        _validationErrors.add('Row $rowNum: Name is required');
      }
      if (product['sku'] == null || product['sku'].toString().trim().isEmpty) {
        _validationErrors.add('Row $rowNum: SKU is required');
      }
      if (product['price'] == null || (product['price'] as num) <= 0) {
        _validationErrors.add('Row $rowNum: Price must be greater than 0');
      }
      if (product['stock_quantity'] == null || (product['stock_quantity'] as num) < 0) {
        _validationErrors.add('Row $rowNum: Stock quantity must be 0 or greater');
      }
    }
  }

  Future<void> _uploadProducts() async {
    if (_parsedProducts.isEmpty) {
      SnackbarHelper.showError(context, 'No products to upload');
      return;
    }

    if (_validationErrors.isNotEmpty) {
      SnackbarHelper.showError(context, 'Please fix validation errors before uploading');
      return;
    }

    setState(() {
      _uploading = true;
      _error = null;
      _createdCount = null;
      _failedCount = null;
      _uploadErrors = null;
    });

    try {
      final productsToUpload = _parsedProducts.map((p) {
        final product = <String, dynamic>{
          'name': p['name'].toString().trim(),
          'sku': p['sku'].toString().trim(),
          'price': (p['price'] as num).toDouble(),
        };
        
        if (p['description'] != null && p['description'].toString().trim().isNotEmpty) {
          product['description'] = p['description'].toString().trim();
        }
        if (p['stock_quantity'] != null) {
          product['stock_quantity'] = (p['stock_quantity'] as num).toInt();
        }
        if (p['unit'] != null && p['unit'].toString().trim().isNotEmpty) {
          product['unit'] = p['unit'].toString().trim();
        }
        if (p['category'] != null && p['category'].toString().trim().isNotEmpty) {
          product['category'] = p['category'].toString().trim();
        }
        if (p['image_url'] != null && p['image_url'].toString().trim().isNotEmpty) {
          product['image_url'] = p['image_url'].toString().trim();
        }
        
        return product;
      }).toList();

      final result = await ProductService.bulkCreateProducts(productsToUpload);

      setState(() {
        _createdCount = result['created'] as int? ?? 0;
        _failedCount = result['failed'] as int? ?? 0;
        if (result['errors'] != null) {
          _uploadErrors = List<String>.from(result['errors'] as List);
        }
        _uploading = false;
      });

      if (_createdCount! > 0) {
        SnackbarHelper.showSuccess(context, 'Successfully created $_createdCount product(s)');
        if (mounted) {
          Navigator.pop(context, true);
        }
      } else {
        SnackbarHelper.showError(context, 'Failed to create any products');
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _uploading = false;
      });
      SnackbarHelper.showError(context, _error!);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bulk Upload Products'),
        actions: [
          TextButton(
            onPressed: _loading || _uploading ? null : () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'File Format',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Upload a CSV or Excel file with the following columns:',
                        style: TextStyle(fontSize: 14),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Required columns:',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      const Text('• name (required)'),
                      const Text('• sku (required)'),
                      const Text('• price (required)'),
                      const SizedBox(height: 8),
                      const Text(
                        'Optional columns:',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      const Text('• description'),
                      const Text('• stock_quantity (default: 0)'),
                      const Text('• unit'),
                      const Text('• category'),
                      const Text('• image_url'),
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 12),
                      const Text(
                        'Example Format:',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: Table(
                          border: TableBorder.all(color: Colors.grey.shade400, width: 1),
                          children: [
                            TableRow(
                              decoration: BoxDecoration(color: Colors.grey.shade200),
                              children: const [
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('name', style: TextStyle(fontWeight: FontWeight.w600)),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('sku', style: TextStyle(fontWeight: FontWeight.w600)),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('price', style: TextStyle(fontWeight: FontWeight.w600)),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('stock_quantity', style: TextStyle(fontWeight: FontWeight.w600)),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('unit', style: TextStyle(fontWeight: FontWeight.w600)),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('category', style: TextStyle(fontWeight: FontWeight.w600)),
                                ),
                              ],
                            ),
                            const TableRow(
                              children: [
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('Rice 5kg'),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('RICE-5KG-001'),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('250.00'),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('100'),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('bag'),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('Grains'),
                                ),
                              ],
                            ),
                            const TableRow(
                              children: [
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('Cooking Oil 1L'),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('OIL-1L-001'),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('85.50'),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('50'),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('bottle'),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('Condiments'),
                                ),
                              ],
                            ),
                            const TableRow(
                              children: [
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('Sugar 1kg'),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('SUGAR-1KG-001'),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('65.00'),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('75'),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('pack'),
                                ),
                                Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text('Baking'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Note: The first row should contain column headers. Description and image_url columns are optional and not shown in this example.',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontStyle: FontStyle.italic),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _loading || _uploading ? null : _pickFile,
                icon: const Icon(Icons.upload_file),
                label: Text(_fileName ?? 'Select CSV or Excel File'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
              if (_loading) ...[
                const SizedBox(height: 16),
                const Center(child: CircularProgressIndicator()),
                const SizedBox(height: 8),
                const Center(child: Text('Parsing file...')),
              ],
              if (_error != null) ...[
                const SizedBox(height: 16),
                Card(
                  color: Colors.red.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      _error!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                ),
              ],
              if (_parsedProducts.isNotEmpty) ...[
                const SizedBox(height: 16),
                Card(
                  color: Colors.green.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Found ${_parsedProducts.length} product(s)',
                      style: TextStyle(color: Colors.green.shade700, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
              if (_validationErrors.isNotEmpty) ...[
                const SizedBox(height: 16),
                Card(
                  color: Colors.orange.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Validation Errors (${_validationErrors.length})',
                          style: TextStyle(color: Colors.orange.shade700, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),
                        ..._validationErrors.take(10).map((error) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text(
                                error,
                                style: TextStyle(color: Colors.orange.shade700, fontSize: 12),
                              ),
                            )),
                        if (_validationErrors.length > 10)
                          Text(
                            '... and ${_validationErrors.length - 10} more',
                            style: TextStyle(color: Colors.orange.shade700, fontSize: 12),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
              if (_createdCount != null || _failedCount != null) ...[
                const SizedBox(height: 16),
                Card(
                  color: _failedCount! > 0 ? Colors.orange.shade50 : Colors.green.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Upload Results',
                          style: TextStyle(
                            color: _failedCount! > 0 ? Colors.orange.shade700 : Colors.green.shade700,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text('Created: $_createdCount'),
                        Text('Failed: $_failedCount'),
                        if (_uploadErrors != null && _uploadErrors!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          ..._uploadErrors!.take(5).map((error) => Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Text(
                                  error,
                                  style: TextStyle(fontSize: 12),
                                ),
                              )),
                          if (_uploadErrors!.length > 5)
                            Text('... and ${_uploadErrors!.length - 5} more'),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
              if (_parsedProducts.isNotEmpty && _validationErrors.isEmpty) ...[
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _uploading ? null : _uploadProducts,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _uploading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Upload Products'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

