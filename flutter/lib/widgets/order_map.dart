import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
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

class _OrderMapState extends State<OrderMap> {
  GoogleMapController? _mapController;
  final Set<Polyline> _polylines = {};
  final Set<Marker> _markers = {};
  List<LatLng> _routePoints = [];
  LatLng? _truckPosition;
  double _truckAngle = 0;

  static const LatLng _siargaoCenter = LatLng(9.8563, 126.0483);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _setupMap();
      }
    });
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
            markerId: const MarkerId('store'),
            position: storeLocation,
            infoWindow: InfoWindow(
              title: 'Store Location',
              snippet: widget.store?.name ?? 'Store',
            ),
            icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
          ),
        );
      }

      if (supplierLocation != null) {
        _markers.add(
          Marker(
            markerId: const MarkerId('supplier'),
            position: supplierLocation,
            infoWindow: InfoWindow(
              title: 'Supplier Location',
              snippet: widget.supplier?.name ?? 'Supplier',
            ),
            icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
          ),
        );
      }

      if (storeLocation != null && supplierLocation != null) {
        _fetchRoute(storeLocation, supplierLocation);
      }

      if (widget.status == 'in_transit' && storeLocation != null && supplierLocation != null) {
        _animateTruck(storeLocation, supplierLocation);
      }
    } catch (e) {
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

            setState(() {
              _polylines.add(
                Polyline(
                  polylineId: const PolylineId('route'),
                  points: _routePoints,
                  color: widget.status == 'in_transit' ? Colors.orange : Colors.blue,
                  width: 5,
                  patterns: widget.status == 'in_transit'
                      ? [PatternItem.dash(8), PatternItem.gap(8)]
                      : [PatternItem.dash(15), PatternItem.gap(10)],
                ),
              );
            });
          }
        }
      }
    } catch (e) {
      if (widget.store?.latitude != null &&
          widget.supplier?.latitude != null) {
        setState(() {
          _routePoints = [
            LatLng(widget.store!.latitude!, widget.store!.longitude!),
            LatLng(widget.supplier!.latitude!, widget.supplier!.longitude!),
          ];
          _polylines.add(
            Polyline(
              polylineId: const PolylineId('route'),
              points: _routePoints,
              color: Colors.blue,
              width: 5,
            ),
          );
        });
      }
    }
  }

  void _animateTruck(LatLng start, LatLng end) {
    if (_routePoints.isEmpty) return;

    const fixedProgress = 0.6;
    final index = (fixedProgress * (_routePoints.length - 1)).floor();
    final currentIndex = index < _routePoints.length - 1 ? index : _routePoints.length - 2;
    final currentPoint = _routePoints[currentIndex];
    final nextPoint = _routePoints[currentIndex + 1];

    final angle = _calculateBearing(currentPoint, nextPoint);
    setState(() {
      _truckPosition = currentPoint;
      _truckAngle = angle;
      _markers.add(
        Marker(
          markerId: const MarkerId('truck'),
          position: currentPoint,
          rotation: angle,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
        ),
      );
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

  LatLngBounds _getBounds() {
    final storeLocation = widget.store?.latitude != null && widget.store?.longitude != null
        ? LatLng(widget.store!.latitude!, widget.store!.longitude!)
        : null;
    final supplierLocation = widget.supplier?.latitude != null && widget.supplier?.longitude != null
        ? LatLng(widget.supplier!.latitude!, widget.supplier!.longitude!)
        : null;

    if (storeLocation != null && supplierLocation != null) {
      return LatLngBounds(
        southwest: LatLng(
          storeLocation.latitude < supplierLocation.latitude
              ? storeLocation.latitude
              : supplierLocation.latitude,
          storeLocation.longitude < supplierLocation.longitude
              ? storeLocation.longitude
              : supplierLocation.longitude,
        ),
        northeast: LatLng(
          storeLocation.latitude > supplierLocation.latitude
              ? storeLocation.latitude
              : supplierLocation.latitude,
          storeLocation.longitude > supplierLocation.longitude
              ? storeLocation.longitude
              : supplierLocation.longitude,
        ),
      );
    }

    return LatLngBounds(
      southwest: _siargaoCenter,
      northeast: _siargaoCenter,
    );
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
        return Container(
          height: widget.height,
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Center(
            child: Text('Map unavailable'),
          ),
        );
      }

      final center = storeLocation ?? supplierLocation ?? _siargaoCenter;

      return Container(
        height: widget.height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: GoogleMap(
            initialCameraPosition: CameraPosition(
              target: center,
              zoom: 12,
            ),
            markers: _markers,
            polylines: _polylines,
            onMapCreated: (controller) {
              try {
                _mapController = controller;
                if (storeLocation != null && supplierLocation != null) {
                  Timer(const Duration(milliseconds: 500), () {
                    if (mounted && _mapController != null) {
                      try {
                        controller.animateCamera(
                          CameraUpdate.newLatLngBounds(_getBounds(), 50),
                        );
                      } catch (e) {
                      }
                    }
                  });
                }
              } catch (e) {
              }
            },
          ),
        ),
      );
    } catch (e) {
      return Container(
        height: widget.height,
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Center(
          child: Text('Map unavailable'),
        ),
      );
    }
  }
}
