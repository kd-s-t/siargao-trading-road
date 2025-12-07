import 'package:flutter/material.dart';

class DashboardScreen extends StatelessWidget {
  final bool? useScaffold;
  
  const DashboardScreen({super.key, this.useScaffold});

  Widget _buildBody() {
    return const Center(
      child: Text('Admin Dashboard'),
    );
  }

  @override
  Widget build(BuildContext context) {
    final body = _buildBody();
    final useScaffold = this.useScaffold ?? true;
    
    if (!useScaffold) {
      return body;
    }
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
      ),
      body: body,
    );
  }
}
