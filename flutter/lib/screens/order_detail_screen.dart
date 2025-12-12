import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:intl/intl.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
import 'package:siargao_trading_road/services/order_service.dart';
import 'package:siargao_trading_road/services/rating_service.dart';
import 'package:siargao_trading_road/models/order.dart' show Order, Message;
import 'package:siargao_trading_road/models/user.dart' show User;
import 'package:siargao_trading_road/widgets/order_map.dart';
import 'package:siargao_trading_road/services/api_service.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';
import 'package:siargao_trading_road/services/auth_service.dart';
import 'package:siargao_trading_road/services/fcm_service.dart';
import 'package:siargao_trading_road/widgets/shimmer_loading.dart';
import 'package:siargao_trading_road/utils/snackbar_helper.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'dart:io';
import 'dart:async';

class OrderDetailScreen extends StatefulWidget {
  const OrderDetailScreen({super.key});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  Order? _order;
  bool _loading = true;
  bool _loadingMessages = false;
  final bool _updatingStatus = false;
  bool _updatingPayment = false;
  bool _submittingRating = false;
  List<Message> _messages = [];
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final _messagesScrollController = ScrollController();
  bool _showRatingDialog = false;
  int _ratingValue = 5;
  final _ratingCommentController = TextEditingController();
  String? _errorMessage;
  String? _apiResponse;
  int? _apiStatusCode;
  static const bool _showApiResponse = false;
  StreamSubscription<RemoteMessage>? _fcmSubscription;
  Timer? _messagePollTimer;

  @override
  void initState() {
    super.initState();
    _messageController.addListener(() {
      if (mounted) {
        setState(() {});
      }
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        Future.delayed(const Duration(milliseconds: 100), () {
          if (mounted) {
            _loadOrder();
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _fcmSubscription?.cancel();
    _messagePollTimer?.cancel();
    _messageController.dispose();
    _ratingCommentController.dispose();
    _scrollController.dispose();
    _messagesScrollController.dispose();
    super.dispose();
  }

  Future<void> _loadOrder() async {
    if (!mounted) return;
    
    try {
      final route = ModalRoute.of(context);
      if (route == null) {
        if (mounted) {
          setState(() {
            _loading = false;
            _order = null;
            _errorMessage = 'Route not available';
          });
        }
        return;
      }
      
      final args = route.settings.arguments;
      
      int? orderId;
      
      if (args is Map) {
        final argsMap = args;
        final idValue = argsMap['orderId'];
        if (idValue is int) {
          orderId = idValue;
        } else if (idValue is num) {
          orderId = idValue.toInt();
        }
      } else if (args is int) {
        orderId = args;
      } else if (args is num) {
        orderId = args.toInt();
      }
      
      if (orderId == null) {
        if (mounted) {
          setState(() {
            _loading = false;
            _order = null;
            _errorMessage = 'No order ID provided';
            _apiResponse = 'API was not called because no order ID was provided.\n\nRoute arguments: ${args?.toString() ?? "null"}';
            _apiStatusCode = null;
          });
        }
        return;
      }

      if (mounted) {
        setState(() {
          _loading = true;
          _errorMessage = null;
        });
      }

      try {
        if (kDebugMode) {
          print('Loading order $orderId from API...');
        }
        final loadedOrder = await OrderService.getOrder(
          orderId,
          checkLocalFirst: false,
          fallbackToLocal: false,
          forceRefresh: true,
          onResponse: (statusCode, responseBody) {
            if (mounted) {
              setState(() {
                _apiStatusCode = statusCode;
                _apiResponse = responseBody;
              });
            }
          },
        );
        if (mounted) {
          setState(() {
            _order = loadedOrder;
            _loading = false;
            _errorMessage = null;
          });
          _loadMessages();
          _setupFCMListener();
          _startMessagePolling();
        }
      } catch (e) {
        if (kDebugMode) {
          print('Error loading order $orderId: $e');
        }
        if (mounted) {
          final errorStr = e.toString();
          final isNotFound = errorStr.contains('not found') || errorStr.contains('404');
          final isUnauthorized = errorStr.contains('401') || errorStr.contains('Unauthorized') || errorStr.contains('authorization');
          
          setState(() {
            _loading = false;
            _order = null;
            if (isUnauthorized) {
              _errorMessage = 'Authentication failed. Please log in again.';
            } else if (isNotFound) {
              _errorMessage = 'Order not found. It may have been deleted or you may not have permission to view it.';
            } else {
              _errorMessage = errorStr.replaceAll('Exception: ', '');
            }
          });
          
          if (mounted) {
            try {
              SnackbarHelper.showError(context, 'Failed to load order: ${errorStr.replaceAll('Exception: ', '')}');
            } catch (_) {
            }
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _order = null;
          _errorMessage = 'Error loading order: ${e.toString()}';
        });
      }
    }
  }


  Future<void> _loadMessages() async {
    if (_order?.id == null || !mounted) return;

    if (mounted) {
      try {
        setState(() {
          _loadingMessages = true;
        });
      } catch (e) {
        return;
      }
    }

    try {
      final orderId = _order?.id;
      if (orderId == null || !mounted) return;
      
      final messages = await OrderService.getMessages(orderId);
      if (mounted) {
        try {
          setState(() {
            _messages = messages;
            _loadingMessages = false;
          });
          _scrollToBottom();
        } catch (_) {
        }
      }
    } catch (e) {
      if (mounted) {
        try {
          setState(() {
            _loadingMessages = false;
          });
        } catch (_) {
        }
      }
    }
  }

  void _setupFCMListener() {
    if (_order?.id == null) return;
    
    _fcmSubscription?.cancel();
    _fcmSubscription = FCMService().messageStream?.listen((RemoteMessage message) {
      if (!mounted) return;
      
      final data = message.data;
      final type = data['type'] as String?;
      final orderIdStr = data['order_id'] as String?;
      
      if (type == 'new_message' && orderIdStr != null) {
        final orderId = int.tryParse(orderIdStr);
        if (orderId == _order?.id) {
          if (kDebugMode) {
            print('New message notification received for order $orderId, refreshing messages...');
          }
          _loadMessages();
        }
      }
    });
  }

  void _startMessagePolling() {
    _messagePollTimer?.cancel();
    _messagePollTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (!mounted || _order?.id == null) {
        timer.cancel();
        return;
      }
      _loadMessages();
    });
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_messagesScrollController.hasClients) {
        _messagesScrollController.animateTo(
          _messagesScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }



  Future<void> _handleUpdateStatus(String status) async {
    if (_order?.id == null) return;

    setState(() {
      _updatingPayment = true;
    });

    try {
      await OrderService.updateOrderStatus(_order!.id, status);
      await _loadOrder();
      if (mounted) {
        SnackbarHelper.showSuccess(context, 'Order status updated');
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Failed to update status: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() {
          _updatingPayment = false;
        });
      }
    }
  }

  Future<void> _handleMarkDelivered() async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Mark as Delivered'),
        content: const Text('Are you sure you want to mark this order as delivered?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _handleUpdateStatus('delivered');
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleMarkPaymentAsPaid() async {
    if (_order?.id == null) return;

    setState(() {
      _updatingPayment = true;
    });

    try {
      await OrderService.markPaymentAsPaid(_order!.id);
      await _loadOrder();
      if (mounted) {
        SnackbarHelper.showSuccess(context, 'Payment marked as paid');
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Failed to mark as paid: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() {
          _updatingPayment = false;
        });
      }
    }
  }

  Future<void> _handleMarkPaymentAsPending() async {
    if (_order?.id == null) return;

    setState(() {
      _updatingPayment = true;
    });

    try {
      await OrderService.markPaymentAsPending(_order!.id);
      await _loadOrder();
      if (mounted) {
        SnackbarHelper.showSuccess(context, 'Payment reverted to pending');
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Failed to revert payment: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() {
          _updatingPayment = false;
        });
      }
    }
  }

  void _handleCancelOrder() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Order'),
        content: const Text('Are you sure you want to cancel this order?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _handleUpdateStatus('cancelled');
            },
            child: const Text('Yes, cancel'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleCall(User? entity) async {
    if (entity?.phone == null || entity!.phone!.isEmpty) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Phone number not available');
      }
      return;
    }

    var phoneNumber = entity.phone!.replaceAll(RegExp(r'[^0-9+]'), '');
    if (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('0')) {
      phoneNumber = '+63$phoneNumber';
    } else if (phoneNumber.startsWith('0')) {
      phoneNumber = '+63${phoneNumber.substring(1)}';
    }

    final telUrl = Uri.parse('tel:$phoneNumber');
    if (await canLaunchUrl(telUrl)) {
      await launchUrl(telUrl);
    } else {
      if (mounted) {
        SnackbarHelper.showError(context, 'Phone dialer not available');
      }
    }
  }

  Future<void> _handleDownloadInvoice() async {
    if (_order?.id == null) return;

    try {
      if (mounted) {
        SnackbarHelper.showInfo(context, 'Downloading invoice...');
      }

      final invoiceUrl = '${ApiService.baseUrl}/orders/${_order!.id}/invoice';
      debugPrint('invoice download url: $invoiceUrl');
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final response = await http.get(
        Uri.parse(invoiceUrl),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );
      if (!mounted) return;
      debugPrint('invoice download status: ${response.statusCode}, bytes: ${response.bodyBytes.length}');

      if (response.statusCode == 200) {
        final directory = await getApplicationDocumentsDirectory();
        final date = _order!.createdAt.toIso8601String().split('T')[0];
        final entityName = _order!.store?.name ?? _order!.supplier?.name ?? 'Store';
        final sanitizedName = entityName.replaceAll(RegExp(r'[^a-zA-Z0-9\s-]'), '').replaceAll(' ', '-').toLowerCase();
        final fileName = 'invoice-$date-$sanitizedName-${_order!.id}.pdf';
        final file = File('${directory.path}/$fileName');

        await file.writeAsBytes(response.bodyBytes);
        if (!mounted) return;
        final xFile = XFile(file.path);
        final box = context.findRenderObject() as RenderBox?;
        final origin = box != null ? box.localToGlobal(Offset.zero) & box.size : null;
        if (origin != null) {
          await Share.shareXFiles([xFile], sharePositionOrigin: origin);
        } else {
          await Share.shareXFiles([xFile]);
        }

        if (mounted) {
          SnackbarHelper.showSuccess(context, 'Invoice downloaded successfully');
        }
      } else {
        throw Exception('Failed to download invoice');
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Failed to download invoice: ${e.toString()}');
      }
    }
  }

  bool _hasRated() {
    if (_order?.ratings == null || _order!.ratings!.isEmpty) return false;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    if (user == null) return false;
    return _order!.ratings!.any((rating) => rating.raterId == user.id);
  }

  bool _canRate() {
    return _order?.status == 'delivered' && !_hasRated();
  }

  Future<void> _handleSubmitRating() async {
    if (_order == null) return;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user;
    if (user == null) return;

    final ratedId = user.role == 'store' ? _order!.supplierId : _order!.storeId;

    setState(() {
      _submittingRating = true;
    });

    try {
      await RatingService.createRating(
        orderId: _order!.id,
        ratedId: ratedId,
        rating: _ratingValue,
        comment: _ratingCommentController.text.trim().isEmpty
            ? null
            : _ratingCommentController.text.trim(),
      );
      setState(() {
        _showRatingDialog = false;
        _ratingValue = 5;
        _ratingCommentController.clear();
      });
      await _loadOrder();
      if (mounted) {
        SnackbarHelper.showSuccess(context, 'Rating submitted successfully');
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Failed to submit rating: ${e.toString()}');
      }
    } finally {
      if (mounted) {
        setState(() {
          _submittingRating = false;
        });
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'preparing':
        return Colors.orange;
      case 'in_transit':
        return Colors.blue;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'preparing':
        return 'Preparing';
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  bool _isMessagingClosed() {
    if (_order?.status != 'delivered') return false;
    final deliveredTime = _order!.updatedAt;
    final now = DateTime.now();
    final hoursSinceDelivery = now.difference(deliveredTime).inHours;
    return hoursSinceDelivery >= 12;
  }

  bool _canCancelOrder(user) {
    if (user?.role != 'store') return false;
    return _order != null && (_order!.status == 'draft' || _order!.status == 'preparing');
  }

  Future<void> _handleSendTextMessage(String text) async {
    if (_order?.id == null || _isMessagingClosed() || text.isEmpty) return;

    _messageController.clear();
    setState(() {});

    try {
      await OrderService.createMessage(_order!.id, text);
      await _loadMessages();
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Failed to send message: ${e.toString()}');
      }
    }
  }

  Future<void> _handleAttachmentPressed() async {
    if (_order?.id == null || _isMessagingClosed()) return;

    try {
      final picker = ImagePicker();
      final image = await picker.pickImage(source: ImageSource.gallery);
      
      if (image == null) return;

      if (mounted) {
        SnackbarHelper.showInfo(context, 'Uploading image...');
      }

      final uploadResult = await AuthService.uploadImage(image.path);
      final imageUrl = uploadResult['url'];

      await OrderService.createMessage(_order!.id, '', imageUrl: imageUrl);
      await _loadMessages();

      if (mounted) {
        SnackbarHelper.showSuccess(context, 'Image sent');
      }
    } catch (e) {
      if (mounted) {
        SnackbarHelper.showError(context, 'Failed to send image: ${e.toString()}');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Builder(
      builder: (context) {
        try {
          final authProvider = Provider.of<AuthProvider>(context);
          final user = authProvider.user;

          if (_loading) {
            return Scaffold(
              appBar: AppBar(title: const Text('Order Details')),
              body: const ShimmerOrderDetail(),
            );
          }

          if (_order == null) {
            return Scaffold(
              appBar: AppBar(title: const Text('Order Details')),
              body: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      const Text(
                        'Order not found',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      if (_errorMessage != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          _errorMessage!,
                          style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                          textAlign: TextAlign.center,
                        ),
                      ],
                      if (kDebugMode && _showApiResponse) ...[
                        const SizedBox(height: 24),
                        Container(
                          margin: const EdgeInsets.symmetric(horizontal: 16),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey[300]!),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Text(
                                    'API Debug Info',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const Spacer(),
                                  Text(
                                    'Status: ${_apiStatusCode ?? "NOT CALLED"}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: _apiStatusCode == 200 ? Colors.green : (_apiStatusCode == null ? Colors.orange : Colors.red),
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Container(
                                constraints: const BoxConstraints(maxHeight: 200),
                                child: SingleChildScrollView(
                                  child: SelectableText(
                                    _apiResponse ?? 'API was not called. No order ID provided.',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.arrow_back),
                        label: const Text('Go Back'),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }

          final isStore = user?.role == 'store';
          final entity = isStore ? _order!.supplier : _order!.store;
          final entityName = isStore ? 'Supplier' : 'Store';

          return Scaffold(
            appBar: AppBar(
              title: Text('Order #${_order!.id}'),
            ),
            body: SafeArea(
              child: SingleChildScrollView(
                controller: _scrollController,
                child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (kDebugMode && _showApiResponse && _apiResponse != null)
                    Container(
                      margin: const EdgeInsets.all(16),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.blue[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue[300]!),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Text(
                                'API Response',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                'Status: ${_apiStatusCode ?? "N/A"}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: _apiStatusCode == 200 ? Colors.green : Colors.red,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Container(
                            constraints: const BoxConstraints(maxHeight: 300),
                            child: SingleChildScrollView(
                              child: SelectableText(
                                _apiResponse!,
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontFamily: 'monospace',
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (_order!.store != null && _order!.supplier != null)
                    _buildMapCard(),
                  _buildOrderCard(entity, entityName, user),
                  _buildItemsCard(),
                  if (_order!.store != null && _order!.supplier != null)
                    _buildChatCard(user, entity, entityName),
                  if (_hasActionButtons(user))
                    _buildActionsCard(entity, entityName, user),
                  if (_order!.ratings != null && _order!.ratings!.isNotEmpty) _buildRatingsCard(),
                  if (_canRate()) _buildRateButton(entity, user),
                  const SizedBox(height: 32),
                ],
              ),
            ),
            ),
      bottomSheet: _showRatingDialog ? _buildRatingDialogSheet(user) : null,
    );
        } catch (e) {
          return Scaffold(
            appBar: AppBar(title: const Text('Order Details')),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 64, color: Colors.red),
                    const SizedBox(height: 16),
                    const Text(
                      'An error occurred',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      e.toString(),
                      style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back),
                      label: const Text('Go Back'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }
      },
    );
  }

  Widget _buildRatingDialogSheet(user) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Rate Order',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () {
                  setState(() {
                    _showRatingDialog = false;
                    _ratingValue = 5;
                    _ratingCommentController.clear();
                  });
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Rating:'),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (index) {
              return IconButton(
                icon: Icon(
                  index < _ratingValue ? Icons.star : Icons.star_border,
                  color: Colors.amber,
                  size: 40,
                ),
                onPressed: () {
                  setState(() {
                    _ratingValue = index + 1;
                  });
                },
              );
            }),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _ratingCommentController,
            decoration: const InputDecoration(
              labelText: 'Comment (optional)',
              border: OutlineInputBorder(),
            ),
            maxLines: 3,
            maxLength: 500,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _submittingRating ? null : _handleSubmitRating,
            child: _submittingRating
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Submit Rating'),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(User? entity, String entityName, user) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      if (entity?.logoUrl != null && entity!.logoUrl!.isNotEmpty)
                        ClipOval(
                          child: Image.network(
                            entity.logoUrl!,
                            width: 50,
                            height: 50,
                            fit: BoxFit.cover,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return Container(
                                width: 50,
                                height: 50,
                                color: Colors.grey[200],
                                child: const Center(
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                              );
                            },
                            errorBuilder: (context, error, stackTrace) {
                              return CircleAvatar(
                                radius: 25,
                                backgroundColor: Colors.blue,
                                child: Text(
                                  entity.name.isNotEmpty == true ? entity.name[0].toUpperCase() : '?',
                                  style: const TextStyle(color: Colors.white),
                                ),
                              );
                            },
                          ),
                        )
                      else
                        CircleAvatar(
                          radius: 25,
                          backgroundColor: Colors.blue,
                          child: Text(
                            entity?.name.isNotEmpty == true ? entity!.name[0].toUpperCase() : '?',
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              entity?.name ?? 'Unknown',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              entityName,
                              style: const TextStyle(fontSize: 14, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Chip(
                  label: Text(_getStatusLabel(_order!.status)),
                  backgroundColor: _getStatusColor(_order!.status).withValues(alpha: 0.2),
                  labelStyle: TextStyle(
                    color: _getStatusColor(_order!.status),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const Divider(),
            _buildDetailRow('Total Amount', '₱${NumberFormat('#,##0.00').format(_order!.totalAmount)}', isBold: true, isBlue: true),
            _buildDetailRow('Items', '${_order!.orderItems.length} item(s)'),
            _buildDetailRow('Date Created', _formatDateTime(_order!.createdAt)),
            if (_order!.updatedAt != _order!.createdAt)
              _buildDetailRow('Last Updated', _formatDateTime(_order!.updatedAt)),
            if (_order!.paymentMethod != null) ...[
              _buildDetailRow('Payment Method', _formatPaymentMethod(_order!.paymentMethod!)),
            ],
            if (_order!.deliveryOption != null) ...[
              _buildDetailRow('Delivery Option', _formatDeliveryOption(_order!.deliveryOption!)),
            ],
            if (_order!.shippingAddress != null && _order!.shippingAddress!.isNotEmpty) ...[
              const Divider(),
              const Text(
                'Shipping Address:',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Text(_order!.shippingAddress!),
            ],
            if (_order!.notes != null && _order!.notes!.isNotEmpty) ...[
              const Divider(),
              const Text(
                'Notes:',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Text(_order!.notes!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isBold = false, bool isBlue = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: isBold ? 16 : 14,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: isBlue ? Colors.blue : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMapCard() {
    return Card(
      margin: EdgeInsets.zero,
      clipBehavior: Clip.antiAlias,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      child: OrderMap(
        store: _order!.store,
        supplier: _order!.supplier,
        status: _order!.status,
        height: 300,
      ),
    );
  }

  Widget _buildItemsCard() {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const Text(
                  'Order Items',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                if (_order!.status == 'delivered')
                  OutlinedButton.icon(
                    onPressed: _handleDownloadInvoice,
                    icon: const Icon(Icons.download, size: 16),
                    label: const Text(
                      'Download Invoice',
                      style: TextStyle(fontSize: 12),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      minimumSize: const Size(0, 32),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            ..._order!.orderItems.map((item) => Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        if (item.product.imageUrl != null && item.product.imageUrl!.isNotEmpty)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              item.product.imageUrl!,
                              width: 60,
                              height: 60,
                              fit: BoxFit.cover,
                              loadingBuilder: (context, child, loadingProgress) {
                                if (loadingProgress == null) return child;
                                return Container(
                                  width: 60,
                                  height: 60,
                                  color: Colors.grey[200],
                                  child: Center(
                                    child: CircularProgressIndicator(
                                      value: loadingProgress.expectedTotalBytes != null
                                          ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                          : null,
                                      strokeWidth: 2,
                                    ),
                                  ),
                                );
                              },
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  width: 60,
                                  height: 60,
                                  color: Colors.grey[300],
                                  child: const Icon(Icons.image_not_supported, size: 24),
                                );
                              },
                            ),
                          )
                        else
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              color: Colors.grey[300],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.image_not_supported, size: 30),
                          ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.product.name,
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'SKU: ${item.product.sku}',
                                style: const TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                              Text(
                                'Quantity: ${item.quantity} ${item.product.unit ?? 'units'}',
                                style: const TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                              Text(
                                'Unit Price: ₱${NumberFormat('#,##0.00').format(item.unitPrice)}',
                                style: const TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                              const Divider(),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Subtotal:',
                                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                                  ),
                                  Text(
                                    '₱${NumberFormat('#,##0.00').format(item.subtotal)}',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.blue,
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
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildRatingsCard() {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Ratings',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            ..._order!.ratings!.asMap().entries.map((entry) {
                  final index = entry.key;
                  final rating = entry.value;
                  final isLast = index == _order!.ratings!.length - 1;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              rating.rater?.name ?? 'Unknown',
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            Row(
                              children: [
                                ...List.generate(5, (index) {
                                  return Icon(
                                    index < rating.rating ? Icons.star : Icons.star_border,
                                    color: Colors.amber,
                                    size: 16,
                                  );
                                }),
                                const SizedBox(width: 4),
                                Text('${rating.rating}/5'),
                              ],
                            ),
                          ],
                        ),
                        if (rating.comment != null && rating.comment!.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            '"${rating.comment}"',
                            style: const TextStyle(fontStyle: FontStyle.italic),
                          ),
                        ],
                        const SizedBox(height: 4),
                        Text(
                          _formatDate(rating.createdAt),
                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                        if (!isLast) const Divider(),
                      ],
                    ),
                  );
                }),
          ],
        ),
      ),
    );
  }

  Widget _buildRateButton(User? entity, user) {
    if (_hasRated()) {
      return const SizedBox.shrink();
    }
    
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: ElevatedButton.icon(
          onPressed: () {
            setState(() {
              _showRatingDialog = true;
            });
          },
          icon: const Icon(Icons.star),
          label: Text('Rate ${user?.role == 'store' ? _order!.supplier?.name : _order!.store?.name}'),
        ),
      ),
    );
  }

  Widget _buildChatCard(user, User? entity, String entityName) {
    final messagingClosed = _isMessagingClosed();

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.chat_bubble_outline, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Chat',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: _loadingMessages ? null : _loadMessages,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              height: 300,
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: _loadingMessages && _messages.isEmpty
                    ? const Center(child: CircularProgressIndicator())
                        : _messages.isEmpty
                        ? const Center(child: Text('No messages yet'))
                        : ListView.builder(
                                controller: _messagesScrollController,
                                padding: const EdgeInsets.all(8),
                                itemCount: _messages.length,
                                itemBuilder: (context, index) {
                                  final message = _messages[index];
                                  final isCurrentUser = message.senderId == (user?.id ?? 0);
                                  
                                  return Align(
                                    alignment: isCurrentUser ? Alignment.centerRight : Alignment.centerLeft,
                                    child: Container(
                                      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: isCurrentUser ? Colors.blue : Colors.grey[300],
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      constraints: BoxConstraints(
                                        maxWidth: MediaQuery.of(context).size.width * 0.7,
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          if (!isCurrentUser)
                                            Text(
                                              message.sender.name,
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.grey[700],
                                              ),
                                            ),
                                          if (message.imageUrl != null && message.imageUrl!.isNotEmpty)
                                            ClipRRect(
                                              borderRadius: BorderRadius.circular(8),
                                              child: Image.network(
                                                message.imageUrl!,
                                                fit: BoxFit.cover,
                                                width: 200,
                                                height: 200,
                                                errorBuilder: (context, error, stackTrace) {
                                                  return const Icon(Icons.broken_image);
                                                },
                                              ),
                                            )
                                          else if (message.content.isNotEmpty)
                                            Text(
                                              message.content,
                                              style: TextStyle(
                                                color: isCurrentUser ? Colors.white : Colors.black87,
                                              ),
                                            ),
                                          const SizedBox(height: 4),
                                          Text(
                                            DateFormat('HH:mm').format(message.createdAt),
                                            style: TextStyle(
                                              fontSize: 10,
                                              color: isCurrentUser ? Colors.white70 : Colors.grey[600],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
              ),
            ),
            if (!messagingClosed) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.attach_file),
                    onPressed: _handleAttachmentPressed,
                    color: Colors.blue,
                  ),
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      decoration: const InputDecoration(
                        hintText: 'Type a message...',
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      maxLines: null,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (text) {
                        if (text.trim().isNotEmpty) {
                          _handleSendTextMessage(text.trim());
                        }
                      },
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.send),
                    onPressed: _messageController.text.trim().isEmpty || _loadingMessages
                        ? null
                        : () {
                            _handleSendTextMessage(_messageController.text.trim());
                          },
                    color: Colors.blue,
                  ),
                ],
              ),
            ],
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: () => _handleCall(entity),
              icon: const Icon(Icons.phone),
              label: Text('Call $entityName'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                minimumSize: const Size(double.infinity, 48),
              ),
            ),
            if (messagingClosed)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  'Messaging closed. Order was delivered more than 12 hours ago.',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ),
          ],
        ),
      ),
    );
  }

  bool _hasActionButtons(user) {
    if (_canCancelOrder(user)) return true;
    if (user?.role != 'supplier') return false;
    final status = _order!.status;
    final paymentStatus = _order!.paymentStatus;
    final paymentMethod = _order!.paymentMethod;
    final canManageCodPayment = status == 'delivered' && paymentStatus == 'paid' && paymentMethod == 'cash_on_delivery';
    return status == 'preparing' ||
        status == 'in_transit' ||
        (status == 'delivered' && paymentStatus != 'paid') ||
        canManageCodPayment;
  }

  Widget _buildActionsCard(User? entity, String entityName, user) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          children: [
            if (user?.role == 'store' && _order != null && (_order!.status == 'draft' || _order!.status == 'preparing'))
              OutlinedButton(
                onPressed: _updatingStatus ? null : _handleCancelOrder,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
                child: _updatingStatus
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Cancel Order'),
              ),
            if (user?.role == 'store' && _order != null && (_order!.status == 'draft' || _order!.status == 'preparing'))
              const SizedBox(height: 8),
            if (user?.role == 'supplier' && _order!.status == 'preparing')
              OutlinedButton(
                onPressed: _updatingStatus ? null : () => _handleUpdateStatus('in_transit'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
                child: _updatingStatus
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Mark In Transit'),
              ),
            if (user?.role == 'supplier' && _order!.status == 'in_transit') ...[
              if (user?.role == 'supplier' && _order!.status == 'preparing')
                const SizedBox(height: 8),
              OutlinedButton(
                onPressed: _updatingStatus ? null : _handleMarkDelivered,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
                child: _updatingStatus
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Mark Delivered'),
              ),
            ],
          if (user?.role == 'supplier' &&
              _order!.paymentStatus != 'paid' &&
              (_order!.status == 'preparing' || _order!.status == 'in_transit' || _order!.status == 'delivered')) ...[
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: _updatingPayment ? null : _handleMarkPaymentAsPaid,
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 48),
              ),
              child: _updatingPayment
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Mark as Paid'),
            ),
          ],
          if (user?.role == 'supplier' &&
              _order!.paymentStatus == 'paid' &&
              _order!.status != 'cancelled') ...[
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: _updatingPayment ? null : _handleMarkPaymentAsPending,
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 48),
              ),
              child: _updatingPayment
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Revert Payment'),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDateTime(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatPaymentMethod(String paymentMethod) {
    switch (paymentMethod) {
      case 'cash_on_delivery':
        return 'Cash on Delivery';
      case 'gcash':
        return 'GCash';
      default:
        return paymentMethod;
    }
  }

  String _formatDeliveryOption(String deliveryOption) {
    switch (deliveryOption) {
      case 'pickup':
        return 'Pickup';
      case 'deliver':
        return 'Deliver';
      default:
        return deliveryOption;
    }
  }
}
