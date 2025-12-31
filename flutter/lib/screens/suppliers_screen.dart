import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:siargao_trading_road/services/supplier_service.dart';
import 'package:siargao_trading_road/models/supplier.dart';
import 'package:siargao_trading_road/widgets/shimmer_loading.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

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
  String _searchQuery = '';
  String _statusFilter = 'all';
  Timer? _searchDebounce;
  bool _showMapView = false;
  final MapController _mapController = MapController();
  static const LatLng _siargaoCenter = LatLng(9.8563, 126.0483);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && !_hasLoaded) {
        _loadSuppliers();
      }
    });
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    super.dispose();
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
      final suppliers = await SupplierService.getSuppliers(
        search: _searchQuery.trim().isEmpty ? null : _searchQuery,
        status: _statusFilter == 'all' ? null : _statusFilter,
      );
      suppliers.sort((a, b) {
        final aOpen = _isSupplierOpenNow(a) ?? false;
        final bOpen = _isSupplierOpenNow(b) ?? false;
        if (aOpen == bOpen) {
          return a.name.toLowerCase().compareTo(b.name.toLowerCase());
        }
        return aOpen ? -1 : 1;
      });
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
    if (!mounted) return;
    Navigator.pushNamed(
      context,
      '/supplier-products',
      arguments: {'supplierId': supplier.id},
    );
  }

  DateTime? _parseTime(String? value) {
    if (value == null) return null;
    final trimmed = value.trim();
    if (trimmed.isEmpty) return null;
    final parts = trimmed.split(':');
    if (parts.length < 2) return null;
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) return null;
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day, hour, minute);
  }

  String _formatTime(String? value) {
    final parsed = _parseTime(value);
    if (parsed != null) {
      return DateFormat('h:mm a').format(parsed);
    }
    final trimmed = (value ?? '').trim();
    return trimmed.replaceFirst(RegExp(r'^0+(?=\d)'), '');
  }

  bool? _isSupplierOpenNow(Supplier supplier) {
    final opening = _parseTime(supplier.openingTime);
    final closing = _parseTime(supplier.closingTime);
    if (opening != null && closing != null) {
      var closesAt = closing;
      if (!closing.isAfter(opening)) {
        closesAt = closing.add(const Duration(days: 1));
      }
      final now = DateTime.now();
      return (now.isAtSameMomentAs(opening) || now.isAfter(opening)) &&
          now.isBefore(closesAt);
    }
    return supplier.isOpen;
  }

  String _getNextOpeningMessage(String? openingTime) {
    if (openingTime == null || openingTime.trim().isEmpty) {
      return 'Opens tomorrow';
    }
    
    final opening = _parseTime(openingTime);
    if (opening == null) {
      return 'Opens tomorrow at ${_formatTime(openingTime)}';
    }
    
    final now = DateTime.now();
    DateTime nextOpening;
    
    if (opening.isAfter(now)) {
      nextOpening = opening;
    } else {
      nextOpening = opening.add(const Duration(days: 1));
    }
    
    final difference = nextOpening.difference(now);
    final hours = difference.inHours;
    final minutes = difference.inMinutes % 60;
    
    if (nextOpening.day == now.day) {
      if (hours > 0) {
        return 'Opens today in $hours ${hours == 1 ? 'hour' : 'hours'}';
      } else if (minutes > 0) {
        return 'Opens today in $minutes ${minutes == 1 ? 'minute' : 'minutes'}';
      } else {
        return 'Opens today at ${_formatTime(openingTime)}';
      }
    } else {
      return 'Opens tomorrow at ${_formatTime(openingTime)}';
    }
  }

  Widget _buildFilters() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 12, 0, 8),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search suppliers',
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
                    _loadSuppliers(force: true);
                  }
                });
              },
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 90,
            child: DropdownButtonFormField<String>(
              initialValue: _statusFilter,
              isExpanded: true,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                isDense: true,
                contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 10),
              ),
              items: const [
                DropdownMenuItem(value: 'all', child: Text('All')),
                DropdownMenuItem(value: 'open', child: Text('Open')),
                DropdownMenuItem(value: 'closed', child: Text('Closed')),
              ],
              onChanged: (value) {
                if (value == null || value == _statusFilter) return;
                setState(() {
                  _statusFilter = value;
                });
                _loadSuppliers(force: true);
              },
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: Icon(_showMapView ? Icons.list : Icons.map),
            onPressed: () {
              setState(() {
                _showMapView = !_showMapView;
              });
              if (_showMapView) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) {
                    _mapController.move(_siargaoCenter, 11.0);
                  }
                });
              }
            },
            tooltip: _showMapView ? 'Show List' : 'Show Map',
          ),
        ],
      ),
    );
  }

  Widget _buildSupplierList() {
    if (_suppliers.isEmpty) {
      return ListView(
        padding: EdgeInsets.only(
          bottom: 16 + MediaQuery.of(context).padding.bottom,
        ),
        children: const [
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            child: Center(
              child: Text(
                'No suppliers match your filters',
                style: TextStyle(fontSize: 16),
              ),
            ),
          ),
        ],
      );
    }

    return ListView.builder(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 0,
        bottom: 16 + MediaQuery.of(context).padding.bottom,
      ),
      itemCount: _suppliers.length,
      itemBuilder: (context, index) {
        final supplier = _suppliers[index];
        final openStatus = _isSupplierOpenNow(supplier);
        final isOpen = openStatus ?? false;
        return Opacity(
          opacity: isOpen ? 1.0 : 0.5,
          child: Card(
            color: isOpen ? null : Colors.grey.shade200,
            margin: const EdgeInsets.only(bottom: 16),
            child: InkWell(
              onTap: isOpen ? () => _handleSupplierPress(supplier) : null,
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
                                      if (isOpen)
                                        const Chip(
                                          label: Text(
                                            'Open',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.white,
                                            ),
                                          ),
                                          backgroundColor: Colors.green,
                                          padding: EdgeInsets.symmetric(
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
                        ],
                        if (isOpen &&
                            (supplier.openingTime != null ||
                                supplier.closingTime != null)) ...[
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
                                if (supplier.openingTime != null &&
                                    supplier.openingTime!.trim().isNotEmpty &&
                                    supplier.closingTime != null &&
                                    supplier.closingTime!.trim().isNotEmpty)
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.schedule,
                                        size: 14,
                                        color: Colors.grey[700],
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        '${_formatTime(supplier.openingTime)} - ${_formatTime(supplier.closingTime)}',
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.grey[800],
                                        ),
                                      ),
                                    ],
                                  )
                                else if (supplier.openingTime != null &&
                                    supplier.openingTime!.trim().isNotEmpty)
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.schedule,
                                        size: 14,
                                        color: Colors.grey[700],
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        'Opens: ${_formatTime(supplier.openingTime)}',
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: Colors.grey[800],
                                        ),
                                      ),
                                    ],
                                  )
                                else if (supplier.closingTime != null &&
                                    supplier.closingTime!.trim().isNotEmpty)
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.schedule,
                                        size: 14,
                                        color: Colors.grey[700],
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        'Closes: ${_formatTime(supplier.closingTime)}',
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
                        if (!isOpen &&
                            supplier.openingTime != null &&
                            supplier.openingTime!.trim().isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Center(
                            child: Text(
                              _getNextOpeningMessage(supplier.openingTime),
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Colors.redAccent,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildBody() {
    if (_loading && _suppliers.isEmpty) {
      return Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: _buildFilters(),
          ),
          const Expanded(child: ShimmerSupplierList()),
        ],
      );
    }

    Widget listChild;
    if (_error != null && _suppliers.isEmpty) {
      listChild = ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        children: [
          Center(
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
          ),
        ],
      );
    } else if (_suppliers.isEmpty) {
      listChild = ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        children: const [
          Center(
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
          ),
        ],
      );
    } else {
      listChild = _buildSupplierList();
    }

    if (_showMapView) {
      return Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: _buildFilters(),
          ),
          Expanded(
            child: _buildMapView(),
          ),
        ],
      );
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: _buildFilters(),
        ),
        Expanded(
          child: RefreshIndicator(
            edgeOffset: 80,
            onRefresh: _handleRefresh,
            child: listChild,
          ),
        ),
      ],
    );
  }

  Widget _buildMapView() {
    final suppliersWithLocation = _suppliers.where((s) => 
      s.latitude != null && s.longitude != null
    ).toList();

    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: const MapOptions(
            initialCenter: _siargaoCenter,
            initialZoom: 11.0,
            minZoom: 9.0,
            maxZoom: 18.0,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.example.siargaoTradingRoad',
            ),
            MarkerLayer(
              markers: suppliersWithLocation.map((supplier) {
                final isOpen = _isSupplierOpenNow(supplier) ?? false;
                return Marker(
                  point: LatLng(supplier.latitude!, supplier.longitude!),
                  width: 80,
                  height: supplier.averageRating != null && supplier.ratingCount > 0 ? 95 : 80,
                  child: GestureDetector(
                    onTap: () => _handleSupplierPress(supplier),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: isOpen ? Colors.green : Colors.grey,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.3),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: supplier.logoUrl != null && supplier.logoUrl!.isNotEmpty
                              ? ClipOval(
                                  child: Image.network(
                                    supplier.logoUrl!,
                                    width: 40,
                                    height: 40,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) {
                                      return Container(
                                        width: 40,
                                        height: 40,
                                        color: Colors.blue,
                                        child: Center(
                                          child: Text(
                                            supplier.name.isNotEmpty
                                                ? supplier.name[0].toUpperCase()
                                                : '?',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                )
                              : Container(
                                  width: 40,
                                  height: 40,
                                  color: Colors.blue,
                                  child: Center(
                                    child: Text(
                                      supplier.name.isNotEmpty
                                          ? supplier.name[0].toUpperCase()
                                          : '?',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                        ),
                        const SizedBox(height: 3),
                        ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 70),
                          child: Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: 4,
                              vertical: supplier.averageRating != null && supplier.ratingCount > 0 ? 3 : 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.2),
                                  blurRadius: 2,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  supplier.name,
                                  style: const TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.center,
                                ),
                                if (supplier.averageRating != null && supplier.ratingCount > 0) ...[
                                  const SizedBox(height: 1),
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.star,
                                        size: 8,
                                        color: Colors.amber[700],
                                      ),
                                      const SizedBox(width: 2),
                                      Text(
                                        supplier.averageRating!.toStringAsFixed(1),
                                        style: TextStyle(
                                          fontSize: 8,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.grey[800],
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
        Positioned(
          right: 16,
          bottom: 80,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                elevation: 4,
                child: InkWell(
                  onTap: () {
                    final currentZoom = _mapController.camera.zoom;
                    if (currentZoom < 18) {
                      _mapController.move(_mapController.camera.center, currentZoom + 1);
                    }
                  },
                  borderRadius: BorderRadius.circular(8),
                  child: const SizedBox(
                    width: 48,
                    height: 48,
                    child: Icon(Icons.add, color: Colors.black87),
                  ),
                ),
              ),
              const SizedBox(height: 2),
              Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                elevation: 4,
                child: InkWell(
                  onTap: () {
                    final currentZoom = _mapController.camera.zoom;
                    if (currentZoom > 9) {
                      _mapController.move(_mapController.camera.center, currentZoom - 1);
                    }
                  },
                  borderRadius: BorderRadius.circular(8),
                  child: const SizedBox(
                    width: 48,
                    height: 48,
                    child: Icon(Icons.remove, color: Colors.black87),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                elevation: 4,
                child: InkWell(
                  onTap: () {
                    _mapController.move(_siargaoCenter, 11.0);
                  },
                  borderRadius: BorderRadius.circular(8),
                  child: const SizedBox(
                    width: 48,
                    height: 48,
                    child: Icon(Icons.my_location, color: Colors.blue),
                  ),
                ),
              ),
            ],
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
        title: const Text('Suppliers'),
      ),
      body: SafeArea(
        child: body,
      ),
    );
  }
}
