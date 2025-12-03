import { StatusColor } from './types';

export const STATUS_COLORS: Record<string, StatusColor> = {
  delivered: 'success',
  in_transit: 'info',
  preparing: 'warning',
  cancelled: 'error',
};

export function getStatusColor(status: string): StatusColor {
  return STATUS_COLORS[status] || 'default';
}

