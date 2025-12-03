export interface AdminFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  admin_level: number;
}

export type AdminLevel = 1 | 2 | 3;

export interface AdminLevelOption {
  value: number;
  label: string;
}

