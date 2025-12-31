import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'dart:io';
import 'package:metaballs/metaballs.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
import 'package:siargao_trading_road/screens/location_picker_screen.dart';
import 'package:siargao_trading_road/services/auth_service.dart';
import 'package:siargao_trading_road/models/user.dart';
import 'package:siargao_trading_road/models/employee.dart';
import 'package:siargao_trading_road/services/employee_service.dart';
import 'package:siargao_trading_road/utils/snackbar_helper.dart';
import 'package:siargao_trading_road/screens/employee_audit_logs_screen.dart';
import 'package:siargao_trading_road/screens/employee_detail_screen.dart';

class ProfileScreen extends StatefulWidget {
  final bool? useScaffold;
  final GlobalKey<ProfileScreenState>? editKey;
  final VoidCallback? onEditStateChanged;
  
  const ProfileScreen({super.key, this.useScaffold, this.editKey, this.onEditStateChanged});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

abstract class ProfileScreenState extends State<ProfileScreen> {
  void toggleEdit();
  void handleSave();
  bool get isEditing;
}

class _ProfileScreenState extends ProfileScreenState with SingleTickerProviderStateMixin {
  bool _editing = false;
  bool _editingHours = false;
  bool _loading = false;
  String? _uploading;
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _employeeNameController = TextEditingController();
  final _employeePhoneController = TextEditingController();
  final _employeeRoleController = TextEditingController();
  final _facebookController = TextEditingController();
  final _instagramController = TextEditingController();
  final _twitterController = TextEditingController();
  final _linkedinController = TextEditingController();
  final _youtubeController = TextEditingController();
  final _tiktokController = TextEditingController();
  final _websiteController = TextEditingController();
  final _openingTimeController = TextEditingController();
  final _closingTimeController = TextEditingController();
  double? _latitude;
  double? _longitude;
  final MapController _detailMapController = MapController();
  double _detailMapZoom = 16;
  final double _detailMapMinZoom = 15;
  final double _detailMapMaxZoom = 18;
  List<Employee> _employees = [];
  bool _employeesLoading = false;
  String? _employeeError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshUserData();
    });
  }

  Future<void> _loadEmployeeData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.isEmployee) {
      if (authProvider.employee == null) {
        try {
          final employee = await EmployeeService.getMyEmployee();
          authProvider.updateEmployee(employee);
        } catch (e) {
          debugPrint('Failed to load employee data: $e');
        }
      }
      if (authProvider.employee != null) {
        final employee = authProvider.employee!;
        _employeeNameController.text = employee.name ?? '';
        _employeePhoneController.text = employee.phone ?? '';
        _employeeRoleController.text = employee.role ?? '';
      }
    }
  }

  @override
  void toggleEdit() {
    setState(() {
      _editing = !_editing;
      if (!_editing) {
        _loadUserData();
      }
    });
    widget.onEditStateChanged?.call();
  }

  @override
  void handleSave() async {
    await _handleSave();
    widget.onEditStateChanged?.call();
  }

  @override
  bool get isEditing => _editing;

  Future<void> _refreshUserData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.refreshUser();
    _loadUserData();
    final user = authProvider.user;
    if (user != null && (user.role == 'store' || user.role == 'supplier') && !authProvider.isEmployee) {
      await _loadEmployees();
    }
  }

  Set<int> _closedDays = {};

  void _loadUserData() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    if (user != null) {
      _nameController.text = user.name;
      _phoneController.text = user.phone ?? '';
      _addressController.text = user.address ?? '';
      _latitude = user.latitude;
      _longitude = user.longitude;
      _facebookController.text = user.facebook ?? '';
      _instagramController.text = user.instagram ?? '';
      _twitterController.text = user.twitter ?? '';
      _linkedinController.text = user.linkedin ?? '';
      _youtubeController.text = user.youtube ?? '';
      _tiktokController.text = user.tiktok ?? '';
      _websiteController.text = user.website ?? '';
      _openingTimeController.text = user.openingTime ?? '';
      _closingTimeController.text = user.closingTime ?? '';
      if (user.closedDaysOfWeek != null && user.closedDaysOfWeek!.isNotEmpty) {
        _closedDays = user.closedDaysOfWeek!.split(',').map((d) => int.parse(d.trim())).toSet();
      } else {
        _closedDays = {};
      }
    }
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

  Widget _buildPermissionChip(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
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
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _facebookController.dispose();
    _instagramController.dispose();
    _twitterController.dispose();
    _linkedinController.dispose();
    _youtubeController.dispose();
    _tiktokController.dispose();
    _websiteController.dispose();
    _openingTimeController.dispose();
    _closingTimeController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    setState(() {
      _loading = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      await AuthService.updateMe(
        name: _nameController.text.trim(),
        phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
        address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
        latitude: _latitude,
        longitude: _longitude,
        facebook: _facebookController.text.trim().isEmpty ? null : _facebookController.text.trim(),
        instagram: _instagramController.text.trim().isEmpty ? null : _instagramController.text.trim(),
        twitter: _twitterController.text.trim().isEmpty ? null : _twitterController.text.trim(),
        linkedin: _linkedinController.text.trim().isEmpty ? null : _linkedinController.text.trim(),
        youtube: _youtubeController.text.trim().isEmpty ? null : _youtubeController.text.trim(),
        tiktok: _tiktokController.text.trim().isEmpty ? null : _tiktokController.text.trim(),
        website: _websiteController.text.trim().isEmpty ? null : _websiteController.text.trim(),
      );
      await authProvider.refreshUser();
      setState(() {
        _editing = false;
      });
      if (mounted) {
        SnackbarHelper.showSuccess(context, 'Profile updated successfully');
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Failed to update profile: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _saveHours() async {
    setState(() {
      _loading = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final closedDaysList = _closedDays.toList()..sort();
      final closedDaysStr = closedDaysList.isEmpty ? null : closedDaysList.join(',');
      await AuthService.updateMe(
        openingTime: _openingTimeController.text.trim().isEmpty ? null : _openingTimeController.text.trim(),
        closingTime: _closingTimeController.text.trim().isEmpty ? null : _closingTimeController.text.trim(),
        closedDaysOfWeek: closedDaysStr,
      );
      await authProvider.refreshUser();
      _loadUserData();
      setState(() {
        _editingHours = false;
      });
      if (mounted) {
        SnackbarHelper.showSuccess(context, 'Operating hours updated successfully');
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Failed to update operating hours: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Uri? _buildSocialUri(String type, String raw, {bool webFallback = false}) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return null;
    switch (type) {
      case 'email':
        return Uri.parse(trimmed.startsWith('mailto:') ? trimmed : 'mailto:$trimmed');
      case 'facebook':
        if (webFallback) {
          return Uri.tryParse(trimmed.startsWith('http') ? trimmed : 'https://$trimmed');
        }
        return Uri.tryParse('fb://facewebmodal/f?href=${Uri.encodeComponent(trimmed)}');
      case 'instagram': {
        final uri = Uri.tryParse(trimmed);
        if (uri == null) return null;
        if (webFallback) {
          return Uri.tryParse(trimmed.startsWith('http') ? trimmed : 'https://$trimmed');
        }
        final segments = uri.pathSegments.where((s) => s.isNotEmpty).toList();
        if (segments.isEmpty) return null;
        final username = segments.first.startsWith('@') ? segments.first.substring(1) : segments.first;
        return Uri.tryParse('instagram://user?username=$username');
      }
      case 'twitter': {
        final uri = Uri.tryParse(trimmed);
        if (uri == null) return null;
        if (webFallback) {
          return Uri.tryParse(trimmed.startsWith('http') ? trimmed : 'https://$trimmed');
        }
        final segments = uri.pathSegments.where((s) => s.isNotEmpty).toList();
        if (segments.isEmpty) return null;
        final handle = segments.first.startsWith('@') ? segments.first.substring(1) : segments.first;
        return Uri.tryParse('twitter://user?screen_name=$handle');
      }
      case 'linkedin': {
        final uri = Uri.tryParse(trimmed);
        if (uri == null) return null;
        if (webFallback) {
          return Uri.tryParse(trimmed.startsWith('http') ? trimmed : 'https://$trimmed');
        }
        final segments = uri.pathSegments.where((s) => s.isNotEmpty).toList();
        if (segments.length < 2 || segments.first != 'in') return null;
        return Uri.tryParse('linkedin://in/${segments[1]}');
      }
      case 'youtube': {
        final uri = Uri.tryParse(trimmed);
        if (uri == null) return null;
        if (webFallback) {
          return Uri.tryParse(trimmed.startsWith('http') ? trimmed : 'https://$trimmed');
        }
        if (uri.host.contains('youtu.be')) {
          final segments = uri.pathSegments.where((s) => s.isNotEmpty).toList();
          if (segments.isEmpty) return null;
          return Uri.tryParse('vnd.youtube://${segments.first}');
        }
        if (uri.queryParameters.containsKey('v')) {
          final videoId = uri.queryParameters['v'];
          if (videoId == null || videoId.isEmpty) return null;
          return Uri.tryParse('vnd.youtube://$videoId');
        }
        final path = uri.pathSegments.where((s) => s.isNotEmpty).join('/');
        if (path.isEmpty) return null;
        return Uri.tryParse('youtube://www.youtube.com/$path');
      }
      case 'tiktok': {
        final uri = Uri.tryParse(trimmed);
        if (uri == null) return null;
        if (webFallback) {
          return Uri.tryParse(trimmed.startsWith('http') ? trimmed : 'https://$trimmed');
        }
        final segments = uri.pathSegments.where((s) => s.isNotEmpty).toList();
        if (segments.isEmpty) return null;
        final username = segments.first.startsWith('@') ? segments.first.substring(1) : segments.first;
        return Uri.tryParse('tiktok://user/profile/$username');
      }
      case 'website': {
        final uri = Uri.tryParse(trimmed.startsWith('http') ? trimmed : 'https://$trimmed');
        return uri;
      }
      default:
        return null;
    }
  }

  Future<void> _selectTime(BuildContext context, bool isOpening) async {
    final now = DateTime.now();
    final initialTime = TimeOfDay.fromDateTime(now);
    
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: initialTime,
    );

    if (picked != null) {
      final formattedTime = '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
      setState(() {
        if (isOpening) {
          _openingTimeController.text = formattedTime;
        } else {
          _closingTimeController.text = formattedTime;
        }
      });
    }
  }

  Future<void> _pickImage(String type) async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );

    if (image != null) {
      await _uploadImage(image.path, type);
    }
  }

  Future<void> _uploadImage(String filePath, String imageType) async {
    setState(() {
      _uploading = imageType;
    });

    try {
      final result = await AuthService.uploadImage(filePath, imageType: imageType);
      if (!mounted) return;
      
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      
      await AuthService.updateMe(
        logoUrl: imageType == 'logo' ? result['url'] : null,
        bannerUrl: imageType == 'banner' ? result['url'] : null,
      );
      
      await authProvider.refreshUser();
      
      if (mounted) {
        SnackbarHelper.showSuccess(context, 'Image uploaded successfully');
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Failed to upload image: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() {
          _uploading = null;
        });
      }
    }
  }

  String _formatDate(DateTime date) {
    return '${_getMonthName(date.month)} ${date.day}, ${date.year}';
  }

  String _getMonthName(int month) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  }

  Widget _buildEmployeeProfile(AuthProvider authProvider) {
    if (authProvider.employee == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadEmployeeData();
      });
      return const Center(child: CircularProgressIndicator());
    }
    
    final employee = authProvider.employee!;
    final formKey = GlobalKey<FormState>();
    
    if (_employeeNameController.text.isEmpty && employee.name != null) {
      _loadEmployeeData();
    }
    
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue.shade200, width: 2),
                ),
                child: Row(
                  children: [
                    Icon(Icons.badge, color: Colors.blue.shade700),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'You are logged in as an Employee',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue.shade700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 40,
                            backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                            child: Icon(
                              Icons.person,
                              size: 40,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        employee.name != null && employee.name!.isNotEmpty
                                            ? employee.name!
                                            : employee.username,
                                        style: const TextStyle(
                                          fontSize: 22,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: Colors.blue.shade100,
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: Colors.blue.shade300, width: 1.5),
                                      ),
                                      child: Text(
                                        'EMPLOYEE',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.blue.shade800,
                                          letterSpacing: 1,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                if (employee.name != null && employee.name!.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 4),
                                    child: Row(
                                      children: [
                                        Icon(Icons.alternate_email, size: 14, color: Colors.grey.shade600),
                                        const SizedBox(width: 4),
                                        Text(
                                          employee.username,
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.grey.shade600,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                if (employee.role != null && employee.role!.isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Row(
                                      children: [
                                        Icon(Icons.work_outline, size: 14, color: Colors.grey.shade500),
                                        const SizedBox(width: 4),
                                        Text(
                                          employee.role!,
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.grey.shade600,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      const Divider(),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _employeeNameController,
                        decoration: const InputDecoration(
                          labelText: 'Name',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _employeePhoneController,
                        decoration: const InputDecoration(
                          labelText: 'Phone',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _employeeRoleController,
                        decoration: const InputDecoration(
                          labelText: 'Role',
                          border: OutlineInputBorder(),
                          helperText: 'e.g., Order Manager, Inventory Staff',
                        ),
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _loading ? null : () async {
                            if (formKey.currentState!.validate()) {
                              await _handleEmployeeSave(authProvider);
                            }
                          },
                          child: _loading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Text('Save Changes'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              _buildEmployerInfoCard(authProvider),
              const SizedBox(height: 24),
              if (!authProvider.isEmployee) _buildLogoutButton(authProvider),
              const SizedBox(height: kBottomNavigationBarHeight + 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmployerInfoCard(AuthProvider authProvider) {
    final user = authProvider.user;
    if (user == null) return const SizedBox.shrink();
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.business,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Your Employer',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: Text(
                    user.role.toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.green.shade700,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (user.name.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Icon(Icons.store, size: 20, color: Colors.grey.shade600),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Business Name',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          Text(
                            user.name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            if (user.phone != null && user.phone!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Icon(Icons.phone, size: 20, color: Colors.grey.shade600),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Phone',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          Text(
                            user.phone!,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            if (user.address != null && user.address!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.location_on, size: 20, color: Colors.grey.shade600),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Address',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          Text(
                            user.address!,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            if (user.email.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Icon(Icons.email, size: 20, color: Colors.grey.shade600),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Email',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          Text(
                            user.email,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
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

  Future<void> _handleEmployeeSave(AuthProvider authProvider) async {
    if (authProvider.employee == null) return;
    
    setState(() {
      _loading = true;
    });

    try {
      await EmployeeService.updateEmployee(
        authProvider.employee!.id,
        name: _employeeNameController.text.trim().isEmpty ? null : _employeeNameController.text.trim(),
        phone: _employeePhoneController.text.trim().isEmpty ? null : _employeePhoneController.text.trim(),
        role: _employeeRoleController.text.trim().isEmpty ? null : _employeeRoleController.text.trim(),
      );
      
      if (mounted) {
        SnackbarHelper.showSuccess(context, 'Profile updated successfully');
        final updatedEmployee = await EmployeeService.fetchEmployees();
        final currentEmployee = updatedEmployee.firstWhere((e) => e.id == authProvider.employee!.id);
        authProvider.updateEmployee(currentEmployee);
        _loadEmployeeData();
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, e.toString().replaceAll('Exception: ', ''));
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Widget _buildBody(AuthProvider authProvider, User user) {
    final isTablet = MediaQuery.of(context).size.width >= 600;
    
    if (authProvider.isEmployee && authProvider.employee != null) {
      return _buildEmployeeProfile(authProvider);
    }
    
    final body = SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildBanner(user),
          Transform.translate(
            offset: const Offset(0, -40),
            child: _buildProfileCard(user),
          ),
          if ((user.role == 'store' || user.role == 'supplier') && !_editing)
            Transform.translate(
              offset: const Offset(0, -12),
              child: _buildOpenCloseCard(user, authProvider),
            ),
          _buildDetailsCard(user),
          if ((user.role == 'store' || user.role == 'supplier'))
            _buildHoursCard(user),
          if (!_editing && (user.role == 'store' || user.role == 'supplier') && !authProvider.isEmployee && !isTablet)
            _buildEmployeesCard(authProvider),
          if (!_editing && !isTablet) _buildAnalyticsButton(),
          if (!_editing && !authProvider.isEmployee) _buildLogoutButton(authProvider),
          const SizedBox(height: kBottomNavigationBarHeight + 24),
        ],
      ),
    );

    final layeredBody = Stack(
      children: [
        Positioned.fill(
          child: IgnorePointer(
            child: Opacity(
              opacity: 0.06,
              child: Metaballs(
                gradient: LinearGradient(
                  colors: [
                    Theme.of(context).colorScheme.primary,
                    Theme.of(context).colorScheme.secondary,
                  ],
                  begin: Alignment.bottomRight,
                  end: Alignment.topLeft,
                ),
                metaballs: 8,
                animationDuration: const Duration(milliseconds: 240),
                speedMultiplier: 0.6,
                bounceStiffness: 2.4,
                minBallRadius: 12,
                maxBallRadius: 26,
                glowRadius: 0,
                glowIntensity: 0,
              ),
            ),
          ),
        ),
        body,
      ],
    );

    final content = Platform.isIOS ? body : layeredBody;

    if (Platform.isAndroid) {
      return SafeArea(child: content);
    }
    return content;
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        final user = authProvider.user;
        final useScaffold = widget.useScaffold ?? true;
        
        if (user == null) {
          if (!useScaffold) {
            return const Center(child: CircularProgressIndicator());
          }
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final body = _buildBody(authProvider, user);
        
        if (!useScaffold) {
          return body;
        }

        return Scaffold(
          appBar: AppBar(
            actions: [
              if (!authProvider.isEmployee) ...[
                if (_editing)
                  TextButton(
                    onPressed: _loading ? null : () {
                      setState(() {
                        _editing = false;
                      });
                      _loadUserData();
                    },
                    child: const Text('Cancel'),
                  )
                else
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _editing = true;
                      });
                    },
                    child: const Text('Edit'),
                  ),
                if (_editing)
                  TextButton(
                    onPressed: _loading ? null : _handleSave,
                    child: _loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Save'),
                  ),
              ],
            ],
          ),
          body: body,
        );
      },
    );
  }

  Widget _buildBanner(User user) {
    return GestureDetector(
      onTap: _editing ? () => _pickImage('banner') : null,
      child: Container(
        height: 200,
        width: double.infinity,
        color: Colors.grey[300],
        child: Stack(
          children: [
            if (user.bannerUrl != null && user.bannerUrl!.isNotEmpty)
              Image.network(
                user.bannerUrl!,
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Container(
                    color: Colors.grey[300],
                    child: Center(
                      child: CircularProgressIndicator(
                        value: loadingProgress.expectedTotalBytes != null
                            ? loadingProgress.cumulativeBytesLoaded /
                                loadingProgress.expectedTotalBytes!
                            : null,
                      ),
                    ),
                  );
                },
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    color: Colors.grey[300],
                    child: const Icon(Icons.image, size: 48, color: Colors.grey),
                  );
                },
              ),
            if (_editing)
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: _uploading == 'banner'
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Icon(Icons.edit, color: Colors.white, size: 20),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileCard(User user) {
    return Card(
      margin: const EdgeInsets.only(left: 16, right: 16, bottom: 0),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          children: [
            GestureDetector(
              onTap: _editing ? () => _pickImage('logo') : null,
              child: Stack(
                children: [
                  user.logoUrl != null && user.logoUrl!.isNotEmpty
                        ? Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white,
                              border: Border.all(
                                color: Colors.grey.shade300,
                                width: 1,
                              ),
                            ),
                            child: ClipOval(
                              clipBehavior: Clip.antiAliasWithSaveLayer,
                              child: OverflowBox(
                                minWidth: 80,
                                minHeight: 80,
                                maxWidth: 640,
                                maxHeight: 640,
                                alignment: Alignment.center,
                                child: Transform.scale(
                                  scale: 8.0,
                                  alignment: Alignment.center,
                                  child: Image.network(
                                    user.logoUrl!,
                                    width: 80,
                                    height: 80,
                                    fit: BoxFit.cover,
                                    alignment: Alignment.center,
                                    filterQuality: FilterQuality.high,
                                    errorBuilder: (context, error, stackTrace) {
                                      return CircleAvatar(
                                        radius: 40,
                                        backgroundColor: Theme.of(context).primaryColor,
                                        child: Text(
                                          user.name.isNotEmpty ? user.name[0].toUpperCase() : 'U',
                                          style: const TextStyle(
                                            fontSize: 32,
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ),
                            ),
                          )
                        : CircleAvatar(
                            radius: 40,
                            backgroundColor: Theme.of(context).primaryColor,
                            child: Text(
                              user.name.isNotEmpty ? user.name[0].toUpperCase() : 'U',
                              style: const TextStyle(
                                fontSize: 32,
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                  if (_editing)
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: _uploading == 'logo'
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Icon(Icons.edit, color: Colors.white, size: 16),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            if (_editing)
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Name',
                  border: OutlineInputBorder(),
                ),
              )
            else
              Text(
                user.name,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            const SizedBox(height: 8),
            Text(
              user.role.toUpperCase(),
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            if (!_editing && (user.role == 'store' || user.role == 'supplier') && user.ratingCount != null && user.ratingCount! > 0) ...[
              const SizedBox(height: 12),
              Focus(
                skipTraversal: true,
                canRequestFocus: false,
                child: InkWell(
                  onTap: () {
                    if (!mounted) return;
                    Navigator.pushNamed(context, '/ratings');
                  },
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ...List.generate(5, (index) {
                        final rating = user.averageRating ?? 0;
                        return Icon(
                          index < rating.round() ? Icons.star : Icons.star_border,
                          color: Colors.amber,
                          size: 20,
                        );
                      }),
                      const SizedBox(width: 8),
                      Text(
                        '${(user.averageRating ?? 0).toStringAsFixed(1)} (${user.ratingCount} ${user.ratingCount == 1 ? 'rating' : 'ratings'})',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            ],
            if (!_editing) _buildSocialLinks(user),
          ],
        ),
      ),
    );
  }

  Widget _buildSocialLinks(User user) {
    final links = <Map<String, dynamic>>[];
    links.add({'type': 'email', 'url': 'mailto:${user.email}'});
    if (user.facebook != null && user.facebook!.isNotEmpty) links.add({'type': 'facebook', 'url': user.facebook!});
    if (user.instagram != null && user.instagram!.isNotEmpty) links.add({'type': 'instagram', 'url': user.instagram!});
    if (user.twitter != null && user.twitter!.isNotEmpty) links.add({'type': 'twitter', 'url': user.twitter!});
    if (user.linkedin != null && user.linkedin!.isNotEmpty) links.add({'type': 'linkedin', 'url': user.linkedin!});
    if (user.youtube != null && user.youtube!.isNotEmpty) links.add({'type': 'youtube', 'url': user.youtube!});
    if (user.tiktok != null && user.tiktok!.isNotEmpty) links.add({'type': 'tiktok', 'url': user.tiktok!});
    if (user.website != null && user.website!.isNotEmpty) links.add({'type': 'website', 'url': user.website!});

    if (links.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 8),
      child: Wrap(
        spacing: 12,
        runSpacing: 12,
        alignment: WrapAlignment.center,
        children: links.map((link) {
          final type = link['type'] as String;
          final raw = link['url'] as String;
          return IconButton(
            icon: _getSocialIcon(type),
            iconSize: 28,
            padding: const EdgeInsets.all(8),
            constraints: const BoxConstraints(),
            onPressed: () async {
              final appUri = _buildSocialUri(type, raw, webFallback: false);
              if (appUri != null && await canLaunchUrl(appUri)) {
                try {
                  await launchUrl(appUri, mode: LaunchMode.externalApplication);
                  return;
                } catch (e) {
                  debugPrint('Open $type app link failed: $e');
                }
              }
              
              final webUri = _buildSocialUri(type, raw, webFallback: true);
              if (webUri != null && await canLaunchUrl(webUri)) {
                await launchUrl(webUri, mode: LaunchMode.externalApplication);
              } else {
                if (!mounted) return;
                SnackbarHelper.showError(context, 'Unable to open $type link');
              }
            },
          );
        }).toList(),
      ),
    );
  }

  Widget _getSocialIcon(String type) {
    switch (type) {
      case 'email':
        return const Icon(Icons.email, color: Color(0xFF1976D2));
      case 'facebook':
        return const Icon(Icons.facebook, color: Color(0xFF1877F2));
      case 'instagram':
        return const Icon(Icons.camera_alt, color: Color(0xFFE4405F));
      case 'twitter':
        return const Icon(Icons.alternate_email, color: Colors.black);
      case 'linkedin':
        return const Icon(Icons.business, color: Color(0xFF0077B5));
      case 'youtube':
        return const Icon(Icons.play_circle, color: Color(0xFFFF0000));
      case 'tiktok':
        return const Text('TT', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14));
      case 'website':
        return const Icon(Icons.language, color: Color(0xFF1976D2));
      default:
        return const Icon(Icons.link);
    }
  }

  Widget _buildDetailsCard(User user) {
    final LatLng? userLocation = user.latitude != null && user.longitude != null
        ? LatLng(user.latitude!, user.longitude!)
        : null;
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Account Details',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Divider(),
            _buildDetailRow('User ID', user.id.toString()),
            _buildDetailRow('Email', user.email),
            if (_editing)
              TextField(
                controller: _phoneController,
                decoration: const InputDecoration(
                  labelText: 'Phone',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
              )
            else if (user.phone != null && user.phone!.isNotEmpty)
              _buildDetailRow('Phone', user.phone!),
            if (_editing)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: _addressController,
                      decoration: const InputDecoration(
                        labelText: 'Address',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 12),
                    Center(
                      child: FractionallySizedBox(
                        widthFactor: 0.8,
                        child: OutlinedButton.icon(
                          onPressed: () async {
                            final result = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => LocationPickerScreen(
                                  initialLatitude: _latitude,
                                  initialLongitude: _longitude,
                                ),
                              ),
                            );
                            if (result != null && mounted) {
                              setState(() {
                                _latitude = result['latitude'] as double;
                                _longitude = result['longitude'] as double;
                              });
                            }
                          },
                          icon: const Icon(Icons.location_on),
                          label: Text(_latitude != null && _longitude != null ? 'Location Selected' : 'Select Location'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ),
                    if (_latitude != null && _longitude != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          'Lat: ${_latitude!.toStringAsFixed(6)}, Lng: ${_longitude!.toStringAsFixed(6)}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.grey,
                          ),
                        ),
                      ),
                  ],
                ),
              )
            else ...[
              if (user.address != null && user.address!.isNotEmpty)
                _buildDetailRow('Address', user.address!),
              if (userLocation != null) ...[
                const SizedBox(height: 8),
                Center(
                  child: Text(
                    'Lat: ${user.latitude!.toStringAsFixed(6)}, Lng: ${user.longitude!.toStringAsFixed(6)}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w400,
                      color: Colors.black87,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SizedBox(
                    height: 220,
                    width: double.infinity,
                    child: Stack(
                      children: [
                        FlutterMap(
                          mapController: _detailMapController,
                          options: MapOptions(
                            initialCenter: userLocation,
                            initialZoom: _detailMapZoom,
                            minZoom: _detailMapMinZoom,
                            maxZoom: _detailMapMaxZoom,
                          ),
                          children: [
                            TileLayer(
                              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              userAgentPackageName: 'com.example.siargaoTradingRoad',
                            ),
                            MarkerLayer(
                              markers: [
                                Marker(
                                  point: userLocation,
                                  width: 40,
                                  height: 40,
                                  child: const Icon(
                                    Icons.location_on,
                                    color: Colors.red,
                                    size: 40,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        Positioned(
                          right: 12,
                          bottom: 12,
                          child: Column(
                            children: [
                              Material(
                                color: Colors.white,
                                elevation: 2,
                                shape: const CircleBorder(),
                                child: IconButton(
                                  onPressed: () {
                                    final newZoom = (_detailMapZoom + 1).clamp(_detailMapMinZoom, _detailMapMaxZoom);
                                    setState(() {
                                      _detailMapZoom = newZoom;
                                    });
                                    _detailMapController.move(userLocation, newZoom);
                                  },
                                  icon: const Icon(Icons.add),
                                  tooltip: 'Zoom in',
                                ),
                              ),
                              const SizedBox(height: 8),
                              Material(
                                color: Colors.white,
                                elevation: 2,
                                shape: const CircleBorder(),
                                child: IconButton(
                                  onPressed: () {
                                    final newZoom = (_detailMapZoom - 1).clamp(_detailMapMinZoom, _detailMapMaxZoom);
                                    setState(() {
                                      _detailMapZoom = newZoom;
                                    });
                                    _detailMapController.move(userLocation, newZoom);
                                  },
                                  icon: const Icon(Icons.remove),
                                  tooltip: 'Zoom out',
                                ),
                              ),
                              const SizedBox(height: 8),
                              Material(
                                color: Colors.white,
                                elevation: 2,
                                shape: const CircleBorder(),
                                child: IconButton(
                                  onPressed: () {
                                    setState(() {
                                      _detailMapZoom = 16;
                                    });
                                    _detailMapController.move(userLocation, _detailMapZoom);
                                  },
                                  icon: const Icon(Icons.my_location),
                                  tooltip: 'Recenter',
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Center(
                child: Text(
                  'Member since ${_formatDate(user.createdAt)}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
            if (_editing) ...[
              const Divider(),
              const Text(
                'Social Media Links',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _facebookController,
                decoration: const InputDecoration(
                  labelText: 'Facebook',
                  border: OutlineInputBorder(),
                  hintText: 'https://facebook.com/...',
                ),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _instagramController,
                decoration: const InputDecoration(
                  labelText: 'Instagram',
                  border: OutlineInputBorder(),
                  hintText: 'https://instagram.com/...',
                ),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _twitterController,
                decoration: const InputDecoration(
                  labelText: 'Twitter/X',
                  border: OutlineInputBorder(),
                  hintText: 'https://twitter.com/...',
                ),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _linkedinController,
                decoration: const InputDecoration(
                  labelText: 'LinkedIn',
                  border: OutlineInputBorder(),
                  hintText: 'https://linkedin.com/...',
                ),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _youtubeController,
                decoration: const InputDecoration(
                  labelText: 'YouTube',
                  border: OutlineInputBorder(),
                  hintText: 'https://youtube.com/...',
                ),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _tiktokController,
                decoration: const InputDecoration(
                  labelText: 'TikTok',
                  border: OutlineInputBorder(),
                  hintText: 'https://tiktok.com/...',
                ),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _websiteController,
                decoration: const InputDecoration(
                  labelText: 'Website',
                  border: OutlineInputBorder(),
                  hintText: 'https://example.com',
                ),
                keyboardType: TextInputType.url,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Flexible(
            flex: 2,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.grey[700],
              ),
            ),
          ),
          const SizedBox(width: 16),
          Flexible(
            flex: 3,
            child: Text(
              value,
              style: const TextStyle(fontSize: 14),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _toggleStoreStatus(User user, AuthProvider authProvider) async {
    setState(() {
      _loading = true;
    });
    try {
      if (user.isOpen) {
        await AuthService.closeStore();
      } else {
        await AuthService.openStore();
      }
      await authProvider.refreshUser();
      if (mounted) {
        SnackbarHelper.showSuccess(
          context,
          user.isOpen
              ? 'Store is closed'
              : 'Store is open for business',
        );
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Failed to update status: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Widget _buildOpenCloseCard(User user, AuthProvider authProvider) {
    final isOpen = user.isOpen;
    
    return Card(
      margin: const EdgeInsets.only(left: 16, right: 16, bottom: 8),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: isOpen ? Colors.green.shade50 : Colors.red.shade50,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isOpen ? 'Currently Open' : 'Currently Closed',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isOpen
                          ? 'Your ${user.role} is open for business'
                          : 'Your ${user.role} is closed',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              Switch(
                value: isOpen,
                onChanged: _loading ? null : (value) async {
                  await _toggleStoreStatus(user, authProvider);
                },
                activeThumbColor: Colors.green,
                activeTrackColor: Colors.green.shade200,
                inactiveThumbColor: Colors.red.shade700,
                inactiveTrackColor: Colors.red.shade200,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmployeesCard(AuthProvider authProvider) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
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
            const Divider(),
            if (_employeesLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_employeeError != null)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  _employeeError!,
                  style: const TextStyle(color: Colors.red),
                ),
              )
            else if (_employees.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Text('No employees yet. Add your first employee.'),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemBuilder: (context, index) {
                  final employee = _employees[index];
                  return InkWell(
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
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        employee.username,
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: employee.statusActive
                                            ? Colors.green.withValues(alpha: 0.1)
                                            : Colors.grey.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        employee.statusActive ? 'Active' : 'Inactive',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w500,
                                          color: employee.statusActive
                                              ? Colors.green.shade700
                                              : Colors.grey.shade700,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                if ((employee.name ?? '').isNotEmpty || (employee.role ?? '').isNotEmpty)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(
                                      [
                                        if ((employee.name ?? '').isNotEmpty) employee.name!,
                                        if ((employee.role ?? '').isNotEmpty) employee.role!
                                      ].join(' • '),
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                  ),
                                Padding(
                                  padding: const EdgeInsets.only(top: 8),
                                  child: Wrap(
                                    spacing: 6,
                                    runSpacing: 6,
                                    children: [
                                      if (employee.canManageInventory)
                                        _buildPermissionChip('Inventory', Icons.inventory_2_outlined),
                                      if (employee.canManageOrders)
                                        _buildPermissionChip('Orders', Icons.shopping_cart_outlined),
                                      if (employee.canChat)
                                        _buildPermissionChip('Chat', Icons.chat_outlined),
                                      if (employee.canChangeStatus)
                                        _buildPermissionChip('Status', Icons.toggle_on_outlined),
                                      if (!employee.canManageInventory &&
                                          !employee.canManageOrders &&
                                          !employee.canChat &&
                                          !employee.canChangeStatus)
                                        _buildPermissionChip('No access', Icons.block_outlined),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Switch(
                                value: employee.statusActive,
                                onChanged: (_) => _toggleEmployeeStatus(employee),
                              ),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.history, size: 20),
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
                                    tooltip: 'View audit logs',
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.edit_outlined, size: 20),
                                    onPressed: () => _openEmployeeDialog(employee: employee),
                                    tooltip: 'Edit employee',
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
                separatorBuilder: (context, index) => const SizedBox(height: 4),
                itemCount: _employees.length,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildHoursCard(User user) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Flexible(
                  child: Text(
                    'Operating Hours',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (!_editingHours)
                      TextButton.icon(
                        onPressed: () {
                          Navigator.pushNamed(context, '/schedule');
                        },
                        icon: const Icon(Icons.calendar_today, size: 18),
                        label: const Text('Calendar'),
                      ),
                    if (!_editingHours)
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _editingHours = true;
                          });
                        },
                        child: const Text('Edit'),
                      ),
                  ],
                ),
              ],
            ),
            const Divider(),
            if (_editingHours) ...[
              Row(
                children: [
                  Expanded(
                    child: Focus(
                      skipTraversal: true,
                      canRequestFocus: false,
                      child: InkWell(
                        onTap: () {
                          if (!mounted) return;
                          _selectTime(context, true);
                        },
                        child: TextField(
                        controller: _openingTimeController,
                        decoration: const InputDecoration(
                          labelText: 'Opening Time',
                          border: OutlineInputBorder(),
                          hintText: 'Tap to select time',
                          helperText: 'Opening time',
                          suffixIcon: Icon(Icons.access_time),
                        ),
                        enabled: false,
                      ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Focus(
                      skipTraversal: true,
                      canRequestFocus: false,
                      child: InkWell(
                        onTap: () {
                          if (!mounted) return;
                          _selectTime(context, false);
                        },
                        child: TextField(
                          controller: _closingTimeController,
                        decoration: const InputDecoration(
                          labelText: 'Closing Time',
                          border: OutlineInputBorder(),
                          hintText: 'Tap to select time',
                          helperText: 'Closing time',
                          suffixIcon: Icon(Icons.access_time),
                        ),
                        enabled: false,
                      ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text(
                'Closed Days of Week',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Select days when you are closed. Unselected days are your working days.',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  _buildDayCheckbox(0, 'Sunday'),
                  _buildDayCheckbox(1, 'Monday'),
                  _buildDayCheckbox(2, 'Tuesday'),
                  _buildDayCheckbox(3, 'Wednesday'),
                  _buildDayCheckbox(4, 'Thursday'),
                  _buildDayCheckbox(5, 'Friday'),
                  _buildDayCheckbox(6, 'Saturday'),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _editingHours = false;
                        _loadUserData();
                      });
                    },
                    child: const Text('Cancel'),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _loading ? null : _saveHours,
                    child: _loading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Save'),
                  ),
                ],
              ),
            ] else ...[
              Builder(
                builder: (context) {
                  final hasOpeningTime = user.openingTime != null && user.openingTime!.trim().isNotEmpty;
                  final hasClosingTime = user.closingTime != null && user.closingTime!.trim().isNotEmpty;
                  
                  if (hasOpeningTime || hasClosingTime) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (hasOpeningTime)
                          _buildDetailRow('Opening Time', user.openingTime!),
                        if (hasClosingTime)
                          _buildDetailRow('Closing Time', user.closingTime!),
                      ],
                    );
                  } else {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Text(
                        'No operating hours set',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    );
                  }
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDayCheckbox(int day, String label) {
    return FilterChip(
      label: Text(label),
      selected: _closedDays.contains(day),
      onSelected: (selected) {
        setState(() {
          if (selected) {
            _closedDays.add(day);
          } else {
            _closedDays.remove(day);
          }
        });
      },
    );
  }

  Widget _buildAnalyticsButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: ElevatedButton.icon(
        onPressed: () {
          Navigator.pushNamed(context, '/analytics');
        },
        icon: const Icon(Icons.analytics, color: Colors.white),
        label: const Text('View Analytics', style: TextStyle(color: Colors.white)),
        style: ElevatedButton.styleFrom(
          backgroundColor: Theme.of(context).colorScheme.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }

  Widget _buildLogoutButton(AuthProvider authProvider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ElevatedButton(
        onPressed: () async {
          await authProvider.logout();
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.red,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text('Logout', style: TextStyle(color: Colors.white)),
      ),
    );
  }
}
