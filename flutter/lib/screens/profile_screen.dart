import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
import 'package:siargao_trading_road/services/auth_service.dart';
import 'package:siargao_trading_road/models/user.dart';
import 'dart:io';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _editing = false;
  bool _loading = false;
  String? _uploading;
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _facebookController = TextEditingController();
  final _instagramController = TextEditingController();
  final _twitterController = TextEditingController();
  final _linkedinController = TextEditingController();
  final _youtubeController = TextEditingController();
  final _tiktokController = TextEditingController();
  final _websiteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  void _loadUserData() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    if (user != null) {
      _nameController.text = user.name;
      _phoneController.text = user.phone ?? '';
      _facebookController.text = user.facebook ?? '';
      _instagramController.text = user.instagram ?? '';
      _twitterController.text = user.twitter ?? '';
      _linkedinController.text = user.linkedin ?? '';
      _youtubeController.text = user.youtube ?? '';
      _tiktokController.text = user.tiktok ?? '';
      _websiteController.text = user.website ?? '';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _facebookController.dispose();
    _instagramController.dispose();
    _twitterController.dispose();
    _linkedinController.dispose();
    _youtubeController.dispose();
    _tiktokController.dispose();
    _websiteController.dispose();
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
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update profile: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
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
      final result = await AuthService.uploadImage(filePath);
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      
      await AuthService.updateMe(
        logoUrl: imageType == 'logo' ? result['url'] : null,
        bannerUrl: imageType == 'banner' ? result['url'] : null,
      );
      
      await authProvider.refreshUser();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Image uploaded successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to upload image: ${e.toString()}')),
        );
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
    return '${date.day} ${_getMonthName(date.month)} ${date.year}';
  }

  String _getMonthName(int month) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        final user = authProvider.user;
        if (user == null) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: const Text('Profile'),
            actions: [
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
          ),
          body: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildBanner(user),
                Transform.translate(
                  offset: const Offset(0, -40),
                  child: _buildProfileCard(user),
                ),
                _buildDetailsCard(user),
                if (!_editing) _buildLogoutButton(authProvider),
                const SizedBox(height: 32),
              ],
            ),
          ),
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
                errorBuilder: (context, error, stackTrace) {
                  return Container(color: Colors.grey[300]);
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
      margin: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            GestureDetector(
              onTap: _editing ? () => _pickImage('logo') : null,
              child: Stack(
                children: [
                  if (user.logoUrl != null && user.logoUrl!.isNotEmpty)
                    CircleAvatar(
                      radius: 40,
                      backgroundImage: NetworkImage(user.logoUrl!),
                    )
                  else
                    CircleAvatar(
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
            const SizedBox(height: 16),
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
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            const SizedBox(height: 4),
            Text(
              user.role.toUpperCase(),
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            if (!_editing && (user.role == 'store' || user.role == 'supplier') && user.ratingCount != null && user.ratingCount! > 0) ...[
              const SizedBox(height: 12),
              Row(
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
            ],
            if (!_editing) _buildSocialLinks(user),
          ],
        ),
      ),
    );
  }

  Widget _buildSocialLinks(User user) {
    final links = <Map<String, dynamic>>[];
    if (user.email != null) links.add({'type': 'email', 'url': 'mailto:${user.email}'});
    if (user.facebook != null && user.facebook!.isNotEmpty) links.add({'type': 'facebook', 'url': user.facebook!});
    if (user.instagram != null && user.instagram!.isNotEmpty) links.add({'type': 'instagram', 'url': user.instagram!});
    if (user.twitter != null && user.twitter!.isNotEmpty) links.add({'type': 'twitter', 'url': user.twitter!});
    if (user.linkedin != null && user.linkedin!.isNotEmpty) links.add({'type': 'linkedin', 'url': user.linkedin!});
    if (user.youtube != null && user.youtube!.isNotEmpty) links.add({'type': 'youtube', 'url': user.youtube!});
    if (user.tiktok != null && user.tiktok!.isNotEmpty) links.add({'type': 'tiktok', 'url': user.tiktok!});
    if (user.website != null && user.website!.isNotEmpty) links.add({'type': 'website', 'url': user.website!});

    if (links.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Wrap(
        spacing: 8,
        alignment: WrapAlignment.center,
        children: links.map((link) {
          return IconButton(
            icon: _getSocialIcon(link['type'] as String),
            onPressed: () async {
              final url = Uri.parse(link['url'] as String);
              if (await canLaunchUrl(url)) {
                await launchUrl(url);
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
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
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
            _buildDetailRow('User ID', user.id.toString()),
            const Divider(),
            _buildDetailRow('Account Created', _formatDate(user.createdAt)),
            _buildDetailRow('Last Updated', _formatDate(user.updatedAt)),
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
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.grey[700],
            ),
          ),
          Flexible(
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

  Widget _buildLogoutButton(AuthProvider authProvider) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: ElevatedButton(
        onPressed: () async {
          await authProvider.logout();
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.red,
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
        child: const Text('Logout', style: TextStyle(color: Colors.white)),
      ),
    );
  }
}
