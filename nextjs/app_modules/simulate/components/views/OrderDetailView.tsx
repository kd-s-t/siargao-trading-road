'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  TextField,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  ChatBubbleOutline as ChatIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  Image as ImageIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Order, OrderRating } from '@/lib/users';
import { User } from '@/lib/auth';
import { Message, mobileOrderService, mobileAuthService } from '../../services/mobileApi';
import { OrderMap } from '@/components/OrderMap';
import { downloadInvoice } from '../../utils/invoice';
import { Rating, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

interface OrderDetailViewProps {
  order: Order;
  mobileUser: User | null;
  messages: Message[];
  refreshingMessages: boolean;
  onRefreshMessages: () => void;
  onSendMessage: (content: string, imageUrl?: string) => Promise<void>;
  onUpdateStatus: (orderId: number, status: string) => Promise<void>;
  onMarkDeliveredClick: (orderId: number) => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function OrderDetailView({
  order,
  mobileUser,
  messages,
  refreshingMessages,
  onRefreshMessages,
  onSendMessage,
  onUpdateStatus,
  onMarkDeliveredClick,
  onToast,
}: OrderDetailViewProps) {
  const [chatMessage, setChatMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [orderItemsExpanded, setOrderItemsExpanded] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState<number | null>(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [orderRatings, setOrderRatings] = useState<OrderRating[]>(order.ratings || []);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Fetch fresh order details to get latest ratings when component mounts
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const freshOrder = await mobileOrderService.getOrder(order.id);
        if (freshOrder.ratings) {
          setOrderRatings(freshOrder.ratings);
        }
      } catch (error) {
        console.error('Failed to fetch order details:', error);
      }
    };
    fetchOrderDetails();
  }, [order.id]);

  // Update ratings when order changes
  useEffect(() => {
    setOrderRatings(order.ratings || []);
  }, [order.ratings]);

  // Close dialog if user has already rated
  useEffect(() => {
    const userRating = orderRatings.find(r => r.rater_id === mobileUser?.id);
    if (userRating && ratingDialogOpen) {
      setRatingDialogOpen(false);
      onToast('You have already rated this order', 'error');
    }
  }, [orderRatings, mobileUser?.id, ratingDialogOpen, onToast]);

  const handleDownloadInvoice = async () => {
    await downloadInvoice(
      order,
      (msg) => onToast(msg, 'success'),
      (msg) => onToast(msg, 'error')
    );
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onToast('Please select an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onToast('File size must be less than 5MB', 'error');
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    const isDelivered = order.status === 'delivered';
    const deliveredTime = order.updated_at ? new Date(order.updated_at) : null;
    const now = new Date();
    const hoursSinceDelivery = deliveredTime ? (now.getTime() - deliveredTime.getTime()) / (1000 * 60 * 60) : 0;
    const messagingClosed = isDelivered && hoursSinceDelivery >= 12;

    if (messagingClosed) return;

    if (!chatMessage.trim() && !selectedImage) return;

    try {
      let imageUrl: string | undefined;

      if (selectedImage) {
        setUploadingImage(true);
        try {
          const result = await mobileAuthService.uploadImage(selectedImage, 'user');
          imageUrl = result.url;
        } catch (error) {
          const err = error as { response?: { data?: { error?: string } } };
          onToast(err.response?.data?.error || 'Failed to upload image', 'error');
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      await onSendMessage(chatMessage.trim() || '', imageUrl);
      setChatMessage('');
      setSelectedImage(null);
      setImagePreview(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      onToast(err.response?.data?.error || 'Failed to send message', 'error');
    }
  };

  const isDelivered = order.status === 'delivered';
  const deliveredTime = order.updated_at ? new Date(order.updated_at) : null;
  const now = new Date();
  const hoursSinceDelivery = deliveredTime ? (now.getTime() - deliveredTime.getTime()) / (1000 * 60 * 60) : 0;
  const messagingClosed = isDelivered && hoursSinceDelivery >= 12;

  // Check if user has already rated this order
  const userRating = orderRatings.find(r => r.rater_id === mobileUser?.id);

  const handleSubmitRating = async () => {
    if (!ratingValue || !mobileUser) return;

    try {
      setSubmittingRating(true);
      const newRating = await mobileOrderService.createRating(order.id, ratingValue, ratingComment);
      setOrderRatings([...orderRatings, newRating]);
      setRatingDialogOpen(false);
      setRatingValue(5);
      setRatingComment('');
      onToast('Rating submitted successfully!', 'success');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      onToast(err.response?.data?.error || 'Failed to submit rating', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <Box
      sx={{
        '@keyframes spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      }}
    >
      <Box sx={{ mb: 2, overflow: 'hidden', borderRadius: 1, border: '1px solid #e0e0e0' }}>
        <OrderMap
          store={order.store}
          supplier={order.supplier}
          status={order.status}
          height={250}
        />
      </Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Order #{order.id}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
              {mobileUser?.role === 'supplier' ? 'Store' : 'Supplier'}:
            </Typography>
            <Typography variant="body2">
              {mobileUser?.role === 'supplier' ? order.store?.name : order.supplier?.name}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
              Status:
            </Typography>
            <Chip 
              label={order.status} 
              color={
                order.status === 'delivered' ? 'success' :
                order.status === 'cancelled' ? 'error' :
                order.status === 'in_transit' ? 'info' :
                'default'
              }
              size="small"
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
              Total:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1.1rem' }}>
              ₱{order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>

          {order.payment_method && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                Payment Method:
              </Typography>
              <Typography variant="body2">
                {order.payment_method === 'cash_on_delivery' ? 'Cash on Delivery' : 
                 order.payment_method === 'gcash' ? 'GCash' : 
                 order.payment_method}
              </Typography>
            </Box>
          )}

          {order.delivery_option && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                Delivery Method:
              </Typography>
              <Typography variant="body2">
                {order.delivery_option === 'pickup' ? 'Pickup' : 
                 order.delivery_option === 'deliver' ? 'Deliver' : 
                 order.delivery_option}
              </Typography>
            </Box>
          )}

          {order.delivery_fee !== undefined && order.delivery_fee > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                Delivery Fee:
              </Typography>
              <Typography variant="body2">
                ₱{order.delivery_fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          )}

          {order.created_at && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                Date Created:
              </Typography>
              <Typography variant="body2">
                {new Date(order.created_at).toLocaleString()}
              </Typography>
            </Box>
          )}

          {order.updated_at && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7 }}>
                Last Updated:
              </Typography>
              <Typography variant="body2">
                {new Date(order.updated_at).toLocaleString()}
              </Typography>
            </Box>
          )}

          {order.shipping_address && (
            <Box sx={{ mb: 2 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7, mb: 0.5 }}>
                Shipping Address:
              </Typography>
              <Typography variant="body2">
                {order.shipping_address}
              </Typography>
            </Box>
          )}

          {order.notes && (
            <Box sx={{ mb: 2 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7, mb: 0.5 }}>
                Notes:
              </Typography>
              <Typography variant="body2">
                {order.notes}
              </Typography>
            </Box>
          )}

          {order.order_items && order.order_items.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Order Items:
              </Typography>
              {order.order_items.length > 3 ? (
                <>
                  {order.order_items.slice(0, 3).map((item) => (
                    <Card key={item.id} sx={{ mb: 1.5, bgcolor: '#f5f5f5' }}>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                          {item.product.image_url && item.product.image_url.trim() !== '' ? (
                            <Box
                              component="img"
                              src={item.product.image_url}
                              alt={item.product.name}
                              sx={{
                                width: 80,
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: 1,
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 80,
                                height: 80,
                                bgcolor: '#e0e0e0',
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>
                                No Image
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {item.product.name}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ opacity: 0.7 }}>SKU:</Typography>
                          <Typography variant="body2">{item.product.sku || '-'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ opacity: 0.7 }}>Quantity:</Typography>
                          <Typography variant="body2">{item.quantity} {item.product.unit || 'units'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ opacity: 0.7 }}>Unit Price:</Typography>
                          <Typography variant="body2">₱{item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Subtotal:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                            ₱{item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                  <Accordion
                    expanded={orderItemsExpanded}
                    onChange={(e, expanded) => setOrderItemsExpanded(expanded)}
                    sx={{ mb: 1.5, bgcolor: '#f5f5f5', '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 1.5, py: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {orderItemsExpanded 
                          ? `Hide ${order.order_items.length - 3} more items`
                          : `Show ${order.order_items.length - 3} more items`}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      {order.order_items.slice(3).map((item) => (
                        <Card key={item.id} sx={{ mb: 1.5, bgcolor: '#fff', mx: 1.5 }}>
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                              {item.product.image_url && item.product.image_url.trim() !== '' ? (
                                <Box
                                  component="img"
                                  src={item.product.image_url}
                                  alt={item.product.name}
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    flexShrink: 0,
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    bgcolor: '#e0e0e0',
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>
                                    No Image
                                  </Typography>
                                </Box>
                              )}
                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                  {item.product.name}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ opacity: 0.7 }}>SKU:</Typography>
                              <Typography variant="body2">{item.product.sku || '-'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ opacity: 0.7 }}>Quantity:</Typography>
                              <Typography variant="body2">{item.quantity} {item.product.unit || 'units'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ opacity: 0.7 }}>Unit Price:</Typography>
                              <Typography variant="body2">₱{item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>Subtotal:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                                ₱{item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                </>
              ) : (
                order.order_items.map((item) => (
                  <Card key={item.id} sx={{ mb: 1.5, bgcolor: '#f5f5f5' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                        {item.product.image_url && item.product.image_url.trim() !== '' ? (
                          <Box
                            component="img"
                            src={item.product.image_url}
                            alt={item.product.name}
                            sx={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              bgcolor: '#e0e0e0',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>
                              No Image
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {item.product.name}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>SKU:</Typography>
                        <Typography variant="body2">{item.product.sku || '-'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>Quantity:</Typography>
                        <Typography variant="body2">{item.quantity} {item.product.unit || 'units'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>Unit Price:</Typography>
                        <Typography variant="body2">₱{item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Subtotal:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          ₱{item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {order.store && order.supplier && (
        <Card sx={{ mt: 3, mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ChatIcon />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Chat
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={onRefreshMessages}
                disabled={refreshingMessages}
                sx={{
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {refreshingMessages ? (
                  <Box sx={{ width: 16, height: 16, border: '2px solid', borderColor: 'primary.main', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <RefreshIcon fontSize="small" />
                )}
              </IconButton>
            </Box>
            <Box
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                bgcolor: '#fafafa',
                height: 200,
                overflowY: 'auto',
                p: 2,
                mb: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              {messages.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.6, mt: 2 }}>
                  No messages yet
                </Typography>
              ) : (
                messages.map((message) => {
                  const isCurrentUser = message.sender_id === mobileUser?.id;
                  return (
                    <Box
                      key={message.id}
                      sx={{
                        alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        bgcolor: isCurrentUser ? '#4caf50' : '#e3f2fd',
                        color: isCurrentUser ? 'white' : 'inherit',
                        p: 1.5,
                        borderRadius: 2,
                        borderTopLeftRadius: isCurrentUser ? 2 : 0,
                        borderTopRightRadius: isCurrentUser ? 0 : 2,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5, opacity: isCurrentUser ? 0.9 : 0.7 }}>
                        {message.sender.name}
                      </Typography>
                      {message.image_url && message.image_url.trim() !== '' && !failedImages.has(message.id) && (
                        <Box 
                          sx={{ 
                            mb: message.content ? 1 : 0, 
                            borderRadius: 1, 
                            overflow: 'hidden',
                            bgcolor: isCurrentUser ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                            maxWidth: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            '&:hover': {
                              opacity: 0.9,
                            },
                          }}
                        >
                          <img
                            src={message.image_url}
                            alt="Message attachment"
                            onError={() => {
                              setFailedImages(prev => new Set(prev).add(message.id));
                            }}
                            style={{
                              maxWidth: '100%',
                              maxHeight: 250,
                              width: 'auto',
                              height: 'auto',
                              objectFit: 'contain',
                              display: 'block',
                              cursor: 'pointer',
                              borderRadius: '4px',
                            }}
                            onClick={() => window.open(message.image_url, '_blank')}
                            title="Click to view full size"
                          />
                        </Box>
                      )}
                      {message.image_url && message.image_url.trim() !== '' && failedImages.has(message.id) && (
                        <Box 
                          sx={{ 
                            mb: message.content ? 1 : 0, 
                            p: 1,
                            borderRadius: 1,
                            bgcolor: isCurrentUser ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: isCurrentUser ? 'rgba(255,255,255,0.7)' : '#666',
                              display: 'block',
                            }}
                          >
                            Failed to load image
                          </Typography>
                        </Box>
                      )}
                      {message.content && (
                        <Typography variant="body2" sx={{ color: isCurrentUser ? 'white' : 'inherit' }}>
                          {message.content}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: isCurrentUser ? 0.8 : 0.6 }}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  );
                })
              )}
            </Box>
            {imagePreview && (
              <Box sx={{ mb: 1, position: 'relative', display: 'inline-block' }}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid #e0e0e0',
                    maxWidth: 200,
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 150,
                      display: 'block',
                      objectFit: 'contain',
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleRemoveImage}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <input
                type="file"
                accept="image/*"
                ref={imageInputRef}
                onChange={handleImageSelect}
                style={{ display: 'none' }}
                disabled={messagingClosed || uploadingImage}
              />
              <IconButton
                size="small"
                onClick={() => imageInputRef.current?.click()}
                disabled={messagingClosed || uploadingImage}
                sx={{
                  bgcolor: 'white',
                  border: '1px solid #e0e0e0',
                  '&:hover': { bgcolor: '#f5f5f5' },
                  '&.Mui-disabled': { bgcolor: '#f5f5f5' },
                }}
              >
                {uploadingImage ? (
                  <Box sx={{ width: 20, height: 20, border: '2px solid', borderColor: 'primary.main', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <ImageIcon fontSize="small" />
                )}
              </IconButton>
              <TextField
                fullWidth
                size="small"
                placeholder={messagingClosed ? "Messaging closed" : "Type a message..."}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && (chatMessage.trim() || selectedImage) && !messagingClosed && !uploadingImage) {
                    handleSend();
                  }
                }}
                disabled={messagingClosed || uploadingImage}
                sx={{
                  '& .MuiOutlinedInput-root': { bgcolor: 'white' },
                }}
              />
              <IconButton
                color="primary"
                disabled={messagingClosed || (!chatMessage.trim() && !selectedImage) || uploadingImage}
                onClick={handleSend}
                sx={{
                  bgcolor: '#1976d2',
                  color: 'white',
                  '&:hover': { bgcolor: '#1565c0' },
                  '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#9e9e9e' },
                }}
              >
                {uploadingImage ? (
                  <Box sx={{ width: 20, height: 20, border: '2px solid', borderColor: 'white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <SendIcon />
                )}
              </IconButton>
            </Box>
            {messagingClosed && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.6, textAlign: 'center', color: 'error.main' }}>
                Messaging closed. Order was delivered more than 12 hours ago.
              </Typography>
            )}
            
            {mobileUser?.role === 'supplier' && order.store && (
              <>
                <Divider sx={{ my: 2 }} />
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<PhoneIcon />}
                  fullWidth
                  sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#45a049' } }}
                >
                  Call {order.store.name}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {orderRatings && orderRatings.length > 0 && (
        <Card sx={{ mt: 3, mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Ratings
            </Typography>
            {orderRatings.map((rating) => (
              <Box key={rating.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {rating.rater?.name || 'Unknown'} rated {rating.rated?.name || 'Unknown'}
                  </Typography>
                  <Rating
                    value={rating.rating}
                    readOnly
                    size="small"
                    emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                  />
                  <Typography variant="body2" fontWeight="bold">
                    {rating.rating}/5
                  </Typography>
                </Box>
                {rating.comment && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                    &quot;{rating.comment}&quot;
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {new Date(rating.created_at).toLocaleString()}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      <Card sx={{ mt: 3, mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadInvoice}
              fullWidth
            >
              Download Invoice
            </Button>

            {isDelivered && (
              <Button
                variant="contained"
                size="medium"
                startIcon={<StarIcon />}
                onClick={() => {
                  if (userRating) {
                    onToast('You have already rated this order', 'error');
                    return;
                  }
                  setRatingDialogOpen(true);
                }}
                fullWidth
                disabled={!!userRating}
                sx={{ 
                  bgcolor: userRating ? '#9e9e9e' : '#ff9800', 
                  '&:hover': { bgcolor: userRating ? '#9e9e9e' : '#f57c00' },
                  '&.Mui-disabled': { bgcolor: '#9e9e9e', color: '#fff' }
                }}
              >
                {userRating ? 'Already Rated' : `Rate ${mobileUser?.role === 'supplier' ? order.store?.name : order.supplier?.name}`}
              </Button>
            )}
            
            {mobileUser?.role === 'supplier' && order.status === 'preparing' && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="medium"
                  onClick={() => onUpdateStatus(order.id, 'in_transit')}
                >
                  Mark In Transit
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  size="medium"
                  onClick={() => onMarkDeliveredClick(order.id)}
                >
                  Mark Delivered
                </Button>
              </Box>
            )}
            
            {mobileUser?.role === 'supplier' && order.status === 'in_transit' && (
              <Button
                variant="outlined"
                fullWidth
                size="medium"
                onClick={() => onMarkDeliveredClick(order.id)}
              >
                Mark Delivered
              </Button>
            )}

            {mobileUser?.role === 'supplier' && order.status === 'delivered' && (
              <Button
                variant="outlined"
                fullWidth
                size="medium"
                color="warning"
                onClick={() => onUpdateStatus(order.id, 'in_transit')}
              >
                Revert to In Transit
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog 
        open={ratingDialogOpen && !userRating} 
        onClose={() => setRatingDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        container={() => {
          const container = document.getElementById('mobile-content-container');
          return container || document.body;
        }}
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'center',
          },
        }}
      >
        <DialogTitle>
          Rate {mobileUser?.role === 'supplier' ? order.store?.name : order.supplier?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Rating
              </Typography>
              <Rating
                value={ratingValue}
                onChange={(_, newValue) => setRatingValue(newValue)}
                size="large"
                emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Comment (optional)"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Share your experience..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialogOpen(false)} disabled={submittingRating}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitRating}
            variant="contained"
            disabled={!ratingValue || submittingRating}
            sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
          >
            {submittingRating ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

