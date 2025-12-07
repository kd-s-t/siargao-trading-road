import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:siargao_trading_road/models/user.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import 'dart:math' as math;

class OrderMap extends StatefulWidget {
  final User? store;
  final User? supplier;
  final String? status;
  final double height;

  const OrderMap({
    super.key,
    this.store,
    this.supplier,
    this.status,
    this.height = 250,
  });

  @override
  State<OrderMap> createState() => _OrderMapState();
}

class _OrderMapState extends State<OrderMap> with TickerProviderStateMixin {
  final MapController _mapController = MapController();
  final List<Polyline> _polylines = [];
  final List<Marker> _markers = [];
  List<LatLng> _routePoints = [];
  AnimationController? _animationController;
  int _currentRouteIndex = 0;
  Timer? _animationTimer;

  static const LatLng _siargaoCenter = LatLng(9.8563, 126.0483);

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 30),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _setupMap();
      }
    });
  }

  @override
  void dispose() {
    _animationController?.dispose();
    _animationTimer?.cancel();
    super.dispose();
  }

  void _setupMap() {
    try {
      final storeLocation = widget.store?.latitude != null && widget.store?.longitude != null
          ? LatLng(widget.store!.latitude!, widget.store!.longitude!)
          : null;
      final supplierLocation = widget.supplier?.latitude != null && widget.supplier?.longitude != null
          ? LatLng(widget.supplier!.latitude!, widget.supplier!.longitude!)
          : null;

      if (storeLocation != null) {
        _markers.add(
          Marker(
            point: storeLocation,
            width: 50,
            height: 50,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.blue,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 3),
              ),
              child: widget.store?.logoUrl != null && widget.store!.logoUrl!.isNotEmpty
                  ? ClipOval(
                      child: Image.network(
                        widget.store!.logoUrl!,
                        width: 44,
                        height: 44,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return const Icon(Icons.store, color: Colors.white, size: 24);
                        },
                      ),
                    )
                  : const Icon(Icons.store, color: Colors.white, size: 24),
            ),
          ),
        );
      }

      if (supplierLocation != null) {
        _markers.add(
          Marker(
            point: supplierLocation,
            width: 50,
            height: 50,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 3),
              ),
              child: widget.supplier?.logoUrl != null && widget.supplier!.logoUrl!.isNotEmpty
                  ? ClipOval(
                      child: Image.network(
                        widget.supplier!.logoUrl!,
                        width: 44,
                        height: 44,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return const Icon(Icons.local_shipping, color: Colors.white, size: 24);
                        },
                      ),
                    )
                  : const Icon(Icons.local_shipping, color: Colors.white, size: 24),
            ),
          ),
        );
      }

      if (storeLocation != null && supplierLocation != null) {
        _fetchRoute(supplierLocation, storeLocation);
        _fitBounds();
      }

      if (mounted) {
        setState(() {});
      }
    } catch (e) {
      // Silently fail - map setup errors should not crash the app
    }
  }

  Future<void> _fetchRoute(LatLng start, LatLng end) async {
    try {
      final url = Uri.parse(
        'https://router.project-osrm.org/route/v1/driving/'
        '${start.longitude},${start.latitude};'
        '${end.longitude},${end.latitude}?overview=full&geometries=geojson',
      );

      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        if (data['code'] == 'Ok' && data['routes'] != null) {
          final route = (data['routes'] as List)[0];
          final geometry = route['geometry'];
          if (geometry != null && geometry['coordinates'] != null) {
            final coordinates = geometry['coordinates'] as List;
            _routePoints = coordinates
                .map((coord) => LatLng(coord[1] as double, coord[0] as double))
                .toList();

            if (mounted) {
              setState(() {
                _polylines.clear();
                _polylines.add(
                  Polyline(
                    points: _routePoints,
                    strokeWidth: 5,
                    color: widget.status == 'in_transit' ? Colors.orange : Colors.blue,
                    borderStrokeWidth: 0,
                  ),
                );
              });
              _fitBounds();
              if (widget.status == 'in_transit') {
                _startTruckAnimation();
              }
            }
          }
        }
      }
    } catch (e) {
          if (widget.store?.latitude != null &&
          widget.supplier?.latitude != null) {
        if (mounted) {
          setState(() {
            _routePoints = [
              LatLng(widget.supplier!.latitude!, widget.supplier!.longitude!),
              LatLng(widget.store!.latitude!, widget.store!.longitude!),
            ];
            _polylines.clear();
            _polylines.add(
              Polyline(
                points: _routePoints,
                strokeWidth: 5,
                color: widget.status == 'in_transit' ? Colors.orange : Colors.blue,
                borderStrokeWidth: 0,
              ),
            );
          });
          if (widget.status == 'in_transit') {
            _startTruckAnimation();
          }
        }
      }
    }
  }

  void _startTruckAnimation() {
    if (_routePoints.isEmpty || widget.status != 'in_transit') return;

    _animationTimer?.cancel();
    _currentRouteIndex = 0;

    _animationTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (!mounted || _routePoints.isEmpty || widget.status != 'in_transit') {
        timer.cancel();
        return;
      }

      if (_currentRouteIndex < _routePoints.length - 1) {
        final currentPoint = _routePoints[_currentRouteIndex];
        final nextPoint = _routePoints[_currentRouteIndex + 1];
        final angle = _calculateBearing(currentPoint, nextPoint);

        setState(() {
          _markers.removeWhere((m) => m.key == const Key('truck'));
          _markers.add(
            Marker(
              key: const Key('truck'),
              point: currentPoint,
              width: 60,
              height: 60,
              child: Transform.rotate(
                angle: angle * math.pi / 180,
                child: Image.asset(
                  'assets/truck.png',
                  width: 60,
                  height: 60,
                  fit: BoxFit.contain,
                ),
              ),
            ),
          );
        });

        _currentRouteIndex++;
      } else {
        timer.cancel();
        _currentRouteIndex = 0;
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted && widget.status == 'in_transit') {
            _startTruckAnimation();
          }
        });
      }
    });
  }

  double _calculateBearing(LatLng point1, LatLng point2) {
    final lat1 = point1.latitude * math.pi / 180;
    final lat2 = point2.latitude * math.pi / 180;
    final dLon = (point2.longitude - point1.longitude) * math.pi / 180;

    final y = math.sin(dLon) * math.cos(lat2);
    final x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dLon);

    final bearing = math.atan2(y, x) * 180 / math.pi;
    return (bearing + 360) % 360;
  }

  LatLng _getCenter() {
    final storeLocation = widget.store?.latitude != null && widget.store?.longitude != null
        ? LatLng(widget.store!.latitude!, widget.store!.longitude!)
        : null;
    final supplierLocation = widget.supplier?.latitude != null && widget.supplier?.longitude != null
        ? LatLng(widget.supplier!.latitude!, widget.supplier!.longitude!)
        : null;

    if (storeLocation != null && supplierLocation != null) {
      return LatLng(
        (storeLocation.latitude + supplierLocation.latitude) / 2,
        (storeLocation.longitude + supplierLocation.longitude) / 2,
      );
    }

    return storeLocation ?? supplierLocation ?? _siargaoCenter;
  }

  void _fitBounds() {
    final storeLocation = widget.store?.latitude != null && widget.store?.longitude != null
        ? LatLng(widget.store!.latitude!, widget.store!.longitude!)
        : null;
    final supplierLocation = widget.supplier?.latitude != null && widget.supplier?.longitude != null
        ? LatLng(widget.supplier!.latitude!, widget.supplier!.longitude!)
        : null;

    if (storeLocation != null && supplierLocation != null) {
      final bounds = LatLngBounds(
        LatLng(
          math.min(storeLocation.latitude, supplierLocation.latitude),
          math.min(storeLocation.longitude, supplierLocation.longitude),
        ),
        LatLng(
          math.max(storeLocation.latitude, supplierLocation.latitude),
          math.max(storeLocation.longitude, supplierLocation.longitude),
        ),
      );

      Timer(const Duration(milliseconds: 800), () {
        if (mounted) {
          try {
            _mapController.fitCamera(
              CameraFit.bounds(
                bounds: bounds,
                padding: const EdgeInsets.all(50),
              ),
            );
          } catch (e) {
            // Silently fail - camera fit errors should not crash the app
          }
        }
      });
    }
  }

  double _getZoom() {
    final storeLocation = widget.store?.latitude != null && widget.store?.longitude != null
        ? LatLng(widget.store!.latitude!, widget.store!.longitude!)
        : null;
    final supplierLocation = widget.supplier?.latitude != null && widget.supplier?.longitude != null
        ? LatLng(widget.supplier!.latitude!, widget.supplier!.longitude!)
        : null;

    if (storeLocation != null && supplierLocation != null) {
      final distance = const Distance().distance(storeLocation, supplierLocation);
      if (distance > 10000) return 10.0;
      if (distance > 5000) return 11.0;
      if (distance > 2000) return 12.0;
      return 13.0;
    }

    return 12.0;
  }

  @override
  Widget build(BuildContext context) {
    try {
      final storeLocation = widget.store?.latitude != null && widget.store?.longitude != null
          ? LatLng(widget.store!.latitude!, widget.store!.longitude!)
          : null;
      final supplierLocation = widget.supplier?.latitude != null && widget.supplier?.longitude != null
          ? LatLng(widget.supplier!.latitude!, widget.supplier!.longitude!)
          : null;

      if (storeLocation == null && supplierLocation == null) {
        return SizedBox(
          height: widget.height,
          child: Container(
            color: Colors.grey.shade200,
            child: const Center(
              child: Text('Map unavailable'),
            ),
          ),
        );
      }

      final center = _getCenter();
      final zoom = _getZoom();

      return SizedBox(
        height: widget.height,
        child: Stack(
          children: [
            FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: center,
                initialZoom: zoom,
                onMapReady: () {
                  if (storeLocation != null && supplierLocation != null) {
                    Timer(const Duration(milliseconds: 100), () {
                      _fitBounds();
                    });
                  }
                },
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.example.siargaoTradingRoad',
                ),
                if (_polylines.isNotEmpty)
                  PolylineLayer(
                    polylines: _polylines,
                  ),
                if (_markers.isNotEmpty)
                  MarkerLayer(
                    markers: _markers,
                  ),
              ],
            ),
            Positioned(
              right: 16,
              top: 16,
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
                        width: 40,
                        height: 40,
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
                        if (currentZoom > 3) {
                          _mapController.move(_mapController.camera.center, currentZoom - 1);
                        }
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: const SizedBox(
                        width: 40,
                        height: 40,
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
                        _fitBounds();
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: const SizedBox(
                        width: 40,
                        height: 40,
                        child: Icon(Icons.my_location, color: Colors.black87),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    } catch (e) {
      return SizedBox(
        height: widget.height,
        child: Container(
          color: Colors.grey.shade200,
          child: const Center(
            child: Text('Map unavailable'),
          ),
        ),
      );
    }
  }
}
