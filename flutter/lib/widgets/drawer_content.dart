import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
import 'package:siargao_trading_road/services/order_service.dart';
import 'package:siargao_trading_road/models/order.dart';

class DrawerContent extends StatelessWidget {
  final GlobalKey<NavigatorState>? navigatorKey;
  
  const DrawerContent({super.key, this.navigatorKey});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    if (user == null) {
      return const SizedBox.shrink();
    }

    return Drawer(
      child: Column(
        children: [
          FutureBuilder<List<Order>>(
            future: (user.role == 'supplier' || user.role == 'store')
                ? OrderService.getOrders()
                : Future.value([]),
            builder: (context, snapshot) {
              final orders = snapshot.data ?? [];
              final nonDeliveredCount = orders
                  .where((order) => order.status != 'delivered')
                  .length;

              return _buildHeader(context, user, nonDeliveredCount);
            },
          ),
          const Divider(),
          Expanded(
            child: _buildMenuItems(context, user),
          ),
          const Divider(),
          _buildLogoutButton(context, authProvider),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, user, int badgeCount) {
    return Container(
      color: Colors.grey.shade100,
      child: Column(
        children: [
          if (user.bannerUrl != null && user.bannerUrl!.isNotEmpty)
            Image.network(
              user.bannerUrl!,
              width: double.infinity,
              height: 150,
              fit: BoxFit.cover,
            )
          else
            Container(
              width: double.infinity,
              height: 150,
              color: Colors.grey.shade300,
            ),
          const SizedBox(height: 50),
          if (user.logoUrl != null && user.logoUrl!.isNotEmpty)
            CircleAvatar(
              radius: 40,
              backgroundImage: NetworkImage(user.logoUrl!),
              backgroundColor: Colors.white,
            )
          else
            CircleAvatar(
              radius: 40,
              backgroundColor: const Color(0xFF1976D2),
              child: Text(
                user.name.isNotEmpty ? user.name[0].toUpperCase() : 'U',
                style: const TextStyle(
                  fontSize: 32,
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          const SizedBox(height: 16),
          Text(
            user.name,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            user.email,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            user.role.toUpperCase(),
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItems(BuildContext context, user) {
    final menuItems = user.role == 'store'
        ? [
            {'label': 'Profile', 'icon': Icons.account_circle, 'route': '/profile'},
            {'label': 'Suppliers', 'icon': Icons.store, 'route': '/suppliers'},
            {
              'label': 'Orders',
              'icon': Icons.list_alt,
              'route': '/orders',
              'badge': 0,
            },
          ]
        : user.role == 'supplier'
            ? [
                {'label': 'Profile', 'icon': Icons.account_circle, 'route': '/profile'},
                {'label': 'Products', 'icon': Icons.inventory_2, 'route': '/products'},
                {
                  'label': 'Orders',
                  'icon': Icons.list_alt,
                  'route': '/orders',
                  'badge': 0,
                },
              ]
            : [
                {'label': 'Profile', 'icon': Icons.account_circle, 'route': '/profile'},
                {'label': 'Dashboard', 'icon': Icons.dashboard, 'route': '/dashboard'},
              ];

    return ListView.builder(
      itemCount: menuItems.length,
      itemBuilder: (context, index) {
        final item = menuItems[index];
        return ListTile(
          leading: Icon(item['icon'] as IconData),
          title: Text(item['label'] as String),
          trailing: item['badge'] != null && (item['badge'] as int) > 0
              ? Badge(
                  label: Text('${item['badge']}'),
                  child: const Icon(Icons.notifications),
                )
              : null,
          onTap: () {
            final route = item['route'] as String;
            Navigator.pop(context);
            if (navigatorKey?.currentState != null) {
              navigatorKey!.currentState!.pushNamed(route);
            } else {
              Navigator.of(context, rootNavigator: false).pushNamed(route);
            }
          },
        );
      },
    );
  }

  Widget _buildLogoutButton(BuildContext context, AuthProvider authProvider) {
    return ListTile(
      leading: const Icon(Icons.logout, color: Colors.red),
      title: const Text(
        'Logout',
        style: TextStyle(color: Colors.red),
      ),
      onTap: () async {
        await authProvider.logout();
        if (context.mounted) {
          Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
        }
      },
    );
  }
}
