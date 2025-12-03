import { StatusColors } from './types';

export const STATUS_COLORS: StatusColors = {
  delivered: '#4caf50',
  in_transit: '#2196f3',
  preparing: '#ff9800',
  cancelled: '#f44336',
  draft: '#9e9e9e',
};

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

