import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
import 'package:siargao_trading_road/services/order_service.dart';
import 'package:siargao_trading_road/models/order.dart';
import 'package:siargao_trading_road/services/api_service.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<Order> _orders = [];
  bool _loading = true;
  bool _refreshing = false;
  String? _statusFilter;
  String? _error;
  int? _updatingStatus;
  bool _isLoading = false;
  bool _hasLoaded = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && !_hasLoaded) {
        _loadOrders();
      }
    });
  }

  Future<void> _loadOrders({bool force = false}) async {
    if (_isLoading && !force) return;
    
    setState(() {
      _isLoading = true;
      if (!_refreshing) {
        _loading = true;
      }
      _error = null;
    });

    try {
      final orders = await OrderService.getOrders();
      if (mounted) {
        setState(() {
          _orders = orders;
          _loading = false;
          _refreshing = false;
          _isLoading = false;
          _hasLoaded = true;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
          _refreshing = false;
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleRefresh() async {
    setState(() {
      _refreshing = true;
    });
    await _loadOrders(force: true);
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'preparing':
        return Colors.orange;
      case 'in_transit':
        return Colors.blue;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'preparing':
        return 'Preparing';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  Future<void> _handleUpdateStatus(int orderId, String status) async {
    setState(() {
      _updatingStatus = orderId;
    });

    try {
      await OrderService.updateOrderStatus(orderId, status);
      await _loadOrders(force: true);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Order status updated to ${_getStatusLabel(status)}')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update status: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _updatingStatus = null;
        });
      }
    }
  }

  Future<void> _handleDownloadInvoice(Order order) async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Downloading invoice...')),
      );

      final invoiceUrl = '${ApiService.baseUrl}/orders/${order.id}/invoice';
      
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      final response = await http.get(
        Uri.parse(invoiceUrl),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final directory = await getApplicationDocumentsDirectory();
        final date = order.createdAt.toIso8601String().split('T')[0];
        final entityName = order.store?.name ?? order.supplier?.name ?? 'Store';
        final sanitizedName = entityName.replaceAll(RegExp(r'[^a-zA-Z0-9\s-]'), '').replaceAll(' ', '-').toLowerCase();
        final fileName = 'invoice-$date-$sanitizedName-${order.id}.pdf';
        final file = File('${directory.path}/$fileName');
        
        await file.writeAsBytes(response.bodyBytes);
        
        final xFile = XFile(file.path);
        await Share.shareXFiles([xFile]);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Invoice downloaded successfully')),
          );
        }
      } else {
        throw Exception('Failed to download invoice');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to download invoice: $e')),
        );
      }
    }
  }

  void _handleMarkDelivered(int orderId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Mark as Delivered'),
        content: const Text('Are you sure you want to mark this order as delivered?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _handleUpdateStatus(orderId, 'delivered');
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;

    final filteredOrders = _statusFilter != null
        ? _orders.where((order) => order.status == _statusFilter).toList()
        : _orders;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Orders'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Error loading orders',
                        style: TextStyle(color: Colors.red[700], fontSize: 18),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _error!,
                        style: const TextStyle(color: Colors.grey),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadOrders,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          _buildFilterChip('All', null),
                          _buildFilterChip('Draft', 'draft'),
                          _buildFilterChip('Preparing', 'preparing'),
                          _buildFilterChip('In Transit', 'in_transit'),
                          _buildFilterChip('Delivered', 'delivered'),
                          _buildFilterChip('Cancelled', 'cancelled'),
                        ],
                      ),
                    ),
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: _handleRefresh,
                        child: filteredOrders.isEmpty
                            ? Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Text(
                                      'No orders',
                                      style: TextStyle(fontSize: 18),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      _statusFilter != null
                                          ? 'Try selecting a different filter'
                                          : 'Your orders will appear here once you place them',
                                      style: const TextStyle(color: Colors.grey),
                                    ),
                                  ],
                                ),
                              )
                            : ListView.builder(
                                padding: const EdgeInsets.all(16),
                                itemCount: filteredOrders.length,
                                itemBuilder: (context, index) {
                                  final order = filteredOrders[index];
                                  final isStore = user?.role == 'store';
                                  final entity = isStore ? order.supplier : order.store;

                                  return Card(
                                    margin: const EdgeInsets.only(bottom: 16),
                                    child: InkWell(
                                      onTap: () {
                                        Navigator.pushNamed(
                                          context,
                                          '/order-detail',
                                          arguments: {
                                            'orderId': order.id,
                                          },
                                        );
                                      },
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          if (entity?.bannerUrl != null && entity!.bannerUrl!.isNotEmpty)
                                            Image.network(
                                              entity.bannerUrl!,
                                              width: double.infinity,
                                              height: 120,
                                              fit: BoxFit.cover,
                                              errorBuilder: (context, error, stackTrace) {
                                                return Container(
                                                  height: 120,
                                                  color: Colors.grey[300],
                                                );
                                              },
                                            ),
                                          Padding(
                                            padding: const EdgeInsets.all(16),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                  children: [
                                                    Expanded(
                                                      child: Row(
                                                        children: [
                                                          if (entity?.logoUrl != null && entity!.logoUrl!.isNotEmpty)
                                                            CircleAvatar(
                                                              radius: 25,
                                                              backgroundImage: NetworkImage(entity.logoUrl!),
                                                            )
                                                          else
                                                            CircleAvatar(
                                                              radius: 25,
                                                              backgroundColor: Colors.blue,
                                                              child: Text(
                                                                entity?.name.isNotEmpty == true
                                                                    ? entity!.name[0].toUpperCase()
                                                                    : '?',
                                                                style: const TextStyle(color: Colors.white),
                                                              ),
                                                            ),
                                                          const SizedBox(width: 12),
                                                          Expanded(
                                                            child: Column(
                                                              crossAxisAlignment: CrossAxisAlignment.start,
                                                              children: [
                                                                Text(
                                                                  'Order #${order.id}',
                                                                  style: const TextStyle(
                                                                    fontSize: 18,
                                                                    fontWeight: FontWeight.bold,
                                                                  ),
                                                                ),
                                                                if (entity != null)
                                                                  Text(
                                                                    entity.name,
                                                                    style: const TextStyle(
                                                                      fontSize: 14,
                                                                      color: Colors.grey,
                                                                    ),
                                                                  ),
                                                              ],
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                    Chip(
                                                      label: Text(_getStatusLabel(order.status)),
                                                      backgroundColor: _getStatusColor(order.status).withOpacity(0.2),
                                                      labelStyle: TextStyle(
                                                        color: _getStatusColor(order.status),
                                                        fontSize: 12,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                const Divider(),
                                                Row(
                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                  children: [
                                                    const Text(
                                                      'Total Amount:',
                                                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                                    ),
                                                    Text(
                                                      '₱${NumberFormat('#,##0.00').format(order.totalAmount)}',
                                                      style: const TextStyle(
                                                        fontSize: 16,
                                                        fontWeight: FontWeight.bold,
                                                        color: Colors.blue,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                const SizedBox(height: 4),
                                                Row(
                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                  children: [
                                                    const Text(
                                                      'Items:',
                                                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                                    ),
                                                    Text(
                                                      '${order.orderItems.length} item(s)',
                                                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                                                    ),
                                                  ],
                                                ),
                                                const SizedBox(height: 4),
                                                Row(
                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                  children: [
                                                    const Text(
                                                      'Date:',
                                                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                                    ),
                                                    Text(
                                                      '${order.createdAt.day}/${order.createdAt.month}/${order.createdAt.year}',
                                                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                                                    ),
                                                  ],
                                                ),
                                                if (order.shippingAddress != null && order.shippingAddress!.isNotEmpty) ...[
                                                  const Divider(),
                                                  Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      const Text(
                                                        'Shipping Address:',
                                                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                                      ),
                                                      const SizedBox(height: 4),
                                                      Text(
                                                        order.shippingAddress!,
                                                        style: const TextStyle(fontSize: 12),
                                                      ),
                                                    ],
                                                  ),
                                                ],
                                                if (order.notes != null && order.notes!.isNotEmpty) ...[
                                                  const Divider(),
                                                  Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      const Text(
                                                        'Notes:',
                                                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                                      ),
                                                      const SizedBox(height: 4),
                                                      Text(
                                                        order.notes!,
                                                        style: const TextStyle(fontSize: 12),
                                                      ),
                                                    ],
                                                  ),
                                                ],
                                                if (order.orderItems.isNotEmpty) ...[
                                                  const Divider(),
                                                  const Text(
                                                    'Order Items:',
                                                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                                  ),
                                                  const SizedBox(height: 8),
                                                  ...order.orderItems.map((item) => Padding(
                                                        padding: const EdgeInsets.only(bottom: 8),
                                                        child: Row(
                                                          children: [
                                                            if (item.product.imageUrl != null && item.product.imageUrl!.isNotEmpty)
                                                              ClipRRect(
                                                                borderRadius: BorderRadius.circular(8),
                                                                child: Image.network(
                                                                  item.product.imageUrl!,
                                                                  width: 60,
                                                                  height: 60,
                                                                  fit: BoxFit.cover,
                                                                  errorBuilder: (context, error, stackTrace) {
                                                                    return Container(
                                                                      width: 60,
                                                                      height: 60,
                                                                      color: Colors.grey[300],
                                                                      child: const Icon(Icons.image_not_supported),
                                                                    );
                                                                  },
                                                                ),
                                                              )
                                                            else
                                                              Container(
                                                                width: 60,
                                                                height: 60,
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
                                                                    item.product.name,
                                                                    style: const TextStyle(fontWeight: FontWeight.w600),
                                                                  ),
                                                                  Text(
                                                                    '${item.quantity} x ₱${NumberFormat('#,##0.00').format(item.unitPrice)} = ₱${NumberFormat('#,##0.00').format(item.subtotal)}',
                                                                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                                                                  ),
                                                                ],
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                      )),
                                                ],
                                                const Divider(),
                                                Wrap(
                                                  spacing: 8,
                                                  runSpacing: 8,
                                                  children: [
                                                    OutlinedButton.icon(
                                                      onPressed: () => _handleDownloadInvoice(order),
                                                      icon: const Icon(Icons.download),
                                                      label: const Text('Download Invoice'),
                                                    ),
                                                    if (user?.role == 'supplier' && order.status == 'preparing') ...[
                                                      OutlinedButton(
                                                        onPressed: _updatingStatus == order.id
                                                            ? null
                                                            : () => _handleUpdateStatus(order.id, 'in_transit'),
                                                        child: _updatingStatus == order.id
                                                            ? const SizedBox(
                                                                width: 16,
                                                                height: 16,
                                                                child: CircularProgressIndicator(strokeWidth: 2),
                                                              )
                                                            : const Text('Mark In Transit'),
                                                      ),
                                                      OutlinedButton(
                                                        onPressed: _updatingStatus == order.id
                                                            ? null
                                                            : () => _handleMarkDelivered(order.id),
                                                        child: const Text('Mark Delivered'),
                                                      ),
                                                    ],
                                                    if (user?.role == 'supplier' && order.status == 'in_transit')
                                                      OutlinedButton(
                                                        onPressed: _updatingStatus == order.id
                                                            ? null
                                                            : () => _handleMarkDelivered(order.id),
                                                        child: _updatingStatus == order.id
                                                            ? const SizedBox(
                                                                width: 16,
                                                                height: 16,
                                                                child: CircularProgressIndicator(strokeWidth: 2),
                                                              )
                                                            : const Text('Mark Delivered'),
                                                      ),
                                                    if (user?.role == 'supplier' && order.status == 'delivered')
                                                      OutlinedButton(
                                                        onPressed: _updatingStatus == order.id
                                                            ? null
                                                            : () => _handleUpdateStatus(order.id, 'in_transit'),
                                                        child: _updatingStatus == order.id
                                                            ? const SizedBox(
                                                                width: 16,
                                                                height: 16,
                                                                child: CircularProgressIndicator(strokeWidth: 2),
                                                              )
                                                            : const Text('Revert to In Transit'),
                                                      ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildFilterChip(String label, String? value) {
    final isSelected = _statusFilter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          setState(() {
            _statusFilter = selected ? value : null;
          });
        },
      ),
    );
  }
}

