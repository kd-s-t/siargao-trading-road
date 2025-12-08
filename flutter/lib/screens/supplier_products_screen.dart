import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:siargao_trading_road/services/supplier_service.dart';
import 'package:siargao_trading_road/services/order_service.dart';
import 'package:siargao_trading_road/models/product.dart';
import 'package:siargao_trading_road/models/order.dart';
import 'package:siargao_trading_road/models/supplier.dart';
import 'package:siargao_trading_road/widgets/shimmer_loading.dart';

class SupplierProductsScreen extends StatefulWidget {
  final int supplierId;

  const SupplierProductsScreen({super.key, required this.supplierId});

  @override
  State<SupplierProductsScreen> createState() => _SupplierProductsScreenState();
}

class _SupplierProductsScreenState extends State<SupplierProductsScreen> {
  List<Product> _products = [];
  Supplier? _supplier;
  Order? _draftOrder;
  bool _loading = true;
  bool _refreshing = false;
  String? _error;
  final Map<int, String> _quantities = {};
  int? _addingToTruck;
  bool _isLoading = false;
  bool _hasLoaded = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && !_hasLoaded) {
        _loadData();
      }
    });
  }

  Future<void> _loadData({bool force = false}) async {
    if (_isLoading && !force) return;
    
    if (widget.supplierId <= 0) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'Invalid supplier ID. Please go back and try again.';
        });
      }
      return;
    }

    setState(() {
      _isLoading = true;
      if (!_refreshing) {
        _loading = true;
      }
      _error = null;
    });

    try {
      await Future.wait([
        _loadSupplier(),
        _loadProducts(),
        _loadDraftOrder(),
      ]);
      if (mounted) {
        setState(() {
          _loading = false;
          _refreshing = false;
          _isLoading = false;
          _hasLoaded = true;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load data: ${e.toString()}';
          _loading = false;
          _refreshing = false;
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadSupplier() async {
    try {
      final suppliers = await SupplierService.getSuppliers();
      final supplier = suppliers.firstWhere(
        (s) => s.id == widget.supplierId,
      );
      if (mounted) {
        setState(() {
          _supplier = supplier;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load supplier information';
        });
      }
    }
  }

  Future<void> _loadProducts() async {
    setState(() {
      if (!_refreshing) {
        _loading = true;
      }
      _error = null;
    });

    try {
      final products = await SupplierService.getSupplierProducts(widget.supplierId);
      if (mounted) {
        setState(() {
          _products = products;
          _loading = false;
          _refreshing = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
          _refreshing = false;
        });
      }
    }
  }

  Future<void> _loadDraftOrder() async {
    try {
      final order = await OrderService.getDraftOrder(supplierId: widget.supplierId);
      if (mounted) {
        setState(() {
          _draftOrder = order;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _draftOrder = null;
        });
      }
    }
  }

  Future<void> _handleRefresh() async {
    setState(() {
      _refreshing = true;
    });
    await _loadData(force: true);
  }

  Future<void> _handleAddToTruck(Product product) async {
    final quantityStr = _quantities[product.id] ?? '1';
    final quantity = int.tryParse(quantityStr) ?? 1;

    if (quantity <= 0) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Quantity must be greater than 0')),
        );
      }
      return;
    }

    if (quantity > product.stockQuantity) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Only ${product.stockQuantity} ${product.unit ?? 'units'} available in stock',
            ),
          ),
        );
      }
      return;
    }

    setState(() {
      _addingToTruck = product.id;
    });

    try {
      Order? draftOrder = await OrderService.getDraftOrder(supplierId: widget.supplierId);

      draftOrder ??= await OrderService.createDraftOrder(widget.supplierId);

      final existingItems = draftOrder.orderItems.where(
        (item) => item.productId == product.id,
      ).toList();

      if (existingItems.isNotEmpty) {
        final existingItem = existingItems.first;
        final totalQuantity = existingItem.quantity + quantity;
        if (totalQuantity > product.stockQuantity) {
          final available = product.stockQuantity - existingItem.quantity;
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'You already have ${existingItem.quantity} ${product.unit ?? 'units'} in truck. Only $available ${product.unit ?? 'units'} more available.',
                ),
              ),
            );
          }
          setState(() {
            _addingToTruck = null;
          });
          return;
        }
      }

      final updatedOrder = await OrderService.addOrderItem(draftOrder.id, product.id, quantity);
      
      if (mounted) {
        setState(() {
          _draftOrder = updatedOrder;
          _quantities[product.id] = '';
          _addingToTruck = null;
        });
        await _loadProducts();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Item added to truck')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _addingToTruck = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to add item to truck: $e')),
        );
      }
    }
  }

  int _getTotalItemsCount() {
    if (_draftOrder?.orderItems == null) return 0;
    return _draftOrder!.orderItems.fold(0, (sum, item) => sum + item.quantity);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: _supplier != null
            ? Row(
                children: [
                  if (_supplier!.logoUrl != null && _supplier!.logoUrl!.isNotEmpty)
                    CircleAvatar(
                      radius: 16,
                      backgroundImage: NetworkImage(_supplier!.logoUrl!),
                    )
                  else
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: Colors.blue,
                      child: Text(
                        _supplier!.name.isNotEmpty
                            ? _supplier!.name[0].toUpperCase()
                            : '?',
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                      ),
                    ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _supplier!.name,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              )
            : const Text('Supplier Products'),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.local_shipping),
                onPressed: () {
                  Navigator.pushNamed(
                    context,
                    '/truck',
                    arguments: {'supplierId': widget.supplierId},
                  ).then((_) => _loadDraftOrder());
                },
              ),
              if (_getTotalItemsCount() > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      '${_getTotalItemsCount()}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: _loading && _products.isEmpty
          ? const ShimmerProductList()
          : RefreshIndicator(
              onRefresh: _handleRefresh,
              child: _error != null && _products.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'Error loading products',
                            style: TextStyle(fontSize: 18, color: Colors.red),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _error!,
                            style: const TextStyle(fontSize: 14, color: Colors.grey),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _loadProducts,
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    )
                  : _products.isEmpty
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'No products available',
                                style: TextStyle(fontSize: 18),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'This supplier has no products yet',
                                style: TextStyle(fontSize: 14, color: Colors.grey),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _products.length,
                          itemBuilder: (context, index) {
                            final product = _products[index];
                            final existingItems = _draftOrder?.orderItems.where(
                              (item) => item.productId == product.id,
                            ).toList() ?? [];
                            final inTruckQuantity = existingItems.isNotEmpty ? existingItems.first.quantity : 0;
                            
                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        if (product.imageUrl != null && product.imageUrl!.isNotEmpty)
                                          ClipRRect(
                                            borderRadius: BorderRadius.circular(8),
                                            child: Image.network(
                                              product.imageUrl!,
                                              width: 80,
                                              height: 80,
                                              fit: BoxFit.cover,
                                              errorBuilder: (context, error, stackTrace) {
                                                return Container(
                                                  width: 80,
                                                  height: 80,
                                                  color: Colors.grey[300],
                                                  child: const Icon(Icons.image_not_supported),
                                                );
                                              },
                                            ),
                                          )
                                        else
                                          Container(
                                            width: 80,
                                            height: 80,
                                            decoration: BoxDecoration(
                                              color: Colors.grey[300],
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: const Icon(Icons.image_not_supported, size: 30),
                                          ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                product.name,
                                                style: const TextStyle(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                '₱${NumberFormat('#,##0.00').format(product.price)}',
                                                style: const TextStyle(
                                                  fontSize: 20,
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.blue,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (product.description != null && product.description!.isNotEmpty) ...[
                                      const SizedBox(height: 8),
                                      Text(
                                        product.description!,
                                        style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                                      ),
                                    ],
                                    const Divider(),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        if (product.sku.isNotEmpty) ...[
                                          const Text(
                                            'SKU:',
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.grey,
                                            ),
                                          ),
                                          Text(
                                            product.sku,
                                            style: const TextStyle(fontSize: 14),
                                          ),
                                        ],
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        const Text(
                                          'Stock:',
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.grey,
                                          ),
                                        ),
                                        Text(
                                          '${product.stockQuantity}${product.unit != null ? ' ${product.unit}' : ' units'}',
                                          style: const TextStyle(fontSize: 14),
                                        ),
                                      ],
                                    ),
                                    if (product.category != null && product.category!.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          const Text(
                                            'Category:',
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.grey,
                                            ),
                                          ),
                                          Text(
                                            product.category!,
                                            style: const TextStyle(fontSize: 14),
                                          ),
                                        ],
                                      ),
                                    ],
                                    if (inTruckQuantity > 0) ...[
                                      const SizedBox(height: 8),
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: Colors.blue[50],
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(Icons.shopping_cart, size: 16, color: Colors.blue),
                                            const SizedBox(width: 8),
                                            Text(
                                              'In truck: $inTruckQuantity ${product.unit ?? 'units'}',
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: Colors.blue,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: TextField(
                                            controller: TextEditingController(
                                              text: _quantities[product.id] ?? '',
                                            )..selection = TextSelection.collapsed(
                                              offset: (_quantities[product.id] ?? '').length,
                                            ),
                                            decoration: const InputDecoration(
                                              labelText: 'Quantity',
                                              border: OutlineInputBorder(),
                                              hintText: '1',
                                            ),
                                            keyboardType: TextInputType.number,
                                            onChanged: (value) {
                                              setState(() {
                                                _quantities[product.id] = value;
                                              });
                                            },
                                            enabled: _addingToTruck != product.id,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          flex: 2,
                                          child: ElevatedButton.icon(
                                            onPressed: (_addingToTruck == product.id || product.stockQuantity == 0)
                                                ? null
                                                : () => _handleAddToTruck(product),
                                            icon: _addingToTruck == product.id
                                                ? const SizedBox(
                                                    width: 16,
                                                    height: 16,
                                                    child: CircularProgressIndicator(strokeWidth: 2),
                                                  )
                                                : const Icon(Icons.local_shipping),
                                            label: const Text('Add to Truck'),
                                            style: ElevatedButton.styleFrom(
                                              padding: const EdgeInsets.symmetric(vertical: 16),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
    );
  }
}
