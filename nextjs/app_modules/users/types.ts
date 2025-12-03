export interface UserFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'supplier' | 'store';
  logo_url?: string;
  banner_url?: string;
}

export type UserRole = 'supplier' | 'store';

export type RoleColor = 'error' | 'primary' | 'success' | 'default';

