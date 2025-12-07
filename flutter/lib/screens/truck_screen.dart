import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:siargao_trading_road/services/order_service.dart';
import 'package:siargao_trading_road/models/order.dart';

class TruckScreen extends StatefulWidget {
  const TruckScreen({super.key});

  @override
  State<TruckScreen> createState() => _TruckScreenState();
}

class _TruckScreenState extends State<TruckScreen> {
  Order? _draftOrder;
  bool _loading = true;
  bool _refreshing = false;
  int? _updatingItemId;
  bool _submitting = false;
  int? _supplierId;
  String _paymentMethod = 'cash_on_delivery';
  String _deliveryOption = 'pickup';
  final TextEditingController _shippingAddressController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
        _supplierId = args?['supplierId'] as int?;
        _loadDraftOrder();
      }
    });
  }

  @override
  void dispose() {
    _shippingAddressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadDraftOrder() async {
    if (!mounted) return;

    setState(() {
      if (!_refreshing) {
        _loading = true;
      }
    });

    try {
      final order = await OrderService.getDraftOrder(supplierId: _supplierId);
      if (mounted) {
        setState(() {
          _draftOrder = order;
          _loading = false;
          _refreshing = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _draftOrder = null;
          _loading = false;
          _refreshing = false;
        });
      }
    }
  }

  Future<void> _handleRefresh() async {
    setState(() {
      _refreshing = true;
    });
    await _loadDraftOrder();
  }

  Future<void> _handleUpdateQuantity(int itemId, int quantity) async {
    if (quantity < 1) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Quantity must be at least 1')),
        );
      }
      return;
    }

    setState(() {
      _updatingItemId = itemId;
    });

    try {
      final updatedOrder = await OrderService.updateOrderItem(itemId, quantity);
      if (mounted) {
        setState(() {
          _draftOrder = updatedOrder;
          _updatingItemId = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _updatingItemId = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update quantity: $e')),
        );
      }
    }
  }

  Future<void> _handleRemoveItem(int itemId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Item'),
        content: const Text('Are you sure you want to remove this item?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await OrderService.removeOrderItem(itemId);
        await _loadDraftOrder();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to remove item: $e')),
          );
        }
      }
    }
  }

  Future<void> _handleSubmitOrder() async {
    if (_draftOrder == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Submit Order'),
        content: Text(
          'Are you sure you want to submit this order for ₱${NumberFormat('#,##0.00').format(_draftOrder!.totalAmount)}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Submit'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() {
        _submitting = true;
      });

      try {
        final totalQuantity = _draftOrder!.orderItems.fold<int>(0, (sum, item) => sum + item.quantity);
        final deliveryFee = _deliveryOption == 'deliver' ? totalQuantity * 20.0 : 0.0;

        await OrderService.submitOrder(
          _draftOrder!.id,
          paymentMethod: _paymentMethod,
          deliveryOption: _deliveryOption,
          deliveryFee: deliveryFee,
          shippingAddress: _deliveryOption == 'deliver' ? _shippingAddressController.text.trim() : null,
          notes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Order submitted successfully!')),
          );
          Navigator.pop(context);
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _submitting = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to submit order: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Truck'),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_draftOrder == null || _draftOrder!.orderItems.isEmpty) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Truck'),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Your truck is empty',
                style: TextStyle(fontSize: 18),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Browse Suppliers'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Truck'),
      ),
      body: RefreshIndicator(
        onRefresh: _handleRefresh,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              margin: const EdgeInsets.only(bottom: 16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    if (_draftOrder!.supplier?.logoUrl != null &&
                        _draftOrder!.supplier!.logoUrl!.isNotEmpty)
                      CircleAvatar(
                        radius: 25,
                        backgroundImage: NetworkImage(_draftOrder!.supplier!.logoUrl!),
                      )
                    else
                      CircleAvatar(
                        radius: 25,
                        backgroundColor: Colors.blue,
                        child: Text(
                          _draftOrder!.supplier?.name != null &&
                                  _draftOrder!.supplier!.name.isNotEmpty
                              ? _draftOrder!.supplier!.name[0].toUpperCase()
                              : 'S',
                          style: const TextStyle(color: Colors.white, fontSize: 20),
                        ),
                      ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _draftOrder!.supplier?.name ?? 'Supplier',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            ..._draftOrder!.orderItems.map((item) {
              final isUpdating = _updatingItemId == item.id;
              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.product.name,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '₱${NumberFormat('#,##0.00').format(item.unitPrice)} each',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey[700],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete, color: Colors.red),
                            onPressed: isUpdating
                                ? null
                                : () => _handleRemoveItem(item.id),
                          ),
                        ],
                      ),
                      const Divider(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Quantity:',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey,
                            ),
                          ),
                          Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.remove),
                                onPressed: isUpdating || item.quantity <= 1
                                    ? null
                                    : () => _handleUpdateQuantity(item.id, item.quantity - 1),
                              ),
                              if (isUpdating)
                                const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              else
                                Text(
                                  '${item.quantity}',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              IconButton(
                                icon: const Icon(Icons.add),
                                onPressed: isUpdating
                                    ? null
                                    : () => _handleUpdateQuantity(item.id, item.quantity + 1),
                              ),
                            ],
                          ),
                          Text(
                            '₱${NumberFormat('#,##0.00').format(item.subtotal)}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }),
            Card(
              margin: const EdgeInsets.only(top: 8, bottom: 16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Payment Method',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    RadioListTile<String>(
                      title: const Text('Cash on Delivery'),
                      value: 'cash_on_delivery',
                      groupValue: _paymentMethod,
                      onChanged: (value) {
                        setState(() {
                          _paymentMethod = value!;
                        });
                      },
                    ),
                    RadioListTile<String>(
                      title: const Text('GCash'),
                      value: 'gcash',
                      groupValue: _paymentMethod,
                      onChanged: (value) {
                        setState(() {
                          _paymentMethod = value!;
                        });
                      },
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Delivery Method',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    RadioListTile<String>(
                      title: const Text('Pickup'),
                      value: 'pickup',
                      groupValue: _deliveryOption,
                      onChanged: (value) {
                        setState(() {
                          _deliveryOption = value!;
                        });
                      },
                    ),
                    RadioListTile<String>(
                      title: const Text('Deliver'),
                      value: 'deliver',
                      groupValue: _deliveryOption,
                      onChanged: (value) {
                        setState(() {
                          _deliveryOption = value!;
                        });
                      },
                    ),
                    if (_deliveryOption == 'deliver') ...[
                      const SizedBox(height: 16),
                      TextField(
                        controller: _shippingAddressController,
                        decoration: const InputDecoration(
                          labelText: 'Shipping Address',
                          border: OutlineInputBorder(),
                        ),
                        maxLines: 2,
                      ),
                    ],
                  ],
                ),
              ),
            ),
            Card(
              margin: const EdgeInsets.only(top: 8, bottom: 16),
              color: Colors.blue[50],
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Subtotal:',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '₱${NumberFormat('#,##0.00').format(_draftOrder!.totalAmount)}',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                    if (_deliveryOption == 'deliver') ...[
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Delivery Fee:',
                            style: TextStyle(fontSize: 16),
                          ),
                          Text(
                            '₱${NumberFormat('#,##0.00').format(_draftOrder!.orderItems.fold<int>(0, (sum, item) => sum + item.quantity) * 20.0)}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                    const Divider(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total:',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '₱${NumberFormat('#,##0.00').format(_draftOrder!.totalAmount + (_deliveryOption == 'deliver' ? _draftOrder!.orderItems.fold<int>(0, (sum, item) => sum + item.quantity) * 20.0 : 0.0))}',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                    if (_draftOrder!.totalAmount < 5000) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.orange[50],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.orange[200]!),
                        ),
                        child: Text(
                          'Minimum order amount is ₱5,000.00. Add ₱${NumberFormat('#,##0.00').format(5000 - _draftOrder!.totalAmount)} more to submit.',
                          style: TextStyle(
                            color: Colors.orange[900],
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    TextField(
                      controller: _notesController,
                      decoration: const InputDecoration(
                        labelText: 'Notes (Optional)',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 2,
                    ),
                  ],
                ),
              ),
            ),
            ElevatedButton(
              onPressed: (_submitting || 
                          _draftOrder!.totalAmount < 5000 || 
                          (_deliveryOption == 'deliver' && _shippingAddressController.text.trim().isEmpty)) 
                  ? null 
                  : _handleSubmitOrder,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                minimumSize: const Size(double.infinity, 50),
              ),
              child: _submitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text(
                      'Submit Order',
                      style: TextStyle(fontSize: 16),
                    ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
