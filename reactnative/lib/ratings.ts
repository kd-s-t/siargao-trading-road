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
  order?: {
    id: number;
    store_id: number;
    supplier_id: number;
    store?: {
      id: number;
      name: string;
      email: string;
    };
    supplier?: {
      id: number;
      name: string;
      email: string;
    };
    status: string;
    total_amount: number;
    created_at: string;
  };
}

export const ratingService = {
  getMyRatings: async (): Promise<OrderRating[]> => {
    const { data } = await api.get<{ ratings: OrderRating[] }>('/me/ratings');
    return data.ratings;
  },

  createRating: async (orderId: number, ratedId: number, rating: number, comment?: string): Promise<OrderRating> => {
    const { data } = await api.post<OrderRating>(`/orders/${orderId}/rating`, {
      rated_id: ratedId,
      rating,
      comment,
    });
    return data;
  },
};

