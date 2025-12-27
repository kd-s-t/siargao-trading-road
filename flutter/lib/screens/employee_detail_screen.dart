import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:siargao_trading_road/models/audit_log.dart';
import 'package:siargao_trading_road/models/employee.dart';
import 'package:siargao_trading_road/services/audit_log_service.dart';

class EmployeeDetailScreen extends StatefulWidget {
  final Employee employee;
  final bool useScaffold;

  const EmployeeDetailScreen({
    super.key,
    required this.employee,
    this.useScaffold = true,
  });

  @override
  State<EmployeeDetailScreen> createState() => _EmployeeDetailScreenState();
}

class _EmployeeDetailScreenState extends State<EmployeeDetailScreen> {
  List<AuditLog> _logs = [];
  bool _loading = false;
  String? _error;
  int _currentPage = 1;
  int _totalPages = 1;
  int _total = 0;
  final int _limit = 50;

  @override
  void initState() {
    super.initState();
    _loadLogs();
  }

  Future<void> _loadLogs({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await AuditLogService.fetchAuditLogs(
        employeeId: widget.employee.id,
        page: _currentPage,
        limit: _limit,
      );

      setState(() {
        if (refresh) {
          _logs = result['logs'] as List<AuditLog>;
        } else {
          _logs.addAll(result['logs'] as List<AuditLog>);
        }
        final pagination = result['pagination'] as Map<String, dynamic>;
        _totalPages = pagination['pages'] as int? ?? 1;
        _total = pagination['total'] as int? ?? 0;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _loadMore() async {
    if (_currentPage < _totalPages && !_loading) {
      setState(() {
        _currentPage++;
      });
      await _loadLogs();
    }
  }

  Widget _buildEmployeeInfo() {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.employee.username,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (widget.employee.name != null || widget.employee.role != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            [
                              if (widget.employee.name != null) widget.employee.name!,
                              if (widget.employee.role != null) widget.employee.role!
                            ].join(' • '),
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: widget.employee.statusActive
                        ? Colors.green.withOpacity(0.1)
                        : Colors.grey.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    widget.employee.statusActive ? 'Active' : 'Inactive',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: widget.employee.statusActive
                          ? Colors.green.shade700
                          : Colors.grey.shade700,
                    ),
                  ),
                ),
              ],
            ),
            if (widget.employee.phone != null) ...[
              const SizedBox(height: 16),
              _buildInfoRow(Icons.phone, 'Phone', widget.employee.phone!),
            ],
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 8),
            const Text(
              'Permissions',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildPermissionChip(
                  'Inventory',
                  Icons.inventory_2_outlined,
                  widget.employee.canManageInventory,
                ),
                _buildPermissionChip(
                  'Orders',
                  Icons.shopping_cart_outlined,
                  widget.employee.canManageOrders,
                ),
                _buildPermissionChip(
                  'Chat',
                  Icons.chat_outlined,
                  widget.employee.canChat,
                ),
                _buildPermissionChip(
                  'Status',
                  Icons.toggle_on_outlined,
                  widget.employee.canChangeStatus,
                ),
                _buildPermissionChip(
                  'Rate',
                  Icons.star_outline,
                  widget.employee.canRate,
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _buildInfoRow(
                    Icons.calendar_today,
                    'Created',
                    DateFormat('MMM dd, yyyy').format(widget.employee.createdAt),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildInfoRow(
                    Icons.update,
                    'Updated',
                    DateFormat('MMM dd, yyyy').format(widget.employee.updatedAt),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Colors.grey.shade600),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPermissionChip(String label, IconData icon, bool enabled) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: enabled
            ? Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3)
            : Colors.grey.shade200,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: enabled
                ? Theme.of(context).colorScheme.primary
                : Colors.grey.shade600,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: enabled
                  ? Theme.of(context).colorScheme.primary
                  : Colors.grey.shade600,
            ),
          ),
          if (!enabled) ...[
            const SizedBox(width: 4),
            Icon(
              Icons.close,
              size: 14,
              color: Colors.grey.shade600,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAuditLogsTable() {
    if (_loading && _logs.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            children: [
              Icon(Icons.error_outline, size: 48, color: Colors.red.shade300),
              const SizedBox(height: 16),
              Text(
                'Error loading audit logs',
                style: TextStyle(color: Colors.red.shade700),
              ),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => _loadLogs(refresh: true),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_logs.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            children: [
              Icon(Icons.history, size: 64, color: Colors.grey.shade300),
              const SizedBox(height: 16),
              Text(
                'No activity logs found',
                style: TextStyle(
                  fontSize: 18,
                  color: Colors.grey.shade600,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Activity Logs (${_total})',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (_total > _logs.length)
                TextButton(
                  onPressed: _loadMore,
                  child: const Text('Load More'),
                ),
            ],
          ),
        ),
        Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              headingRowColor: MaterialStateProperty.all(Colors.grey.shade100),
              columns: const [
                DataColumn(label: Text('Timestamp')),
                DataColumn(label: Text('Method')),
                DataColumn(label: Text('Endpoint')),
                DataColumn(label: Text('Status')),
                DataColumn(label: Text('Duration')),
                DataColumn(label: Text('IP Address')),
              ],
              rows: _logs.map((log) {
                final dateFormat = DateFormat('MMM dd, HH:mm:ss');
                final isError = log.statusCode >= 400;
                
                return DataRow(
                  cells: [
                    DataCell(Text(
                      dateFormat.format(log.createdAt),
                      style: const TextStyle(fontSize: 12),
                    )),
                    DataCell(Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: _getMethodColor(log.method),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        log.method,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    )),
                    DataCell(SizedBox(
                      width: 200,
                      child: Text(
                        log.endpoint,
                        style: TextStyle(
                          fontSize: 12,
                          color: isError ? Colors.red : null,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    )),
                    DataCell(Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          log.statusEmoji,
                          style: const TextStyle(fontSize: 16),
                        ),
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: isError ? Colors.red.shade50 : Colors.green.shade50,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '${log.statusCode}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isError ? Colors.red.shade700 : Colors.green.shade700,
                            ),
                          ),
                        ),
                      ],
                    )),
                    DataCell(Text(
                      '${log.durationMs}ms',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    )),
                    DataCell(Text(
                      log.ipAddress,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    )),
                  ],
                  onSelectChanged: (selected) {
                    if (selected == true) {
                      _showLogDetails(log);
                    }
                  },
                );
              }).toList(),
            ),
          ),
        ),
        if (_currentPage < _totalPages)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton(
                onPressed: _loadMore,
                child: const Text('Load More'),
              ),
            ),
          ),
      ],
    );
  }

  void _showLogDetails(AuditLog log) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: Container(
          width: MediaQuery.of(context).size.width * 0.9,
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.8,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppBar(
                title: const Text('Log Details'),
                automaticallyImplyLeading: false,
                actions: [
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildDetailRow('Action', log.action),
                      const Divider(),
                      _buildDetailRow('Method', log.method),
                      const Divider(),
                      _buildDetailRow('Endpoint', log.endpoint),
                      const Divider(),
                      _buildDetailRow('Status Code', '${log.statusCode}'),
                      const Divider(),
                      _buildDetailRow('Duration', '${log.durationMs}ms'),
                      const Divider(),
                      _buildDetailRow('IP Address', log.ipAddress),
                      const Divider(),
                      _buildDetailRow('User Agent', log.userAgent),
                      if (log.requestBody != null && log.requestBody!.isNotEmpty) ...[
                        const Divider(),
                        _buildDetailRow('Request Body', log.requestBody!),
                      ],
                      if (log.responseBody != null && log.responseBody!.isNotEmpty) ...[
                        const Divider(),
                        _buildDetailRow('Response Body', log.responseBody!),
                      ],
                      if (log.errorMessage != null && log.errorMessage!.isNotEmpty) ...[
                        const Divider(),
                        _buildDetailRow('Error', log.errorMessage!, isError: true),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isError = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Colors.grey.shade700,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isError ? Colors.red.shade50 : Colors.grey.shade100,
            borderRadius: BorderRadius.circular(4),
          ),
          child: SelectableText(
            value,
            style: TextStyle(
              fontSize: 11,
              fontFamily: 'monospace',
              color: isError ? Colors.red.shade900 : Colors.black87,
            ),
          ),
        ),
      ],
    );
  }

  Color _getMethodColor(String method) {
    switch (method.toUpperCase()) {
      case 'GET':
        return Colors.blue;
      case 'POST':
        return Colors.green;
      case 'PUT':
      case 'PATCH':
        return Colors.orange;
      case 'DELETE':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final body = RefreshIndicator(
      onRefresh: () => _loadLogs(refresh: true),
      child: ListView(
        children: [
          _buildEmployeeInfo(),
          _buildAuditLogsTable(),
        ],
      ),
    );

    if (!widget.useScaffold) {
      return body;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.employee.username),
      ),
      body: body,
    );
  }
}

