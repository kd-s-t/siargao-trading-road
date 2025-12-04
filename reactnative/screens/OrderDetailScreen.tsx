import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Image, TextInput, KeyboardAvoidingView, Platform, Linking, Alert, TouchableOpacity } from 'react-native';
import {
  Text,
  Surface,
  Card,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Button,
  ActivityIndicator,
  Snackbar,
  Portal,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Order, orderService, Message } from '../lib/orders';
import { useAuth } from '../contexts/AuthContext';
import OrderMap from '../components/OrderMap';
import api from '../lib/api';
import { ratingService, OrderRating } from '../lib/ratings';
import { Dialog } from 'react-native-paper';

const statusColors: Record<string, string> = {
  preparing: '#ff9800',
  in_transit: '#2196f3',
  delivered: '#4caf50',
  cancelled: '#f44336',
};

const statusLabels: Record<string, string> = {
  preparing: 'Preparing',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const routeOrder = (route.params as any)?.order as Order | undefined;
  const orderId = (route.params as any)?.orderId as number | undefined;
  
  const [order, setOrder] = useState<Order | null>(routeOrder || null);
  const [loading, setLoading] = useState(!routeOrder && !!orderId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (orderId && !order) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const data = await orderService.getOrder(orderId);
      setOrder(data);
    } catch (error: any) {
      console.error('Failed to load order:', error);
      setSnackbar({ visible: true, message: 'Failed to load order', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const hasRated = (order: Order | null) => {
    if (!order || !order.ratings || !user) return false;
    return order.ratings.some((rating) => rating.rater_id === user.id);
  };

  const canRate = (order: Order | null) => {
    return order?.status === 'delivered' && !hasRated(order);
  };

  const handleSubmitRating = async () => {
    if (!order || !user) return;
    const ratedId = user.role === 'store' ? order.supplier_id : order.store_id;
    if (!ratedId) return;

    try {
      setSubmittingRating(true);
      await ratingService.createRating(order.id, ratedId, ratingValue, ratingComment.trim() || undefined);
      setShowRatingDialog(false);
      setRatingValue(5);
      setRatingComment('');
      await loadOrder();
      setSnackbar({ visible: true, message: 'Rating submitted successfully', type: 'success' });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to submit rating';
      setSnackbar({ visible: true, message: errorMessage, type: 'error' });
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Loading order...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text>Order not found</Text>
        <Button onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          Go Back
        </Button>
      </View>
    );
  }

  const isStore = user?.role === 'store';
  const entity = isStore ? order.supplier : order.store;
  const entityName = isStore ? 'Supplier' : 'Store';

  const isDelivered = order.status === 'delivered';
  const deliveredTime = order.updated_at ? new Date(order.updated_at) : null;
  const now = new Date();
  const hoursSinceDelivery = deliveredTime ? (now.getTime() - deliveredTime.getTime()) / (1000 * 60 * 60) : 0;
  const messagingClosed = isDelivered && hoursSinceDelivery >= 12;

  useEffect(() => {
    if (order?.id) {
      loadMessages();
    }
  }, [order?.id]);

  const loadMessages = async () => {
    if (!order?.id) return;
    try {
      setLoadingMessages(true);
      const data = await orderService.getMessages(order.id);
      setMessages(data || []);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!order?.id || !chatMessage.trim() || messagingClosed || sendingMessage) return;

    try {
      setSendingMessage(true);
      await orderService.createMessage(order.id, chatMessage.trim());
      setChatMessage('');
      await loadMessages();
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to send message';
      setSnackbar({ visible: true, message: errorMessage, type: 'error' });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCall = () => {
    if (!entity?.phone) {
      setSnackbar({ visible: true, message: 'Phone number not available', type: 'error' });
      return;
    }

    const phoneNumber = entity.phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      setSnackbar({ visible: true, message: 'Failed to open phone dialer', type: 'error' });
    });
  };

  const handleDownloadInvoice = async () => {
    try {
      const apiUrl = api.defaults.baseURL || 'http://localhost:3020/api';
      const invoiceUrl = `${apiUrl}/orders/${order.id}/invoice`;
      const canOpen = await Linking.canOpenURL(invoiceUrl);
      if (canOpen) {
        await Linking.openURL(invoiceUrl);
        setSnackbar({ visible: true, message: 'Opening invoice...', type: 'success' });
      } else {
        setSnackbar({ visible: true, message: 'Cannot open invoice URL', type: 'error' });
      }
    } catch (error) {
      setSnackbar({ visible: true, message: 'Failed to download invoice', type: 'error' });
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!order?.id) return;
    try {
      setUpdatingStatus(true);
      await orderService.updateOrderStatus(order.id, status);
      setSnackbar({ visible: true, message: 'Order status updated', type: 'success' });
      navigation.goBack();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update status';
      setSnackbar({ visible: true, message: errorMessage, type: 'error' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkDelivered = () => {
    Alert.alert(
      'Mark as Delivered',
      'Are you sure you want to mark this order as delivered?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => handleUpdateStatus('delivered'),
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || '#757575';
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status] || status;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Order #{order.id}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </Surface>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {order.store && order.supplier ? (
          <View style={styles.mapContainer}>
            <OrderMap
              store={{
                id: order.store.id,
                name: order.store.name,
                email: order.store.email,
                phone: order.store.phone,
                latitude: order.store.latitude,
                longitude: order.store.longitude,
                logo_url: order.store.logo_url,
                role: 'store' as const,
                created_at: '',
                updated_at: '',
              }}
              supplier={{
                id: order.supplier.id,
                name: order.supplier.name,
                email: order.supplier.email,
                phone: order.supplier.phone,
                latitude: order.supplier.latitude,
                longitude: order.supplier.longitude,
                logo_url: order.supplier.logo_url,
                role: 'supplier' as const,
                created_at: '',
                updated_at: '',
              }}
              status={order.status}
              height={250}
            />
          </View>
        ) : null}

        <Card style={styles.orderCard}>
          <Card.Content>
            <View style={styles.orderHeader}>
              <View style={styles.storeInfo}>
                {entity?.logo_url && entity.logo_url.trim() !== '' ? (
                  <Avatar.Image
                    size={50}
                    source={{ uri: entity.logo_url }}
                    style={styles.storeLogo}
                  />
                ) : (
                  <Avatar.Text
                    size={50}
                    label={entity?.name?.charAt(0).toUpperCase() || '?'}
                    style={styles.storeLogo}
                  />
                )}
                <View>
                  <Text variant="titleMedium" style={styles.entityName}>
                    {entity?.name || 'Unknown'}
                  </Text>
                  <Text variant="bodySmall" style={styles.entityLabel}>
                    {entityName}
                  </Text>
                </View>
              </View>
              <Chip
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(order.status) + '20' },
                ]}
                textStyle={{ color: getStatusColor(order.status) }}
              >
                {getStatusLabel(order.status)}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.orderInfo}>
              <View style={styles.infoRow}>
                <Text variant="bodySmall" style={styles.label}>
                  Total Amount:
                </Text>
                <Text variant="titleMedium" style={styles.totalAmount}>
                  ₱{order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="bodySmall" style={styles.label}>
                  Items:
                </Text>
                <Text variant="bodySmall">
                  {order.order_items.length} item(s)
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text variant="bodySmall" style={styles.label}>
                  Date Created:
                </Text>
                <Text variant="bodySmall">
                  {new Date(order.created_at).toLocaleString()}
                </Text>
              </View>
              {order.updated_at && (
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.label}>
                    Last Updated:
                  </Text>
                  <Text variant="bodySmall">
                    {new Date(order.updated_at).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>

            {order.shipping_address ? (
              <>
                <Divider style={styles.divider} />
                <View style={styles.addressContainer}>
                  <Text variant="bodySmall" style={styles.label}>
                    Shipping Address:
                  </Text>
                  <Text variant="bodySmall">{order.shipping_address}</Text>
                </View>
              </>
            ) : null}

            {order.notes ? (
              <>
                <Divider style={styles.divider} />
                <View style={styles.notesContainer}>
                  <Text variant="bodySmall" style={styles.label}>
                    Notes:
                  </Text>
                  <Text variant="bodySmall">{order.notes}</Text>
                </View>
              </>
            ) : null}

            <Divider style={styles.divider} />

            <View style={styles.itemsContainer}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Order Items
              </Text>
              {order.order_items.map((item) => (
                <Card key={item.id} style={styles.itemCard}>
                  <Card.Content style={styles.itemCardContent}>
                    <View style={styles.itemRow}>
                      {item.product.image_url && item.product.image_url.trim() !== '' ? (
                        <Image
                          source={{ uri: item.product.image_url }}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.itemImagePlaceholder}>
                          <Text variant="labelSmall" style={styles.itemPlaceholderText}>
                            No Image
                          </Text>
                        </View>
                      )}
                      <View style={styles.itemInfo}>
                        <Text variant="bodyMedium" style={styles.itemName}>
                          {item.product.name}
                        </Text>
                        <View style={styles.itemDetailsRow}>
                          <Text variant="bodySmall" style={styles.itemDetailLabel}>SKU:</Text>
                          <Text variant="bodySmall">{item.product.sku || '-'}</Text>
                        </View>
                        <View style={styles.itemDetailsRow}>
                          <Text variant="bodySmall" style={styles.itemDetailLabel}>Quantity:</Text>
                          <Text variant="bodySmall">{item.quantity} {item.product.unit || 'units'}</Text>
                        </View>
                        <View style={styles.itemDetailsRow}>
                          <Text variant="bodySmall" style={styles.itemDetailLabel}>Unit Price:</Text>
                          <Text variant="bodySmall">₱{item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        </View>
                        <Divider style={styles.itemDivider} />
                        <View style={styles.itemDetailsRow}>
                          <Text variant="bodySmall" style={styles.itemSubtotalLabel}>Subtotal:</Text>
                          <Text variant="bodyMedium" style={styles.itemSubtotal}>
                            ₱{item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          </Card.Content>
        </Card>

        {order.ratings && order.ratings.length > 0 && (
          <Card style={styles.orderCard}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Ratings
              </Text>
              {order.ratings.map((rating: OrderRating) => (
                <View key={rating.id} style={styles.ratingItem}>
                  <View style={styles.ratingHeader}>
                    <Text variant="bodyMedium" style={styles.ratingRater}>
                      {rating.rater?.name || 'Unknown'}
                    </Text>
                    <View style={styles.ratingStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <MaterialCommunityIcons
                          key={star}
                          name={star <= rating.rating ? 'star' : 'star-outline'}
                          size={16}
                          color="#FFD700"
                        />
                      ))}
                      <Text variant="bodySmall" style={styles.ratingValue}>
                        {rating.rating}/5
                      </Text>
                    </View>
                  </View>
                  {rating.comment && (
                    <Text variant="bodySmall" style={styles.ratingComment}>
                      &quot;{rating.comment}&quot;
                    </Text>
                  )}
                  <Text variant="labelSmall" style={styles.ratingDate}>
                    {new Date(rating.created_at).toLocaleDateString()}
                  </Text>
                  <Divider style={styles.ratingDivider} />
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {canRate(order) && (
          <Card style={styles.orderCard}>
            <Card.Content>
              <Button
                mode="contained"
                icon="star"
                onPress={() => setShowRatingDialog(true)}
                style={styles.rateButton}
              >
                Rate {user?.role === 'store' ? order.supplier?.name : order.store?.name}
              </Button>
            </Card.Content>
          </Card>
        )}

        {order.store && order.supplier && (
          <Card style={styles.chatCard}>
            <Card.Content>
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderLeft}>
                  <IconButton icon="chat-outline" size={20} />
                  <Text variant="bodyLarge" style={styles.chatTitle}>
                    Chat
                  </Text>
                </View>
                <IconButton
                  icon="refresh"
                  size={20}
                  onPress={loadMessages}
                  disabled={loadingMessages}
                />
              </View>

              <View style={styles.messagesContainer}>
                {loadingMessages && messages.length === 0 ? (
                  <ActivityIndicator size="small" style={styles.messagesLoading} />
                ) : messages.length === 0 ? (
                  <Text variant="bodySmall" style={styles.noMessages}>
                    No messages yet
                  </Text>
                ) : (
                  messages.map((message) => {
                    const isCurrentUser = message.sender_id === user?.id;
                    return (
                      <View
                        key={message.id}
                        style={[
                          styles.messageBubble,
                          isCurrentUser ? styles.messageBubbleRight : styles.messageBubbleLeft,
                        ]}
                      >
                        <Text variant="labelSmall" style={styles.messageSender}>
                          {message.sender.name}
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={[
                            styles.messageContent,
                            isCurrentUser ? styles.messageContentRight : styles.messageContentLeft,
                          ]}
                        >
                          {message.content}
                        </Text>
                        <Text variant="labelSmall" style={styles.messageTime}>
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>

              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatInput}
                  placeholder={messagingClosed ? 'Messaging closed' : 'Type a message...'}
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  editable={!messagingClosed}
                  multiline
                  maxLength={500}
                />
                <IconButton
                  icon="send"
                  size={24}
                  onPress={handleSendMessage}
                  disabled={messagingClosed || !chatMessage.trim() || sendingMessage}
                  style={styles.sendButton}
                />
              </View>

              {messagingClosed && (
                <Text variant="labelSmall" style={styles.messagingClosed}>
                  Messaging closed. Order was delivered more than 12 hours ago.
                </Text>
              )}

              {user?.role === 'supplier' && order.store && (
                <>
                  <Divider style={styles.divider} />
                  <Button
                    mode="contained"
                    icon="phone"
                    onPress={handleCall}
                    style={styles.callButton}
                    disabled={!order.store.phone}
                  >
                    Call {order.store.name}
                  </Button>
                </>
              )}
            </Card.Content>
          </Card>
        )}

        <Card style={styles.actionsCard}>
          <Card.Content>
            <Button
              mode="outlined"
              icon="download"
              onPress={handleDownloadInvoice}
              style={styles.actionButton}
            >
              Download Invoice
            </Button>

            {user?.role === 'supplier' && order.status === 'preparing' && (
              <View style={styles.statusButtons}>
                <Button
                  mode="outlined"
                  onPress={() => handleUpdateStatus('in_transit')}
                  style={styles.statusButton}
                  disabled={updatingStatus}
                >
                  Mark In Transit
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleMarkDelivered}
                  style={styles.statusButton}
                  disabled={updatingStatus}
                >
                  Mark Delivered
                </Button>
              </View>
            )}

            {user?.role === 'supplier' && order.status === 'in_transit' && (
              <Button
                mode="outlined"
                onPress={handleMarkDelivered}
                style={styles.actionButton}
                disabled={updatingStatus}
              >
                Mark Delivered
              </Button>
            )}

            {user?.role === 'supplier' && order.status === 'delivered' && (
              <Button
                mode="outlined"
                onPress={() => handleUpdateStatus('in_transit')}
                style={styles.actionButton}
                disabled={updatingStatus}
              >
                Revert to In Transit
              </Button>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Dialog visible={showRatingDialog} onDismiss={() => setShowRatingDialog(false)}>
          <Dialog.Title>Rate {user?.role === 'store' ? order.supplier?.name : order.store?.name}</Dialog.Title>
          <Dialog.Content>
            <View style={styles.ratingDialogContent}>
              <Text variant="bodyMedium" style={styles.ratingDialogLabel}>
                Rating:
              </Text>
              <View style={styles.ratingDialogStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRatingValue(star)}
                    style={styles.ratingStarButton}
                  >
                    <MaterialCommunityIcons
                      name={star <= ratingValue ? 'star' : 'star-outline'}
                      size={32}
                      color="#FFD700"
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text variant="bodySmall" style={{ marginBottom: 8 }}>
                Comment (optional):
              </Text>
              <TextInput
                value={ratingComment}
                onChangeText={setRatingComment}
                multiline
                numberOfLines={4}
                style={styles.ratingCommentInput}
                placeholder="Share your experience..."
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRatingDialog(false)}>Cancel</Button>
            <Button
              onPress={handleSubmitRating}
              disabled={submittingRating}
              mode="contained"
            >
              Submit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={snackbar.type === 'error' ? styles.snackbarError : styles.snackbarSuccess}
      >
        {snackbar.message}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    margin: 0,
    marginRight: 8,
  },
  headerSpacer: {
    width: 48,
  },
  headerTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
  },
  mapContainer: {
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  orderCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storeLogo: {
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  entityName: {
    fontWeight: 'bold',
  },
  entityLabel: {
    opacity: 0.7,
    marginTop: 4,
  },
  statusChip: {
    height: 28,
  },
  divider: {
    marginVertical: 12,
  },
  orderInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    opacity: 0.7,
  },
  totalAmount: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  addressContainer: {
    marginTop: 4,
  },
  notesContainer: {
    marginTop: 4,
  },
  itemsContainer: {
    marginTop: 4,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  itemCard: {
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  itemCardContent: {
    padding: 12,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    flexShrink: 0,
  },
  itemImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  itemPlaceholderText: {
    color: '#999',
    fontSize: 9,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  itemDetailLabel: {
    opacity: 0.7,
  },
  itemDivider: {
    marginVertical: 8,
  },
  itemSubtotalLabel: {
    fontWeight: '600',
  },
  itemSubtotal: {
    fontWeight: '600',
    color: '#1976d2',
  },
  chatCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatTitle: {
    fontWeight: '600',
  },
  messagesContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    minHeight: 200,
    maxHeight: 200,
    padding: 12,
    marginBottom: 12,
  },
  messagesLoading: {
    marginTop: 20,
  },
  noMessages: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 20,
  },
  messageBubble: {
    maxWidth: '75%',
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
  },
  messageBubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    borderTopLeftRadius: 0,
  },
  messageBubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#4caf50',
    borderTopRightRadius: 0,
  },
  messageSender: {
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.7,
  },
  messageContent: {
    marginBottom: 4,
  },
  messageContentLeft: {
    color: '#000',
  },
  messageContentRight: {
    color: '#fff',
  },
  messageTime: {
    opacity: 0.6,
    fontSize: 10,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    margin: 0,
  },
  messagingClosed: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 8,
    color: '#f44336',
  },
  callButton: {
    marginTop: 8,
    backgroundColor: '#4caf50',
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  statusButton: {
    flex: 1,
  },
  snackbarSuccess: {
    backgroundColor: '#4caf50',
  },
  snackbarError: {
    backgroundColor: '#f44336',
  },
  ratingItem: {
    marginBottom: 12,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingRater: {
    fontWeight: '600',
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    marginLeft: 4,
    fontWeight: '600',
  },
  ratingComment: {
    marginTop: 4,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  ratingDate: {
    marginTop: 4,
    opacity: 0.6,
  },
  ratingDivider: {
    marginTop: 12,
  },
  rateButton: {
    marginTop: 8,
  },
  ratingDialogContent: {
    gap: 16,
  },
  ratingDialogLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  ratingDialogStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  ratingStarButton: {
    padding: 4,
  },
  ratingCommentInput: {
    marginTop: 8,
  },
});
