import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
import 'package:siargao_trading_road/services/order_service.dart';
import 'package:siargao_trading_road/models/order.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<Order> _orders = [];
  bool _loading = true;
  String? _statusFilter;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() {
      _loading = true;
    });

    try {
      final orders = await OrderService.getOrders();
      setState(() {
        _orders = orders;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _loading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load orders: $e')),
        );
      }
    }
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

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
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
                    onRefresh: _loadOrders,
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
                                      arguments: {'order': order},
                                    );
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              'Order #${order.id}',
                                              style: const TextStyle(
                                                fontSize: 18,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            Chip(
                                              label: Text(_getStatusLabel(order.status)),
                                              backgroundColor: _getStatusColor(order.status).withOpacity(0.2),
                                              labelStyle: TextStyle(
                                                color: _getStatusColor(order.status),
                                              ),
                                            ),
                                          ],
                                        ),
                                        if (entity != null) ...[
                                          const SizedBox(height: 8),
                                          Text(
                                            entity.name,
                                            style: const TextStyle(fontSize: 14),
                                          ),
                                        ],
                                        const SizedBox(height: 8),
                                        Text(
                                          'Total: ₱${order.totalAmount.toStringAsFixed(2)}',
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.blue,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '${order.orderItems.length} item(s)',
                                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                                        ),
                                      ],
                                    ),
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
