import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:siargao_trading_road/services/product_service.dart';
import 'package:siargao_trading_road/models/product.dart';

class ProductsScreen extends StatefulWidget {
  final bool? useScaffold;
  
  const ProductsScreen({super.key, this.useScaffold});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  List<Product> _products = [];
  bool _loading = true;
  bool _showDeleted = false;
  bool _isLoading = false;
  bool _hasLoaded = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && !_hasLoaded) {
        _loadProducts();
      }
    });
  }

  Future<void> _loadProducts({bool force = false}) async {
    if (_isLoading && !force) return;
    
    setState(() {
      _loading = true;
      _isLoading = true;
    });

    try {
      final products = await ProductService.getProducts(includeDeleted: _showDeleted);
      if (mounted) {
        setState(() {
          _products = products;
          _loading = false;
          _isLoading = false;
          _hasLoaded = true;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load products: $e')),
        );
      }
    }
  }

  Widget _buildBody() {
    return _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => _loadProducts(force: true),
              child: _products.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _showDeleted ? 'No deleted products' : 'No products yet',
                            style: const TextStyle(fontSize: 18),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _showDeleted
                                ? 'Turn off the filter to see active products'
                                : 'Tap the + button to add your first product',
                            style: const TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _products.length,
                      itemBuilder: (context, index) {
                        final product = _products[index];
                        final isDeleted = product.deletedAt != null;
                        return Card(
                          margin: const EdgeInsets.only(bottom: 16),
                          child: ListTile(
                            leading: product.imageUrl != null && product.imageUrl!.isNotEmpty
                                ? Image.network(
                                    product.imageUrl!,
                                    width: 60,
                                    height: 60,
                                    fit: BoxFit.cover,
                                  )
                                : Container(
                                    width: 60,
                                    height: 60,
                                    color: Colors.grey.shade300,
                                    child: const Icon(Icons.image),
                                  ),
                            title: Text(product.name),
                            subtitle: Text('₱${NumberFormat('#,##0.00').format(product.price)}'),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (isDeleted)
                                  IconButton(
                                    icon: const Icon(Icons.restore),
                                    onPressed: () async {
                                      try {
                                        await ProductService.restoreProduct(product.id);
                                        if (!mounted) return;
                                        _loadProducts(force: true);
                                      } catch (e) {
                                        if (!mounted) return;
                                        if (context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(content: Text('Failed to restore: $e')),
                                          );
                                        }
                                      }
                                    },
                                  )
                                else
                                  IconButton(
                                    icon: const Icon(Icons.edit),
                                    onPressed: () async {
                                      final result = await Navigator.pushNamed(
                                        context,
                                        '/edit-product',
                                        arguments: {'product': product},
                                      );
                                      if (result == true) {
                                        _loadProducts(force: true);
                                      }
                                    },
                                  ),
                                if (!isDeleted)
                                  IconButton(
                                    icon: const Icon(Icons.delete, color: Colors.red),
                                    onPressed: () async {
                                      final confirmed = await showDialog<bool>(
                                        context: context,
                                        builder: (context) => AlertDialog(
                                          title: const Text('Delete Product'),
                                          content: Text('Are you sure you want to delete "${product.name}"?'),
                                          actions: [
                                            TextButton(
                                              onPressed: () => Navigator.pop(context, false),
                                              child: const Text('Cancel'),
                                            ),
                                            TextButton(
                                              onPressed: () => Navigator.pop(context, true),
                                              child: const Text('Delete', style: TextStyle(color: Colors.red)),
                                            ),
                                          ],
                                        ),
                                      );
                                      if (confirmed == true) {
                                        try {
                                          await ProductService.deleteProduct(product.id);
                                          if (!mounted) return;
                                          _loadProducts(force: true);
                                        } catch (e) {
                                          if (!mounted) return;
                                          if (context.mounted) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(content: Text('Failed to delete: $e')),
                                            );
                                          }
                                        }
                                      }
                                    },
                                  ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            );
  }

  @override
  Widget build(BuildContext context) {
    final body = _buildBody();
    final useScaffold = widget.useScaffold ?? true;
    
    if (!useScaffold) {
      return body;
    }
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Products'),
        actions: [
          Switch(
            value: _showDeleted,
            onChanged: (value) {
              setState(() {
                _showDeleted = value;
              });
              _loadProducts(force: true);
            },
          ),
          const Padding(
            padding: EdgeInsets.only(right: 8.0),
            child: Text('Show deleted'),
          ),
        ],
      ),
      body: body,
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.pushNamed(context, '/add-product');
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
