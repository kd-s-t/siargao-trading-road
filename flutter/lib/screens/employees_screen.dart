import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:siargao_trading_road/models/employee.dart';
import 'package:siargao_trading_road/services/auth_service.dart';
import 'package:siargao_trading_road/services/employee_service.dart';
import 'package:siargao_trading_road/utils/snackbar_helper.dart';
import 'package:siargao_trading_road/screens/employee_audit_logs_screen.dart';
import 'package:siargao_trading_road/screens/employee_detail_screen.dart';

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
    bool uploadingImage = false;
    String? profilePicUrl = employee?.profilePicUrl;

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
                      Center(
                        child: GestureDetector(
                          onTap: uploadingImage ? null : () async {
                            final ImagePicker picker = ImagePicker();
                            final XFile? image = await picker.pickImage(
                              source: ImageSource.gallery,
                              imageQuality: 80,
                            );
                            if (image != null) {
                              setModalState(() {
                                uploadingImage = true;
                              });
                              try {
                                final result = await AuthService.uploadImage(
                                  image.path,
                                  imageType: 'employee',
                                  employeeId: employee?.id.toString(),
                                );
                                setModalState(() {
                                  profilePicUrl = result['url'];
                                  uploadingImage = false;
                                });
                              } catch (e) {
                                setModalState(() {
                                  uploadingImage = false;
                                });
                                if (context.mounted) {
                                  SnackbarHelper.showError(
                                    context,
                                    'Failed to upload image: ${e.toString().replaceAll('Exception: ', '')}',
                                  );
                                }
                              }
                            }
                          },
                          child: Stack(
                            children: [
                              CircleAvatar(
                                radius: 40,
                                backgroundColor: Colors.grey.shade300,
                                backgroundImage: profilePicUrl != null && profilePicUrl!.isNotEmpty
                                    ? NetworkImage(profilePicUrl!)
                                    : null,
                                child: profilePicUrl == null || profilePicUrl!.isEmpty
                                    ? Icon(Icons.person, size: 40, color: Colors.grey.shade600)
                                    : null,
                              ),
                              if (uploadingImage)
                                Positioned.fill(
                                  child: Container(
                                    decoration: const BoxDecoration(
                                      color: Colors.black54,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Center(
                                      child: CircularProgressIndicator(
                                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                      ),
                                    ),
                                  ),
                                )
                              else
                                Positioned(
                                  bottom: 0,
                                  right: 0,
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: Theme.of(context).primaryColor,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white, width: 2),
                                    ),
                                    child: const Icon(Icons.camera_alt, size: 16, color: Colors.white),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
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
                                profilePicUrl: profilePicUrl,
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
                                profilePicUrl: profilePicUrl,
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
            padding: EdgeInsets.symmetric(
              horizontal: isTablet ? 24 : (useScaffold ? 16 : 0),
              vertical: useScaffold ? 16 : 0,
            ),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                if (!useScaffold)
                  Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: isTablet ? 24 : 16,
                      vertical: 16,
                    ),
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
                      margin: EdgeInsets.only(
                        bottom: isTablet ? 16 : 8,
                        left: isTablet ? 0 : 0,
                        right: isTablet ? 0 : 0,
                      ),
                      elevation: isTablet ? 1 : 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(isTablet ? 12 : 0),
                      ),
                      child: ListTile(
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: isTablet ? 20 : 16,
                          vertical: isTablet ? 16 : 8,
                        ),
                        isThreeLine: true,
                        dense: !isTablet,
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
                            mainAxisSize: MainAxisSize.min,
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
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => EmployeeDetailScreen(
                                employee: employee,
                              ),
                            ),
                          );
                        },
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            SizedBox(
                              width: isTablet ? 80 : 70,
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Switch(
                                    value: employee.statusActive,
                                    onChanged: (_) => _toggleEmployeeStatus(employee),
                                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  ),
                                  const SizedBox(height: 1),
                                  Text(
                                    employee.statusActive ? 'Active' : 'Inactive',
                                    style: TextStyle(
                                      fontSize: 9,
                                      height: 1.0,
                                      color: employee.statusActive 
                                          ? Colors.green 
                                          : Theme.of(context).colorScheme.error,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                    textAlign: TextAlign.center,
                                    maxLines: 1,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 4),
                            IconButton(
                              icon: const Icon(Icons.history),
                              tooltip: 'View audit logs',
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => EmployeeAuditLogsScreen(
                                      employee: employee,
                                    ),
                                  ),
                                );
                              },
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(
                                minWidth: 40,
                                minHeight: 40,
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.edit_outlined),
                              tooltip: 'Edit employee',
                              onPressed: () => _openEmployeeDialog(employee: employee),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(
                                minWidth: 40,
                                minHeight: 40,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
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

