import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:siargao_trading_road/models/product.dart';
import 'package:siargao_trading_road/services/auth_service.dart';
import 'package:siargao_trading_road/services/product_service.dart';

class EditProductScreen extends StatefulWidget {
  final Product? product;

  const EditProductScreen({super.key, this.product});

  @override
  State<EditProductScreen> createState() => _EditProductScreenState();
}

class _EditProductScreenState extends State<EditProductScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  String? _error;
  String? _uploading;
  File? _selectedImage;
  String? _imageUrl;

  late TextEditingController _nameController;
  late TextEditingController _descriptionController;
  late TextEditingController _skuController;
  late TextEditingController _priceController;
  late TextEditingController _stockQuantityController;
  late TextEditingController _categoryController;
  String? _selectedUnit;
  final List<String> _unitOptions = [
    'piece',
    'kg',
    'g',
    'box',
    'pack',
    'liter',
    'ml',
  ];

  @override
  void initState() {
    super.initState();
    final product = widget.product;
    _nameController = TextEditingController(text: product?.name ?? '');
    _descriptionController = TextEditingController(text: product?.description ?? '');
    _skuController = TextEditingController(text: product?.sku ?? '');
    _priceController = TextEditingController(text: product?.price.toStringAsFixed(2) ?? '');
    _stockQuantityController = TextEditingController(text: product?.stockQuantity.toString() ?? '');
    _selectedUnit = product?.unit;
    _categoryController = TextEditingController(text: product?.category ?? '');
    _imageUrl = product?.imageUrl;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _skuController.dispose();
    _priceController.dispose();
    _stockQuantityController.dispose();
    _categoryController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (widget.product == null) {
      setState(() {
        _error = 'Product not found';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final name = _nameController.text.trim();
      final sku = _skuController.text.trim();
      final price = double.tryParse(_priceController.text.trim()) ?? 0.0;
      final stockQuantity = int.tryParse(_stockQuantityController.text.trim()) ?? 0;
      final unit = _selectedUnit?.trim() ?? '';
      final category = _categoryController.text.trim();
      final description = _descriptionController.text.trim();

      if (name.isEmpty || sku.isEmpty || price <= 0) {
        setState(() {
          _error = 'Please fill in required fields (name, SKU, price)';
          _loading = false;
        });
        return;
      }

      String? finalImageUrl = _imageUrl;
      
      if (_selectedImage != null) {
        setState(() {
          _uploading = 'image';
        });
        try {
          final uploadResult = await AuthService.uploadImage(_selectedImage!.path);
          finalImageUrl = uploadResult['url'];
        } catch (e) {
          setState(() {
            _error = 'Failed to upload image: ${e.toString()}';
            _loading = false;
            _uploading = null;
          });
          return;
        } finally {
          setState(() {
            _uploading = null;
          });
        }
      }

      await ProductService.updateProduct(
        widget.product!.id,
        name: name,
        description: description.isEmpty ? null : description,
        sku: sku,
        price: price,
        stockQuantity: stockQuantity,
        unit: unit.isEmpty ? null : unit,
        category: category.isEmpty ? null : category,
        imageUrl: finalImageUrl,
      );

      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Product'),
        actions: [
          TextButton(
            onPressed: _loading ? null : () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_error != null)
                Card(
                  color: Colors.red.shade50,
                  margin: const EdgeInsets.only(bottom: 16),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      _error!,
                      style: const TextStyle(color: Colors.red),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              _buildImageSelector(),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Product Name *',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Product name is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _skuController,
                decoration: const InputDecoration(
                  labelText: 'SKU *',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'SKU is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _priceController,
                decoration: const InputDecoration(
                  labelText: 'Price *',
                  border: OutlineInputBorder(),
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}$')),
                ],
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Price is required';
                  }
                  final price = double.tryParse(value.trim());
                  if (price == null || price <= 0) {
                    return 'Price must be greater than 0';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _stockQuantityController,
                decoration: const InputDecoration(
                  labelText: 'Stock Quantity *',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                ],
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Stock quantity is required';
                  }
                  final quantity = int.tryParse(value.trim());
                  if (quantity == null || quantity < 0) {
                    return 'Stock quantity must be 0 or greater';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _selectedUnit,
                decoration: const InputDecoration(
                  labelText: 'Unit',
                  border: OutlineInputBorder(),
                ),
                items: _unitOptions
                    .map((unit) => DropdownMenuItem<String>(
                          value: unit,
                          child: Text(unit),
                        ))
                    .toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedUnit = value;
                  });
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _categoryController,
                decoration: const InputDecoration(
                  labelText: 'Category',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                ),
                maxLines: 4,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Update Product'),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
        ),
      ),
    );
  }

  Widget _buildImageSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Product Image',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _pickImage,
          child: Container(
            height: 200,
            width: double.infinity,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
            ),
            child: _uploading == 'image'
                ? const Center(child: CircularProgressIndicator())
                : _selectedImage != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(
                          _selectedImage!,
                          fit: BoxFit.cover,
                        ),
                      )
                    : _imageUrl != null && _imageUrl!.isNotEmpty
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              _imageUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return _buildPlaceholder();
                              },
                            ),
                          )
                        : _buildPlaceholder(),
          ),
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: _pickImage,
          icon: const Icon(Icons.image),
          label: Text(_selectedImage != null || (_imageUrl != null && _imageUrl!.isNotEmpty)
              ? 'Change Image'
              : 'Select Image'),
        ),
      ],
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: Colors.grey.shade200,
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.image, size: 48, color: Colors.grey),
          SizedBox(height: 8),
          Text(
            'Tap to select image',
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Future<void> _pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );

    if (image != null) {
      setState(() {
        _selectedImage = File(image.path);
      });
    }
  }
}
