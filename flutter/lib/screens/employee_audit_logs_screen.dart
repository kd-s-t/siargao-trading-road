import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:siargao_trading_road/models/audit_log.dart';
import 'package:siargao_trading_road/models/employee.dart';
import 'package:siargao_trading_road/services/audit_log_service.dart';

class EmployeeAuditLogsScreen extends StatefulWidget {
  final Employee employee;
  final bool useScaffold;

  const EmployeeAuditLogsScreen({
    super.key,
    required this.employee,
    this.useScaffold = true,
  });

  @override
  State<EmployeeAuditLogsScreen> createState() => _EmployeeAuditLogsScreenState();
}

class _EmployeeAuditLogsScreenState extends State<EmployeeAuditLogsScreen> {
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

  Widget _buildLogItem(AuditLog log) {
    final dateFormat = DateFormat('MMM dd, yyyy HH:mm:ss');
    final isError = log.statusCode >= 400;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: ExpansionTile(
        leading: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              log.statusEmoji,
              style: const TextStyle(fontSize: 20),
            ),
          ],
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                log.endpoint,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: isError ? Colors.red : null,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              dateFormat.format(log.createdAt),
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
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
                const SizedBox(width: 8),
                Text(
                  '${log.durationMs}ms',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey.shade600,
                  ),
                ),
                if (log.ipAddress.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  Icon(Icons.location_on, size: 12, color: Colors.grey.shade600),
                  const SizedBox(width: 2),
                  Text(
                    log.ipAddress,
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (log.action.isNotEmpty) ...[
                  _buildDetailRow('Action', log.action),
                  const Divider(),
                ],
                if (log.userAgent.isNotEmpty) ...[
                  _buildDetailRow('User Agent', log.userAgent),
                  const Divider(),
                ],
                if (log.requestBody != null && log.requestBody!.isNotEmpty) ...[
                  _buildDetailRow('Request Body', log.requestBody!),
                  const Divider(),
                ],
                if (log.responseBody != null && log.responseBody!.isNotEmpty) ...[
                  _buildDetailRow('Response Body', log.responseBody!),
                  const Divider(),
                ],
                if (log.errorMessage != null && log.errorMessage!.isNotEmpty) ...[
                  _buildDetailRow('Error', log.errorMessage!, isError: true),
                ],
              ],
            ),
          ),
        ],
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
      child: _loading && _logs.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 48, color: Colors.red.shade300),
                      const SizedBox(height: 16),
                      Text(
                        'Error loading audit logs',
                        style: TextStyle(color: Colors.red.shade700),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _error!,
                        style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => _loadLogs(refresh: true),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _logs.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.history, size: 64, color: Colors.grey.shade300),
                          const SizedBox(height: 16),
                          Text(
                            'No audit logs found',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.grey.shade600,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Activity logs will appear here',
                            style: TextStyle(
                              color: Colors.grey.shade500,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: _logs.length + (_currentPage < _totalPages ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index == _logs.length) {
                          return Center(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: ElevatedButton(
                                onPressed: _loadMore,
                                child: const Text('Load More'),
                              ),
                            ),
                          );
                        }
                        return _buildLogItem(_logs[index]);
                      },
                    ),
    );

    if (!widget.useScaffold) {
      return body;
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Audit Logs'),
            Text(
              widget.employee.username,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.normal),
            ),
          ],
        ),
        actions: [
          if (_total > 0)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Text(
                  '$_total logs',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
        ],
      ),
      body: body,
    );
  }
}

