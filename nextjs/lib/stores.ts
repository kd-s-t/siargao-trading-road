import api from './api';

export interface Store {
  id: number;
  name: string;
  email: string;
  phone: string;
  description: string;
  logo_url?: string;
  banner_url?: string;
  average_rating?: number;
  rating_count: number;
}

export const storesService = {
  getStores: async (): Promise<Store[]> => {
    const { data } = await api.get<Store[]>('/stores');
    return data;
  },
};

