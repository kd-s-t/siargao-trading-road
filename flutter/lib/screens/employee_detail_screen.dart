import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:siargao_trading_road/models/audit_log.dart';
import 'package:siargao_trading_road/models/employee.dart';
import 'package:siargao_trading_road/services/audit_log_service.dart';
import 'package:siargao_trading_road/services/employee_service.dart';
import 'package:siargao_trading_road/utils/snackbar_helper.dart';

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
  late Employee _currentEmployee;

  @override
  void initState() {
    super.initState();
    _currentEmployee = widget.employee;
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
        employeeId: _currentEmployee.id,
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
                        _currentEmployee.username,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (_currentEmployee.role != null || 
                          (_currentEmployee.name != null && 
                           _currentEmployee.name!.trim().toLowerCase() != _currentEmployee.username.trim().toLowerCase()))
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            [
                              if (_currentEmployee.name != null && 
                                  _currentEmployee.name!.trim().toLowerCase() != _currentEmployee.username.trim().toLowerCase())
                                _currentEmployee.name!,
                              if (_currentEmployee.role != null) _currentEmployee.role!
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
                    color: _currentEmployee.statusActive
                        ? Colors.green.withOpacity(0.1)
                        : Colors.grey.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _currentEmployee.statusActive ? 'Active' : 'Inactive',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: _currentEmployee.statusActive
                          ? Colors.green.shade700
                          : Colors.grey.shade700,
                    ),
                  ),
                ),
              ],
            ),
            if (_currentEmployee.phone != null && _currentEmployee.phone!.trim().isNotEmpty) ...[
              const SizedBox(height: 16),
              _buildInfoRow(Icons.phone, 'Phone', _currentEmployee.phone!),
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
                  _currentEmployee.canManageInventory ? 'can do inventory' : 'cant do inventory',
                  Icons.inventory_2_outlined,
                  _currentEmployee.canManageInventory,
                ),
                _buildPermissionChip(
                  _currentEmployee.canManageOrders ? 'can create order' : 'cant create order',
                  Icons.shopping_cart_outlined,
                  _currentEmployee.canManageOrders,
                ),
                _buildPermissionChip(
                  _currentEmployee.canChat ? 'can chat in order' : 'cant chat in order',
                  Icons.chat_outlined,
                  _currentEmployee.canChat,
                ),
                _buildPermissionChip(
                  _currentEmployee.canChangeStatus ? 'can update order status' : 'cant update order status',
                  Icons.toggle_on_outlined,
                  _currentEmployee.canChangeStatus,
                ),
                _buildPermissionChip(
                  _currentEmployee.canRate ? 'can rate' : 'cant rate',
                  Icons.star_outline,
                  _currentEmployee.canRate,
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Created',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(Icons.calendar_today, size: 16, color: Colors.grey.shade600),
                            const SizedBox(width: 6),
                            Text(
                              DateFormat('MMM dd, yyyy').format(_currentEmployee.createdAt),
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(width: 1, height: 40, color: Colors.grey.shade300),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Updated',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(Icons.update, size: 16, color: Colors.grey.shade600),
                            const SizedBox(width: 6),
                            Text(
                              DateFormat('MMM dd, yyyy').format(_currentEmployee.updatedAt),
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
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
          const SizedBox(width: 4),
          Icon(
            enabled ? Icons.check : Icons.close,
            size: 14,
            color: enabled ? Colors.green : Colors.red,
          ),
        ],
      ),
    );
  }

  String _getHumanReadableEndpoint(String endpoint) {
    if (endpoint.isEmpty) return 'Unknown';
    
    final cleanEndpoint = endpoint.replaceAll('/api/', '').replaceAll('/', ' ');
    final parts = cleanEndpoint.split(' ').where((p) => p.isNotEmpty).toList();
    
    if (parts.isEmpty) return 'API Request';
    
    final resource = parts[0];
    String readable = resource.split('_').map((word) {
      if (word.isEmpty) return '';
      return word[0].toUpperCase() + word.substring(1);
    }).join(' ');
    
    if (parts.length > 1) {
      final action = parts[1];
      if (action.contains('id') || RegExp(r'\d+').hasMatch(action)) {
        readable += ' Details';
      } else {
        readable += ' - ${action.split('_').map((w) => w[0].toUpperCase() + w.substring(1)).join(' ')}';
      }
    }
    
    return readable.isEmpty ? 'API Request' : readable;
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
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Activity Logs (${_total})',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (_total > _logs.length)
                TextButton.icon(
                  onPressed: _loadMore,
                  icon: const Icon(Icons.expand_more, size: 18),
                  label: const Text('Load More'),
                ),
            ],
          ),
        ),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: _logs.length,
          itemBuilder: (context, index) {
            final log = _logs[index];
            return _buildLogCard(log);
          },
        ),
        if (_currentPage < _totalPages)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: OutlinedButton.icon(
                onPressed: _loadMore,
                icon: const Icon(Icons.expand_more),
                label: const Text('Load More'),
              ),
            ),
          ),
      ],
    );
  }

  String _formatReadableTime(DateTime dateTime) {
    final hour = dateTime.hour;
    final minute = dateTime.minute;
    final period = hour >= 12 ? 'pm' : 'am';
    final displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    
    if (minute == 0) {
      return '$displayHour$period';
    } else {
      return '$displayHour:${minute.toString().padLeft(2, '0')}$period';
    }
  }

  String _formatReadableDate(DateTime dateTime) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final logDate = DateTime(dateTime.year, dateTime.month, dateTime.day);
    final yesterday = today.subtract(const Duration(days: 1));
    
    if (logDate == today) {
      return 'today';
    } else if (logDate == yesterday) {
      return 'yesterday';
    } else {
      return 'on ${DateFormat('MMM dd, yyyy').format(dateTime)}';
    }
  }

  Future<void> _openEditDialog() async {
    final formKey = GlobalKey<FormState>();
    final usernameController = TextEditingController(text: _currentEmployee.username);
    final passwordController = TextEditingController();
    final nameController = TextEditingController(text: _currentEmployee.name ?? '');
    final phoneController = TextEditingController(text: _currentEmployee.phone ?? '');
    final roleController = TextEditingController(text: _currentEmployee.role ?? '');
    bool canManageInventory = _currentEmployee.canManageInventory;
    bool canManageOrders = _currentEmployee.canManageOrders;
    bool canChat = _currentEmployee.canChat;
    bool canChangeStatus = _currentEmployee.canChangeStatus;
    bool statusActive = _currentEmployee.statusActive;
    bool submitting = false;

    await showDialog<bool>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              title: const Text('Edit Employee'),
              content: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextFormField(
                        controller: usernameController,
                        decoration: const InputDecoration(
                          labelText: 'Username',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Username is required';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: passwordController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Password',
                          border: OutlineInputBorder(),
                          helperText: 'Leave blank to keep current password',
                        ),
                        validator: (value) {
                          if (value != null && value.isNotEmpty && value.length < 6) {
                            return 'Password must be at least 6 characters';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: nameController,
                        decoration: const InputDecoration(
                          labelText: 'Name',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: phoneController,
                        decoration: const InputDecoration(
                          labelText: 'Phone',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: roleController,
                        decoration: const InputDecoration(
                          labelText: 'Role',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 12),
                      SwitchListTile(
                        value: canManageInventory,
                        onChanged: (v) {
                          setModalState(() {
                            canManageInventory = v;
                          });
                        },
                        title: const Text('Manage Inventory'),
                      ),
                      SwitchListTile(
                        value: canManageOrders,
                        onChanged: (v) {
                          setModalState(() {
                            canManageOrders = v;
                          });
                        },
                        title: const Text('Manage Orders'),
                      ),
                      SwitchListTile(
                        value: canChat,
                        onChanged: (v) {
                          setModalState(() {
                            canChat = v;
                          });
                        },
                        title: const Text('Chat'),
                      ),
                      SwitchListTile(
                        value: canChangeStatus,
                        onChanged: (v) {
                          setModalState(() {
                            canChangeStatus = v;
                          });
                        },
                        title: const Text('Change Status'),
                      ),
                      SwitchListTile(
                        value: statusActive,
                        onChanged: (v) {
                          setModalState(() {
                            statusActive = v;
                          });
                        },
                        title: const Text('Active'),
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: submitting ? null : () => Navigator.of(context).pop(false),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: submitting
                      ? null
                      : () async {
                          if (!formKey.currentState!.validate()) {
                            return;
                          }
                          setModalState(() {
                            submitting = true;
                          });
                          try {
                            final updated = await EmployeeService.updateEmployee(
                              _currentEmployee.id,
                              username: usernameController.text.trim(),
                              password: passwordController.text.isEmpty ? null : passwordController.text,
                              name: nameController.text.trim().isEmpty ? null : nameController.text.trim(),
                              phone: phoneController.text.trim().isEmpty ? null : phoneController.text.trim(),
                              role: roleController.text.trim().isEmpty ? null : roleController.text.trim(),
                              canManageInventory: canManageInventory,
                              canManageOrders: canManageOrders,
                              canChat: canChat,
                              canChangeStatus: canChangeStatus,
                              statusActive: statusActive,
                            );
                            if (context.mounted) {
                              setState(() {
                                _currentEmployee = updated;
                              });
                              Navigator.of(context).pop(true);
                              SnackbarHelper.showSuccess(context, 'Employee updated successfully');
                            }
                          } catch (e) {
                            setModalState(() {
                              submitting = false;
                            });
                            if (context.mounted) {
                              SnackbarHelper.showError(context, e.toString().replaceAll('Exception: ', ''));
                            }
                          }
                        },
                  child: submitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildLogCard(AuditLog log) {
    final actionName = _getHumanReadableEndpoint(log.endpoint);
    final readableTime = _formatReadableTime(log.createdAt);
    final readableDate = _formatReadableDate(log.createdAt);
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: Colors.grey.shade200,
          width: 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Text(
          '$actionName at $readableTime $readableDate.',
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
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
        title: Text(_currentEmployee.username),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'Edit employee',
            onPressed: () => _openEditDialog(),
          ),
        ],
      ),
      body: body,
    );
  }
}

