import { StatusColor } from './types';

export function getStatusColor(status: string): StatusColor {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'success';
    case 'in_transit':
      return 'info';
    case 'preparing':
      return 'warning';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
}

