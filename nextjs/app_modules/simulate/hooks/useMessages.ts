import { useState, useEffect } from 'react';
import { mobileOrderService, Message } from '../services/mobileApi';

export function useMessages(orderId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMessages = async (id: number) => {
    try {
      setLoading(true);
      const fetchedMessages = await mobileOrderService.getMessages(id);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      loadMessages(orderId);
    } else {
      setMessages([]);
    }
  }, [orderId]);

  const sendMessage = async (content: string, imageUrl?: string) => {
    if (!orderId) return;
    try {
      await mobileOrderService.createMessage(orderId, content, imageUrl);
      await loadMessages(orderId);
    } catch (error) {
      throw error;
    }
  };

  return { messages, loading, loadMessages, sendMessage };
}

