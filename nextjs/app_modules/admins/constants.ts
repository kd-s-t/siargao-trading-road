import { AdminLevelOption } from './types';

export const ADMIN_LEVELS: AdminLevelOption[] = [
  { value: 2, label: 'Level 2 (Can add store, supplier, and level 3 users)' },
  { value: 3, label: 'Level 3 (Read only)' },
];

export const DEFAULT_ADMIN_LEVEL = 2;

export const MIN_PASSWORD_LENGTH = 6;

