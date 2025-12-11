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
  bool _bulkUpdatingStocks = false;
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

  Future<void> _handleResetAllStocks() async {
    if (_bulkUpdatingStocks) return;
    final hasNonZeroStock = _products.any((p) => p.deletedAt == null && p.stockQuantity != 0);
    if (!hasNonZeroStock) {
      if (mounted) {
        SnackbarHelper.showInfo(context, 'All stocks are already at 0');
      }
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset Stocks'),
        content: const Text('Set stock of all products to 0?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _bulkUpdatingStocks = true;
    });

    try {
      await ProductService.resetStocks();
      if (!mounted) return;

      final updatedList = _products.map((p) {
        if (p.deletedAt != null) return p;
        return p.copyWith(stockQuantity: 0);
      }).toList();

      setState(() {
        _products = updatedList;
        _filteredProducts = _filteredProducts.map((p) {
          if (p.deletedAt != null) return p;
          return p.copyWith(stockQuantity: 0);
        }).toList();
        _bulkUpdatingStocks = false;
      });
      _startItemAnimations();
      if (mounted) {
        SnackbarHelper.showSuccess(context, 'All stocks reset to 0');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _bulkUpdatingStocks = false;
      });
      SnackbarHelper.showError(context, 'Failed to reset stocks: ${e.toString()}');
    }
  }

  Widget _buildBody() {
    final bottomPadding = MediaQuery.of(context).padding.bottom + 72;
    if (_loading && _products.isEmpty) {
      return Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(
              children: [
                Expanded(
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
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: _bulkUpdatingStocks ? null : _handleResetAllStocks,
                  icon: _bulkUpdatingStocks
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.restart_alt, size: 18),
                  label: const Text('Empty stocks'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Colors.red),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
              ],
            ),
          ),
          const Expanded(child: ShimmerProductList()),
        ],
      );
    }

    Widget listChild;
    if (_products.isEmpty) {
      listChild = ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.fromLTRB(16, 24, 16, bottomPadding),
        children: [
          Center(
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
          ),
        ],
      );
    } else if (_filteredProducts.isEmpty) {
      listChild = ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.only(bottom: bottomPadding),
        children: const [
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Center(
              child: Text(
                'No products match your search',
                style: TextStyle(fontSize: 16),
              ),
            ),
          ),
        ],
      );
    } else {
      listChild = ListView.builder(
        padding: EdgeInsets.only(bottom: bottomPadding),
        itemCount: _filteredProducts.length,
        itemBuilder: (context, index) {
          final product = _filteredProducts[index];
          final isDeleted = product.deletedAt != null;
          final visible = index < _itemVisible.length ? _itemVisible[index] : true;
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
      );
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Row(
            children: [
              Expanded(
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
              ),
              const SizedBox(width: 8),
              OutlinedButton.icon(
                onPressed: _bulkUpdatingStocks ? null : _handleResetAllStocks,
                icon: _bulkUpdatingStocks
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.restart_alt, size: 18),
                label: const Text('Empty stocks'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            edgeOffset: 60,
            onRefresh: () => _loadProducts(force: true),
            child: listChild,
          ),
        ),
      ],
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
        child: Image.asset(
          'assets/add-product.png',
          width: 28,
          height: 28,
          fit: BoxFit.contain,
        ),
      ),
    );
  }
}
