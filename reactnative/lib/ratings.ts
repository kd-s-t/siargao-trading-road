import api from './api';

export interface RatingUser {
  id: number;
  name: string;
  email: string;
}

export interface OrderRating {
  id: number;
  order_id: number;
  rater_id: number;
  rater?: RatingUser;
  rated_id: number;
  rated?: RatingUser;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface UserAnalytics {
  total_orders: number;
  total_earnings: number;
  total_products_bought: number;
  orders: any[];
  products_bought: any[];
  recent_orders: any[];
  average_rating?: number;
  rating_count: number;
}

export const ratingService = {
  getMyRatings: async (): Promise<OrderRating[]> => {
    const { data } = await api.get<OrderRating[]>('/me/ratings');
    return data;
  },

  createRating: async (orderId: number, ratedId: number, rating: number, comment?: string): Promise<OrderRating> => {
    const { data } = await api.post<OrderRating>(`/orders/${orderId}/rating`, {
      rated_id: ratedId,
      rating,
      comment,
    });
    return data;
  },

  getMyAnalytics: async (): Promise<UserAnalytics> => {
    const { data } = await api.get<UserAnalytics>('/me/analytics');
    return data;
  },
};

