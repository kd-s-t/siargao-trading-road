'use client';

import { useState } from 'react';
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
} from '@mui/icons-material';
import { Order } from '@/lib/users';
import { User } from '@/lib/auth';
import { Message } from '../../services/mobileApi';
import { OrderMap } from '@/components/OrderMap';
import { downloadInvoice } from '../../utils/invoice';

interface OrderDetailViewProps {
  order: Order;
  mobileUser: User | null;
  messages: Message[];
  refreshingMessages: boolean;
  onRefreshMessages: () => void;
  onSendMessage: (content: string) => Promise<void>;
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
  const [orderItemsExpanded, setOrderItemsExpanded] = useState(false);

  const handleDownloadInvoice = async () => {
    await downloadInvoice(
      order,
      (msg) => onToast(msg, 'success'),
      (msg) => onToast(msg, 'error')
    );
  };

  const handleSend = async () => {
    if (!chatMessage.trim()) return;
    const isDelivered = order.status === 'delivered';
    const deliveredTime = order.updated_at ? new Date(order.updated_at) : null;
    const now = new Date();
    const hoursSinceDelivery = deliveredTime ? (now.getTime() - deliveredTime.getTime()) / (1000 * 60 * 60) : 0;
    const messagingClosed = isDelivered && hoursSinceDelivery >= 12;

    if (messagingClosed) return;

    try {
      await onSendMessage(chatMessage.trim());
      setChatMessage('');
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

  return (
    <Box>
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
                      <Typography variant="body2" sx={{ color: isCurrentUser ? 'white' : 'inherit' }}>
                        {message.content}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: isCurrentUser ? 0.8 : 0.6 }}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  );
                })
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={messagingClosed ? "Messaging closed" : "Type a message..."}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && chatMessage.trim() && !messagingClosed) {
                    handleSend();
                  }
                }}
                disabled={messagingClosed}
                sx={{
                  '& .MuiOutlinedInput-root': { bgcolor: 'white' },
                }}
              />
              <IconButton
                color="primary"
                disabled={messagingClosed || !chatMessage.trim()}
                onClick={handleSend}
                sx={{
                  bgcolor: '#1976d2',
                  color: 'white',
                  '&:hover': { bgcolor: '#1565c0' },
                  '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#9e9e9e' },
                }}
              >
                <SendIcon />
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
    </Box>
  );
}

