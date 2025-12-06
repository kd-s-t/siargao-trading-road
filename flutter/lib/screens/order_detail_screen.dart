import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:siargao_trading_road/providers/auth_provider.dart';
import 'package:siargao_trading_road/services/order_service.dart';
import 'package:siargao_trading_road/services/rating_service.dart';
import 'package:siargao_trading_road/models/order.dart';
import 'package:siargao_trading_road/models/rating.dart';
import 'package:siargao_trading_road/models/user.dart';
import 'package:siargao_trading_road/widgets/order_map.dart';
import 'package:siargao_trading_road/services/api_service.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';

class OrderDetailScreen extends StatefulWidget {
  const OrderDetailScreen({super.key});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  Order? _order;
  bool _loading = true;
  bool _loadingMessages = false;
  bool _sendingMessage = false;
  bool _updatingStatus = false;
  bool _submittingRating = false;
  List<Message> _messages = [];
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final _messagesScrollController = ScrollController();
  bool _showRatingDialog = false;
  int _ratingValue = 5;
  final _ratingCommentController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadOrder();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _ratingCommentController.dispose();
    _scrollController.dispose();
    _messagesScrollController.dispose();
    super.dispose();
  }

  Future<void> _loadOrder() async {
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final order = args?['order'] as Order?;
    final orderId = args?['orderId'] as int?;

    if (order != null) {
      setState(() {
        _order = order;
        _loading = false;
      });
      _loadMessages();
      return;
    }

    if (orderId != null) {
      setState(() {
        _loading = true;
      });
      try {
        final loadedOrder = await OrderService.getOrder(orderId);
        setState(() {
          _order = loadedOrder;
          _loading = false;
        });
        _loadMessages();
      } catch (e) {
        setState(() {
          _loading = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to load order: $e')),
          );
        }
      }
    } else {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _loadMessages() async {
    if (_order?.id == null) return;

    setState(() {
      _loadingMessages = true;
    });

    try {
      final messages = await OrderService.getMessages(_order!.id);
      setState(() {
        _messages = messages;
        _loadingMessages = false;
      });
      _scrollToBottom();
    } catch (e) {
      setState(() {
        _loadingMessages = false;
      });
    }
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

  Future<void> _handleSendMessage() async {
    if (_order?.id == null || _messageController.text.trim().isEmpty || _sendingMessage) return;

    setState(() {
      _sendingMessage = true;
    });

    try {
      await OrderService.createMessage(_order!.id, _messageController.text.trim());
      _messageController.clear();
      await _loadMessages();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send message: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _sendingMessage = false;
        });
      }
    }
  }

  Future<void> _handleUpdateStatus(String status) async {
    if (_order?.id == null) return;

    setState(() {
      _updatingStatus = true;
    });

    try {
      await OrderService.updateOrderStatus(_order!.id, status);
      await _loadOrder();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order status updated')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update status: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _updatingStatus = false;
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

  Future<void> _handleCall(User? entity) async {
    if (entity?.phone == null || entity!.phone!.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Phone number not available')),
        );
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
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Phone dialer not available')),
        );
      }
    }
  }

  Future<void> _handleDownloadInvoice() async {
    if (_order?.id == null) return;

    try {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Downloading invoice...')),
        );
      }

      final invoiceUrl = '${ApiService.baseUrl}/orders/${_order!.id}/invoice';
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final response = await http.get(
        Uri.parse(invoiceUrl),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final directory = await getApplicationDocumentsDirectory();
        final date = _order!.createdAt.toIso8601String().split('T')[0];
        final entityName = _order!.store?.name ?? _order!.supplier?.name ?? 'Store';
        final sanitizedName = entityName.replaceAll(RegExp(r'[^a-zA-Z0-9\s-]'), '').replaceAll(' ', '-').toLowerCase();
        final fileName = 'invoice-$date-$sanitizedName-${_order!.id}.pdf';
        final file = File('${directory.path}/$fileName');

        await file.writeAsBytes(response.bodyBytes);
        final xFile = XFile(file.path);
        await Share.shareXFiles([xFile]);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Invoice downloaded successfully')),
          );
        }
      } else {
        throw Exception('Failed to download invoice');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to download invoice: $e')),
        );
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
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Rating submitted successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit rating: $e')),
        );
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

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Order Details')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_order == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Order Details')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Order not found'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Go Back'),
              ),
            ],
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
      body: SingleChildScrollView(
        controller: _scrollController,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_order!.store != null && _order!.supplier != null)
              Padding(
                padding: const EdgeInsets.all(16),
                child: OrderMap(
                  store: _order!.store,
                  supplier: _order!.supplier,
                  status: _order!.status,
                  height: 250,
                ),
              ),
            _buildOrderCard(entity, entityName, user),
            _buildItemsCard(),
            if (_order!.ratings != null && _order!.ratings!.isNotEmpty) _buildRatingsCard(),
            if (_canRate()) _buildRateButton(entity, user),
            if (_order!.store != null && _order!.supplier != null) _buildChatCard(user),
            _buildActionsCard(entity, entityName, user),
            const SizedBox(height: 32),
          ],
        ),
      ),
      bottomSheet: _showRatingDialog ? _buildRatingDialogSheet(user) : null,
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
      margin: const EdgeInsets.all(16),
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
                        CircleAvatar(
                          radius: 25,
                          backgroundImage: NetworkImage(entity.logoUrl!),
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
                  backgroundColor: _getStatusColor(_order!.status).withOpacity(0.2),
                  labelStyle: TextStyle(
                    color: _getStatusColor(_order!.status),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const Divider(),
            _buildDetailRow('Total Amount', '₱${_order!.totalAmount.toStringAsFixed(2)}', isBold: true, isBlue: true),
            _buildDetailRow('Items', '${_order!.orderItems.length} item(s)'),
            _buildDetailRow('Date Created', _formatDateTime(_order!.createdAt)),
            if (_order!.updatedAt != _order!.createdAt)
              _buildDetailRow('Last Updated', _formatDateTime(_order!.updatedAt)),
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

  Widget _buildItemsCard() {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Order Items',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
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
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  width: 60,
                                  height: 60,
                                  color: Colors.grey[300],
                                  child: const Icon(Icons.image_not_supported),
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
                                'Unit Price: ₱${item.unitPrice.toStringAsFixed(2)}',
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
                                    '₱${item.subtotal.toStringAsFixed(2)}',
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
            ..._order!.ratings!.map((rating) => Padding(
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
                      const Divider(),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildRateButton(User? entity, user) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: ElevatedButton.icon(
          onPressed: _hasRated()
              ? null
              : () {
                  setState(() {
                    _showRatingDialog = true;
                  });
                },
          icon: const Icon(Icons.star),
          label: Text(_hasRated()
              ? 'Already Rated'
              : 'Rate ${user?.role == 'store' ? _order!.supplier?.name : _order!.store?.name}'),
        ),
      ),
    );
  }

  Widget _buildChatCard(user) {
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
            const Divider(),
            Container(
              height: 200,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(8),
              ),
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
                            final isCurrentUser = message.senderId == user?.id;
                            return Align(
                              alignment: isCurrentUser ? Alignment.centerRight : Alignment.centerLeft,
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: isCurrentUser ? Colors.blue[100] : Colors.grey[200],
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (!isCurrentUser)
                                      Text(
                                        message.sender.name,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    Text(message.content),
                                    Text(
                                      _formatTime(message.createdAt),
                                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: messagingClosed ? 'Messaging closed' : 'Type a message...',
                      border: const OutlineInputBorder(),
                      enabled: !messagingClosed,
                    ),
                    maxLines: null,
                    maxLength: 500,
                  ),
                ),
                IconButton(
                  icon: _sendingMessage
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.send),
                  onPressed: messagingClosed || _messageController.text.trim().isEmpty || _sendingMessage
                      ? null
                      : _handleSendMessage,
                ),
              ],
            ),
            if (messagingClosed)
              const Text(
                'Messaging closed. Order was delivered more than 12 hours ago.',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionsCard(User? entity, String entityName, user) {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            ElevatedButton.icon(
              onPressed: () => _handleCall(entity),
              icon: const Icon(Icons.phone),
              label: Text('Call $entityName'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                minimumSize: const Size(double.infinity, 48),
              ),
            ),
            if (_order!.status == 'delivered') ...[
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _handleDownloadInvoice,
                icon: const Icon(Icons.download),
                label: const Text('Download Invoice'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
              ),
            ],
            if (user?.role == 'supplier' && _order!.status == 'preparing') ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _updatingStatus ? null : () => _handleUpdateStatus('in_transit'),
                      child: _updatingStatus
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Mark In Transit'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _updatingStatus ? null : _handleMarkDelivered,
                      child: const Text('Mark Delivered'),
                    ),
                  ),
                ],
              ),
            ],
            if (user?.role == 'supplier' && _order!.status == 'in_transit') ...[
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
          ],
        ),
      ),
    );
  }

  String _formatDateTime(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatTime(DateTime date) {
    return '${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}
