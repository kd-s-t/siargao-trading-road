import { RoleColor } from './types';

export const ROLE_COLORS: Record<string, RoleColor> = {
  admin: 'error',
  supplier: 'primary',
  store: 'success',
};

export function getRoleColor(role: string): RoleColor {
  return ROLE_COLORS[role] || 'default';
}

export const MIN_PASSWORD_LENGTH = 6;

