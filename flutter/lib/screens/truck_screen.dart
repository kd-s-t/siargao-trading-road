import 'package:flutter/material.dart';

class TruckScreen extends StatelessWidget {
  const TruckScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Truck'),
      ),
      body: const Center(
        child: Text('Truck Screen'),
      ),
    );
  }
}
