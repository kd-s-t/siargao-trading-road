import 'package:flutter/material.dart';
import 'package:siargao_trading_road/services/supplier_service.dart';
import 'package:siargao_trading_road/models/supplier.dart';
import 'package:siargao_trading_road/widgets/shimmer_loading.dart';

class SuppliersScreen extends StatefulWidget {
  final bool? useScaffold;
  
  const SuppliersScreen({super.key, this.useScaffold});

  @override
  State<SuppliersScreen> createState() => _SuppliersScreenState();
}

class _SuppliersScreenState extends State<SuppliersScreen> {
  List<Supplier> _suppliers = [];
  bool _loading = true;
  bool _refreshing = false;
  String? _error;
  bool _isLoading = false;
  bool _hasLoaded = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && !_hasLoaded) {
        _loadSuppliers();
      }
    });
  }

  Future<void> _loadSuppliers({bool force = false}) async {
    if (_isLoading && !force) return;
    
    setState(() {
      _isLoading = true;
      if (!_refreshing) {
        _loading = true;
      }
      _error = null;
    });

    try {
      final suppliers = await SupplierService.getSuppliers();
      if (mounted) {
        setState(() {
          _suppliers = suppliers;
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
    await _loadSuppliers(force: true);
  }

  void _handleSupplierPress(Supplier supplier) {
    Navigator.pushNamed(
      context,
      '/supplier-products',
      arguments: {'supplierId': supplier.id},
    );
  }

  Widget _buildBody() {
    return _loading && _suppliers.isEmpty
          ? const ShimmerSupplierList()
          : RefreshIndicator(
              onRefresh: _handleRefresh,
              child: _error != null && _suppliers.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'Error loading suppliers',
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
                            onPressed: () => _loadSuppliers(force: true),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    )
                  : _suppliers.isEmpty
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'No suppliers available',
                                style: TextStyle(fontSize: 18),
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Suppliers will appear here once they register',
                                style: TextStyle(fontSize: 14, color: Colors.grey),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: EdgeInsets.only(
                            left: 16,
                            right: 16,
                            top: 16,
                            bottom: 16 + MediaQuery.of(context).padding.bottom,
                          ),
                          itemCount: _suppliers.length,
                          itemBuilder: (context, index) {
                            final supplier = _suppliers[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              child: InkWell(
                                onTap: () => _handleSupplierPress(supplier),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (supplier.bannerUrl != null && supplier.bannerUrl!.isNotEmpty)
                                      Image.network(
                                        supplier.bannerUrl!,
                                        width: double.infinity,
                                        height: 180,
                                        fit: BoxFit.cover,
                                        errorBuilder: (context, error, stackTrace) {
                                          return Container(
                                            height: 180,
                                            color: Colors.grey[300],
                                            child: const Icon(Icons.image_not_supported),
                                          );
                                        },
                                      ),
                                    Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              if (supplier.logoUrl != null && supplier.logoUrl!.isNotEmpty)
                                                CircleAvatar(
                                                  radius: 40,
                                                  backgroundImage: NetworkImage(supplier.logoUrl!),
                                                )
                                              else
                                                CircleAvatar(
                                                  radius: 40,
                                                  backgroundColor: Colors.blue,
                                                  child: Text(
                                                    supplier.name.isNotEmpty
                                                        ? supplier.name[0].toUpperCase()
                                                        : '?',
                                                    style: const TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 24,
                                                    ),
                                                  ),
                                                ),
                                              const SizedBox(width: 16),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Row(
                                                      children: [
                                                        Expanded(
                                                          child: Text(
                                                            supplier.name,
                                                            style: const TextStyle(
                                                              fontSize: 18,
                                                              fontWeight: FontWeight.bold,
                                                            ),
                                                          ),
                                                        ),
                                                        Chip(
                                                          label: Text(
                                                            (supplier.isOpen ?? true) ? 'Open' : 'Closed',
                                                            style: const TextStyle(
                                                              fontSize: 12,
                                                              color: Colors.white,
                                                            ),
                                                          ),
                                                          backgroundColor: (supplier.isOpen ?? true)
                                                              ? Colors.green
                                                              : Colors.red,
                                                          padding: const EdgeInsets.symmetric(
                                                            horizontal: 8,
                                                            vertical: 4,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                    const SizedBox(height: 4),
                                                    Text(
                                                      supplier.email,
                                                      style: TextStyle(
                                                        fontSize: 14,
                                                        color: Colors.grey[600],
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                          const Divider(),
                                          if (supplier.description.isNotEmpty)
                                            Padding(
                                              padding: const EdgeInsets.only(bottom: 12),
                                              child: Text(
                                                supplier.description,
                                                style: TextStyle(
                                                  fontSize: 14,
                                                  color: Colors.grey[800],
                                                ),
                                              ),
                                            ),
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              const Text(
                                                'Products Available:',
                                                style: TextStyle(
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w600,
                                                  color: Colors.grey,
                                                ),
                                              ),
                                              Text(
                                                '${supplier.productCount}',
                                                style: const TextStyle(
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.bold,
                                                  color: Colors.blue,
                                                ),
                                              ),
                                            ],
                                          ),
                                          if (supplier.phone.isNotEmpty) ...[
                                            const SizedBox(height: 8),
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                const Text(
                                                  'Phone:',
                                                  style: TextStyle(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.w600,
                                                    color: Colors.grey,
                                                  ),
                                                ),
                                                Text(
                                                  supplier.phone,
                                                  style: const TextStyle(fontSize: 14),
                                                ),
                                              ],
                                            ),
                                          ],
                                          if (supplier.openingTime != null ||
                                              supplier.closingTime != null) ...[
                                            const SizedBox(height: 8),
                                            const Divider(),
                                            Container(
                                              padding: const EdgeInsets.all(12),
                                              decoration: BoxDecoration(
                                                color: Colors.blue.shade50,
                                                borderRadius: BorderRadius.circular(8),
                                                border: Border.all(color: Colors.blue.shade200),
                                              ),
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Row(
                                                    children: [
                                                      Icon(
                                                        Icons.access_time,
                                                        size: 16,
                                                        color: Colors.blue.shade700,
                                                      ),
                                                      const SizedBox(width: 6),
                                                      Text(
                                                        'Available Hours',
                                                        style: TextStyle(
                                                          fontSize: 14,
                                                          fontWeight: FontWeight.bold,
                                                          color: Colors.blue.shade700,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                  const SizedBox(height: 8),
                                                  if (supplier.openingTime != null && supplier.openingTime!.trim().isNotEmpty &&
                                                      supplier.closingTime != null && supplier.closingTime!.trim().isNotEmpty)
                                                    Row(
                                                      children: [
                                                        Icon(
                                                          Icons.schedule,
                                                          size: 14,
                                                          color: Colors.grey[700],
                                                        ),
                                                        const SizedBox(width: 6),
                                                        Text(
                                                          '${supplier.openingTime!} - ${supplier.closingTime!}',
                                                          style: TextStyle(
                                                            fontSize: 13,
                                                            fontWeight: FontWeight.w600,
                                                            color: Colors.grey[800],
                                                          ),
                                                        ),
                                                      ],
                                                    )
                                                  else if (supplier.openingTime != null && supplier.openingTime!.trim().isNotEmpty)
                                                    Row(
                                                      children: [
                                                        Icon(
                                                          Icons.schedule,
                                                          size: 14,
                                                          color: Colors.grey[700],
                                                        ),
                                                        const SizedBox(width: 6),
                                                        Text(
                                                          'Opens: ${supplier.openingTime!}',
                                                          style: TextStyle(
                                                            fontSize: 13,
                                                            color: Colors.grey[800],
                                                          ),
                                                        ),
                                                      ],
                                                    )
                                                  else if (supplier.closingTime != null && supplier.closingTime!.trim().isNotEmpty)
                                                    Row(
                                                      children: [
                                                        Icon(
                                                          Icons.schedule,
                                                          size: 14,
                                                          color: Colors.grey[700],
                                                        ),
                                                        const SizedBox(width: 6),
                                                        Text(
                                                          'Closes: ${supplier.closingTime!}',
                                                          style: TextStyle(
                                                            fontSize: 13,
                                                            color: Colors.grey[800],
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
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
        title: const Text('Suppliers'),
      ),
      body: SafeArea(
        child: body,
      ),
    );
  }
}
