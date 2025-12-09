import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:siargao_trading_road/services/product_service.dart';
import 'package:siargao_trading_road/models/product.dart';
import 'package:siargao_trading_road/widgets/shimmer_loading.dart';
import 'package:siargao_trading_road/utils/snackbar_helper.dart';

class ProductsScreen extends StatefulWidget {
  final bool? useScaffold;
  
  const ProductsScreen({super.key, this.useScaffold});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  List<Product> _products = [];
  List<Product> _filteredProducts = [];
  bool _loading = true;
  bool _showDeleted = false;
  bool _isLoading = false;
  bool _hasLoaded = false;
  final List<bool> _itemVisible = [];
  final List<Timer> _animationTimers = [];
  String _searchQuery = '';
  bool _updatingStock = false;
  Timer? _searchDebounce;

  void addProduct(Product product) {
    if (mounted) {
      setState(() {
        _products.insert(0, product);
      });
      _startItemAnimations();
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && !_hasLoaded) {
        _loadProducts();
      }
    });
  }

  @override
  void dispose() {
    for (final timer in _animationTimers) {
      timer.cancel();
    }
    _searchDebounce?.cancel();
    super.dispose();
  }

  void _startItemAnimations() {
    for (final timer in _animationTimers) {
      timer.cancel();
    }
    _animationTimers.clear();
    _itemVisible.clear();
    _itemVisible.addAll(List<bool>.filled(_filteredProducts.length, false));
    
    for (var i = 0; i < _filteredProducts.length; i++) {
      final timer = Timer(Duration(milliseconds: 100 + i * 90), () {
        if (mounted && i < _itemVisible.length) {
          setState(() {
            _itemVisible[i] = true;
          });
        }
      });
      _animationTimers.add(timer);
    }
  }

  Future<void> _loadProducts({bool force = false}) async {
    if (_isLoading && !force) return;
    
    setState(() {
      _loading = true;
      _isLoading = true;
    });

    try {
      final products = await ProductService.getProducts(
        includeDeleted: _showDeleted,
        search: _searchQuery.trim().isEmpty ? null : _searchQuery,
      );
      if (mounted) {
        setState(() {
          _products = products;
          _filteredProducts = products;
          _loading = false;
          _isLoading = false;
          _hasLoaded = true;
        });
        _startItemAnimations();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _isLoading = false;
        });
        SnackbarHelper.showError(context, 'Failed to load products: ${e.toString()}');
      }
    }
  }

  Future<void> _handleUpdateStock(Product product) async {
    if (_updatingStock) return;
    final controller = TextEditingController(text: product.stockQuantity.toString());
    final newQuantity = await showDialog<int>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Update stock'),
          content: TextField(
            controller: controller,
            autofocus: true,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Stock quantity',
              border: OutlineInputBorder(),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                final parsed = int.tryParse(controller.text.trim());
                if (parsed == null || parsed < 0) {
                  Navigator.pop(context);
                  SnackbarHelper.showError(context, 'Enter a valid quantity');
                  return;
                }
                Navigator.pop(context, parsed);
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    );

    if (newQuantity == null || newQuantity == product.stockQuantity) return;

    setState(() {
      _updatingStock = true;
    });

    try {
      final updated = await ProductService.updateProduct(
        product.id,
        stockQuantity: newQuantity,
      );
      if (!mounted) return;
      setState(() {
        _products = _products.map((p) => p.id == product.id ? updated : p).toList();
        _filteredProducts = _filteredProducts.map((p) => p.id == product.id ? updated : p).toList();
        _updatingStock = false;
      });
      _startItemAnimations();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _updatingStock = false;
      });
      SnackbarHelper.showError(context, 'Failed to update stock: ${e.toString()}');
    }
  }

  Widget _buildSearchField() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: TextField(
        decoration: const InputDecoration(
          hintText: 'Search products',
          prefixIcon: Icon(Icons.search),
          border: OutlineInputBorder(),
          isDense: true,
          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
        onChanged: (value) {
          _searchDebounce?.cancel();
          setState(() {
            _searchQuery = value;
          });
          _searchDebounce = Timer(const Duration(milliseconds: 350), () {
            if (mounted) {
              _loadProducts(force: true);
            }
          });
        },
      ),
    );
  }

  Widget _buildBody() {
    return _loading
          ? const ShimmerProductList()
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
                      padding: const EdgeInsets.only(bottom: 16),
                      itemCount: (_filteredProducts.isEmpty ? 2 : _filteredProducts.length + 1),
                      itemBuilder: (context, index) {
                        if (index == 0) {
                          return _buildSearchField();
                        }
                        if (_filteredProducts.isEmpty && index == 1) {
                          return const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            child: Center(
                              child: Text(
                                'No products match your search',
                                style: TextStyle(fontSize: 16),
                              ),
                            ),
                          );
                        }
                        final productIndex = index - 1;
                        final product = _filteredProducts[productIndex];
                        final isDeleted = product.deletedAt != null;
                        final visible = productIndex < _itemVisible.length ? _itemVisible[productIndex] : true;
                        return AnimatedOpacity(
                          duration: const Duration(milliseconds: 360),
                          curve: Curves.easeOut,
                          opacity: visible ? 1 : 0,
                          child: AnimatedSlide(
                            duration: const Duration(milliseconds: 360),
                            curve: Curves.easeOut,
                            offset: visible ? Offset.zero : const Offset(0, 0.12),
                            child: Card(
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
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('₱${NumberFormat('#,##0.00').format(product.price)}'),
                                    Text(
                                      'Stock: ${product.stockQuantity}',
                                      style: const TextStyle(color: Colors.grey),
                                    ),
                                  ],
                                ),
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
                                              SnackbarHelper.showError(context, 'Failed to restore: ${e.toString()}');
                                            }
                                          }
                                        },
                                      )
                                    else ...[
                                      IconButton(
                                        icon: const Icon(Icons.inventory_2),
                                        onPressed: _updatingStock ? null : () => _handleUpdateStock(product),
                                      ),
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
                                    ],
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
                                                SnackbarHelper.showError(context, 'Failed to delete: ${e.toString()}');
                                              }
                                            }
                                          }
                                        },
                                      ),
                                  ],
                                ),
                              ),
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
      body: SafeArea(
        child: body,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.pushNamed(context, '/add-product');
          if (result is Product && mounted) {
            setState(() {
              _products.insert(0, result);
            });
            _startItemAnimations();
          }
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
