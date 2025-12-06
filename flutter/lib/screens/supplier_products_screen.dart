import 'package:flutter/material.dart';

class SupplierProductsScreen extends StatelessWidget {
  final int supplierId;

  const SupplierProductsScreen({super.key, required this.supplierId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Supplier Products'),
      ),
      body: Center(
        child: Text('Supplier Products Screen: $supplierId'),
      ),
    );
  }
}
