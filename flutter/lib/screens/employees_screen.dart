import 'package:flutter/material.dart';
import 'package:siargao_trading_road/models/employee.dart';
import 'package:siargao_trading_road/services/employee_service.dart';
import 'package:siargao_trading_road/utils/snackbar_helper.dart';

class EmployeesScreen extends StatefulWidget {
  final bool? useScaffold;
  
  const EmployeesScreen({super.key, this.useScaffold});

  @override
  State<EmployeesScreen> createState() => _EmployeesScreenState();
}

class _EmployeesScreenState extends State<EmployeesScreen> {
  List<Employee> _employees = [];
  bool _employeesLoading = false;
  String? _employeeError;

  @override
  void initState() {
    super.initState();
    _loadEmployees();
  }

  Future<void> _loadEmployees() async {
    setState(() {
      _employeesLoading = true;
      _employeeError = null;
    });
    try {
      final data = await EmployeeService.fetchEmployees();
      setState(() {
        _employees = data;
      });
    } catch (e) {
      setState(() {
        _employeeError = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _employeesLoading = false;
        });
      }
    }
  }

  String _permissionSummary(Employee employee) {
    final parts = <String>[];
    if (employee.canManageInventory) parts.add('Inventory');
    if (employee.canManageOrders) parts.add('Orders');
    if (employee.canChat) parts.add('Chat');
    if (employee.canChangeStatus) parts.add('Status');
    return parts.isEmpty ? 'No access' : parts.join(', ');
  }

  Future<void> _toggleEmployeeStatus(Employee employee) async {
    try {
      await EmployeeService.updateEmployee(
        employee.id,
        statusActive: !employee.statusActive,
      );
      await _loadEmployees();
      if (mounted) {
        SnackbarHelper.showSuccess(
          context,
          !employee.statusActive ? 'Employee activated' : 'Employee deactivated',
        );
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, e.toString().replaceAll('Exception: ', ''));
      }
    }
  }

  Future<void> _openEmployeeDialog({Employee? employee}) async {
    final formKey = GlobalKey<FormState>();
    final usernameController = TextEditingController(text: employee?.username ?? '');
    final passwordController = TextEditingController();
    final nameController = TextEditingController(text: employee?.name ?? '');
    final phoneController = TextEditingController(text: employee?.phone ?? '');
    final roleController = TextEditingController(text: employee?.role ?? '');
    bool canManageInventory = employee?.canManageInventory ?? true;
    bool canManageOrders = employee?.canManageOrders ?? true;
    bool canChat = employee?.canChat ?? true;
    bool canChangeStatus = employee?.canChangeStatus ?? true;
    bool statusActive = employee?.statusActive ?? true;
    bool submitting = false;

    final result = await showDialog<bool>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              title: Text(employee == null ? 'Add Employee' : 'Edit Employee'),
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
                        decoration: InputDecoration(
                          labelText: 'Password',
                          border: const OutlineInputBorder(),
                          helperText: employee == null ? null : 'Leave blank to keep current password',
                        ),
                        validator: (value) {
                          if (employee == null && (value == null || value.isEmpty)) {
                            return 'Password is required';
                          }
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
                            if (employee == null) {
                              await EmployeeService.createEmployee(
                                username: usernameController.text.trim(),
                                password: passwordController.text,
                                name: nameController.text.trim().isEmpty ? null : nameController.text.trim(),
                                phone: phoneController.text.trim().isEmpty ? null : phoneController.text.trim(),
                                role: roleController.text.trim().isEmpty ? null : roleController.text.trim(),
                                canManageInventory: canManageInventory,
                                canManageOrders: canManageOrders,
                                canChat: canChat,
                                canChangeStatus: canChangeStatus,
                                statusActive: statusActive,
                              );
                            } else {
                              await EmployeeService.updateEmployee(
                                employee.id,
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
                            }
                            if (context.mounted) {
                              Navigator.of(context).pop(true);
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

    if (result == true) {
      await _loadEmployees();
      if (mounted) {
        SnackbarHelper.showSuccess(context, 'Employee saved');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final useScaffold = widget.useScaffold ?? true;
    final isTablet = MediaQuery.of(context).size.width >= 600;

    final body = RefreshIndicator(
      onRefresh: _loadEmployees,
      child: CustomScrollView(
        slivers: [
          if (useScaffold)
            SliverAppBar(
              title: const Text('Manage Employees'),
              floating: true,
              actions: [
                IconButton(
                  onPressed: _employeesLoading ? null : _loadEmployees,
                  icon: const Icon(Icons.refresh),
                  tooltip: 'Refresh',
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ElevatedButton.icon(
                    onPressed: _employeesLoading ? null : () => _openEmployeeDialog(),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Add'),
                  ),
                ),
              ],
            ),
          SliverPadding(
            padding: EdgeInsets.all(useScaffold ? 16 : 0),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                if (!useScaffold)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Manage Employees',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Row(
                          children: [
                            IconButton(
                              onPressed: _employeesLoading ? null : _loadEmployees,
                              icon: const Icon(Icons.refresh),
                              tooltip: 'Refresh',
                            ),
                            ElevatedButton.icon(
                              onPressed: _employeesLoading ? null : () => _openEmployeeDialog(),
                              icon: const Icon(Icons.add, size: 18),
                              label: const Text('Add'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                if (_employeesLoading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: CircularProgressIndicator(),
                    ),
                  )
                else if (_employeeError != null)
                  Card(
                    color: Theme.of(context).colorScheme.errorContainer,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        _employeeError!,
                        style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer),
                      ),
                    ),
                  )
                else if (_employees.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(
                              Icons.people_outline,
                              size: 64,
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No employees yet',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Add your first employee to get started',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton.icon(
                              onPressed: () => _openEmployeeDialog(),
                              icon: const Icon(Icons.add),
                              label: const Text('Add Employee'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                else
                  ..._employees.map((employee) {
                    return Card(
                      margin: EdgeInsets.only(bottom: isTablet ? 16 : 8),
                      elevation: isTablet ? 1 : 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(isTablet ? 12 : 0),
                      ),
                      child: ListTile(
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: isTablet ? 16 : 16,
                          vertical: isTablet ? 8 : 8,
                        ),
                        title: Text(
                          employee.username,
                          style: isTablet
                              ? Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w500,
                                )
                              : null,
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if ((employee.name ?? '').isNotEmpty || (employee.role ?? '').isNotEmpty)
                                Text(
                                  [
                                    if ((employee.name ?? '').isNotEmpty) employee.name!,
                                    if ((employee.role ?? '').isNotEmpty) employee.role!
                                  ].join(' • '),
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                              const SizedBox(height: 2),
                              Text(
                                _permissionSummary(employee),
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Switch(
                                  value: employee.statusActive,
                                  onChanged: (_) => _toggleEmployeeStatus(employee),
                                ),
                                Text(
                                  employee.statusActive ? 'Active' : 'Inactive',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: employee.statusActive 
                                        ? Colors.green 
                                        : Theme.of(context).colorScheme.error,
                                  ),
                                ),
                              ],
                            ),
                            IconButton(
                              icon: const Icon(Icons.edit_outlined),
                              tooltip: 'Edit employee',
                              onPressed: () => _openEmployeeDialog(employee: employee),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
              ]),
            ),
          ),
        ],
      ),
    );

    if (!useScaffold) {
      return body;
    }

    return Scaffold(
      body: body,
    );
  }
}

