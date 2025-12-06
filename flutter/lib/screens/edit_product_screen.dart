import 'package:flutter/material.dart';
import 'package:siargao_trading_road/models/product.dart';

class EditProductScreen extends StatelessWidget {
  final Product? product;

  const EditProductScreen({super.key, this.product});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Product'),
      ),
      body: Center(
        child: Text('Edit Product Screen: ${product?.name ?? "Unknown"}'),
      ),
    );
  }
}
