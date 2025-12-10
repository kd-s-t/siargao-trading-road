import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
import 'package:siargao_trading_road/services/order_service.dart';
import 'package:siargao_trading_road/widgets/shimmer_loading.dart';
import 'package:intl/intl.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  bool _loading = true;
  Map<String, dynamic> _analytics = {};
  List<Map<String, dynamic>> _dailyRevenue = [];
  bool _isStore = false;

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    setState(() {
      _loading = true;
    });

    try {
      final orders = await OrderService.getOrders();
      if (!mounted) return;
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;

      if (user == null) return;
      _isStore = user.role == 'store';

      final now = DateTime.now();
      final thisMonth = DateTime(now.year, now.month);
      final lastMonth = DateTime(now.year, now.month - 1);

      double totalRevenue = 0;
      double thisMonthRevenue = 0;
      double lastMonthRevenue = 0;
      int totalOrders = orders.length;
      int thisMonthOrders = 0;
      int lastMonthOrders = 0;
      int deliveredOrders = 0;
      int inTransitOrders = 0;
      int preparingOrders = 0;
      int cancelledOrders = 0;

      Map<DateTime, double> dailyRevenueMap = {};

      for (var order in orders) {
        totalRevenue += order.totalAmount;

        final orderDate = DateTime(order.createdAt.year, order.createdAt.month, order.createdAt.day);
        dailyRevenueMap[orderDate] = (dailyRevenueMap[orderDate] ?? 0) + order.totalAmount;

        if (order.status == 'delivered') {
          deliveredOrders++;
        } else if (order.status == 'in_transit') {
          inTransitOrders++;
        } else if (order.status == 'preparing') {
          preparingOrders++;
        } else if (order.status == 'cancelled') {
          cancelledOrders++;
        }

        if (orderDate.isAfter(thisMonth.subtract(const Duration(days: 1))) && 
            orderDate.isBefore(DateTime(now.year, now.month + 1))) {
          thisMonthOrders++;
          thisMonthRevenue += order.totalAmount;
        } else if (orderDate.isAfter(lastMonth.subtract(const Duration(days: 1))) && 
                   orderDate.isBefore(thisMonth)) {
          lastMonthOrders++;
          lastMonthRevenue += order.totalAmount;
        }
      }

      final dailyRevenueList = dailyRevenueMap.entries.toList()
        ..sort((a, b) => a.key.compareTo(b.key));
      
      final last7Days = dailyRevenueList.length > 7 
          ? dailyRevenueList.sublist(dailyRevenueList.length - 7)
          : dailyRevenueList;

      setState(() {
        _isStore = user.role == 'store';
        _analytics = {
          'totalRevenue': totalRevenue,
          'thisMonthRevenue': thisMonthRevenue,
          'lastMonthRevenue': lastMonthRevenue,
          'totalOrders': totalOrders,
          'thisMonthOrders': thisMonthOrders,
          'lastMonthOrders': lastMonthOrders,
          'deliveredOrders': deliveredOrders,
          'inTransitOrders': inTransitOrders,
          'preparingOrders': preparingOrders,
          'cancelledOrders': cancelledOrders,
          'role': user.role,
        };
        _dailyRevenue = last7Days.map((e) => {
          'date': e.key,
          'revenue': e.value,
        }).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics'),
      ),
      body: SafeArea(
        child: _loading
            ? const ShimmerAnalytics()
            : RefreshIndicator(
                onRefresh: _loadAnalytics,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildRevenueCard(),
                      const SizedBox(height: 16),
                      _buildRevenueChart(),
                      const SizedBox(height: 16),
                      _buildOrdersCard(),
                      const SizedBox(height: 16),
                      _buildStatusPieChart(),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildRevenueCard() {
    final totalRevenue = _analytics['totalRevenue'] as double? ?? 0.0;
    final thisMonthRevenue = _analytics['thisMonthRevenue'] as double? ?? 0.0;
    final lastMonthRevenue = _analytics['lastMonthRevenue'] as double? ?? 0.0;
    final revenueChange = lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
        : 0.0;

    final titleLabel = _isStore ? 'Total Spend' : 'Total Revenue';
    final monthlyLabel = _isStore ? 'This Month\'s Spend' : 'This Month';

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Theme.of(context).colorScheme.primary,
              Theme.of(context).colorScheme.primary.withValues(alpha: 0.7),
            ],
          ),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              titleLabel,
              style: const TextStyle(
                fontSize: 16,
                color: Colors.white70,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '₱${NumberFormat('#,##0.00').format(totalRevenue)}',
              style: const TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      monthlyLabel,
                      style: const TextStyle(fontSize: 12, color: Colors.white70),
                    ),
                    Text(
                      '₱${NumberFormat('#,##0.00').format(thisMonthRevenue)}',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                if (revenueChange != 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          revenueChange > 0 ? Icons.trending_up : Icons.trending_down,
                          size: 18,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${revenueChange.abs().toStringAsFixed(1)}%',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRevenueChart() {
    if (_dailyRevenue.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Center(
            child: Text(
              _isStore ? 'No spend data available' : 'No revenue data available',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ),
        ),
      );
    }

    final maxRevenue = _dailyRevenue.map((e) => e['revenue'] as double).reduce((a, b) => a > b ? a : b);
    final chartTitle = _isStore ? 'Spend Trend (Last 7 Days)' : 'Revenue Trend (Last 7 Days)';
    final barLabel = _isStore ? 'Spend' : 'Revenue';
    
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              chartTitle,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              height: 200,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: maxRevenue * 1.2,
                  barTouchData: BarTouchData(
                    enabled: true,
                    touchTooltipData: BarTouchTooltipData(
                      tooltipRoundedRadius: 8,
                      tooltipPadding: const EdgeInsets.all(8),
                      tooltipBgColor: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  titlesData: FlTitlesData(
                    show: true,
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          if (value.toInt() >= _dailyRevenue.length) {
                            return const SizedBox.shrink();
                          }
                          final date = _dailyRevenue[value.toInt()]['date'] as DateTime;
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              DateFormat('MMM d').format(date),
                              style: const TextStyle(fontSize: 10),
                            ),
                          );
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 50,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            '₱${(value / 1000).toStringAsFixed(0)}k',
                            style: const TextStyle(fontSize: 10),
                          );
                        },
                      ),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                  ),
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    horizontalInterval: maxRevenue / 5,
                    getDrawingHorizontalLine: (value) {
                      return FlLine(
                        color: Colors.grey[300]!,
                        strokeWidth: 1,
                      );
                    },
                  ),
                  borderData: FlBorderData(show: false),
                  barGroups: _dailyRevenue.asMap().entries.map((entry) {
                    final index = entry.key;
                    final data = entry.value;
                    return BarChartGroupData(
                      x: index,
                      barRods: [
                        BarChartRodData(
                          toY: data['revenue'] as double,
                          color: Theme.of(context).colorScheme.primary,
                          width: 20,
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(8),
                          ),
                        ),
                      ],
                    );
                  }).toList(),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(width: 8),
                Text(barLabel),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrdersCard() {
    final totalOrders = _analytics['totalOrders'] as int? ?? 0;
    final thisMonthOrders = _analytics['thisMonthOrders'] as int? ?? 0;
    final lastMonthOrders = _analytics['lastMonthOrders'] as int? ?? 0;
    final ordersChange = lastMonthOrders > 0
        ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders * 100)
        : 0.0;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Total Orders',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Text(
                  totalOrders.toString(),
                  style: TextStyle(
                    fontSize: 42,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const Spacer(),
                if (ordersChange != 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: ordersChange > 0 ? Colors.green.shade100 : Colors.red.shade100,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          ordersChange > 0 ? Icons.trending_up : Icons.trending_down,
                          size: 18,
                          color: ordersChange > 0 ? Colors.green : Colors.red,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${ordersChange.abs().toStringAsFixed(1)}%',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: ordersChange > 0 ? Colors.green : Colors.red,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem('This Month', thisMonthOrders.toString(), Colors.blue),
                _buildStatItem('Last Month', lastMonthOrders.toString(), Colors.grey),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildStatusPieChart() {
    final delivered = _analytics['deliveredOrders'] as int? ?? 0;
    final inTransit = _analytics['inTransitOrders'] as int? ?? 0;
    final preparing = _analytics['preparingOrders'] as int? ?? 0;
    final cancelled = _analytics['cancelledOrders'] as int? ?? 0;

    final total = delivered + inTransit + preparing + cancelled;
    if (total == 0) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Center(
            child: Text(
              'No order status data available',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ),
        ),
      );
    }

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Order Status Distribution',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 150,
                    child: PieChart(
                      PieChartData(
                        sectionsSpace: 2,
                        centerSpaceRadius: 20,
                        sections: [
                          PieChartSectionData(
                            value: delivered.toDouble(),
                            title: '${((delivered / total) * 100).toStringAsFixed(0)}%',
                            color: Colors.green,
                            radius: 60,
                            titleStyle: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          PieChartSectionData(
                            value: inTransit.toDouble(),
                            title: '${((inTransit / total) * 100).toStringAsFixed(0)}%',
                            color: Colors.blue,
                            radius: 60,
                            titleStyle: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          PieChartSectionData(
                            value: preparing.toDouble(),
                            title: '${((preparing / total) * 100).toStringAsFixed(0)}%',
                            color: Colors.orange,
                            radius: 60,
                            titleStyle: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          PieChartSectionData(
                            value: cancelled.toDouble(),
                            title: '${((cancelled / total) * 100).toStringAsFixed(0)}%',
                            color: Colors.red,
                            radius: 60,
                            titleStyle: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildLegendItem('Delivered', delivered, Colors.green),
                      const SizedBox(height: 12),
                      _buildLegendItem('In Transit', inTransit, Colors.blue),
                      const SizedBox(height: 12),
                      _buildLegendItem('Preparing', preparing, Colors.orange),
                      const SizedBox(height: 12),
                      _buildLegendItem('Cancelled', cancelled, Colors.red),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem(String label, int count, Color color) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(fontSize: 14),
          ),
        ),
        Text(
          count.toString(),
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }
}
