import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/InvoicePDF';
import { Order } from '@/lib/users';

export async function loadImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load image:', error);
    return '';
  }
}

export async function downloadInvoice(order: Order, onSuccess: (message: string) => void, onError: (message: string) => void) {
  try {
    const logoBase64 = await loadImageAsBase64('/logo.png');
    const blob = await pdf(<InvoicePDF order={order} logoBase64={logoBase64} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const date = new Date(order.created_at);
    const dateStr = date.toISOString().split('T')[0];
    const storeName = order.store?.name || 'Store';
    const sanitizedStoreName = storeName
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    
    link.download = `invoice-${dateStr}-${sanitizedStoreName}-${order.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onSuccess('Invoice downloaded successfully');
  } catch (error) {
    console.error('Failed to generate invoice:', error);
    onError('Failed to generate invoice');
  }
}

