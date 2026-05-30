import apiClient from './client';

export const reviewAPI = {
  // Get reviews for a camp
  getReviews: async (campId: string) => {
    const response = await apiClient.get(`/camp/${campId}/review`);
    return response.data;
  },

  // Create review
  createReview: async (campId: string, data: { rating: number; review?: string }) => {
    const response = await apiClient.post(`/camp/${campId}/review`, data);
    return response.data;
  },

  // Update review
  updateReview: async (campId: string, reviewId: string, data: { rating: number; review?: string }) => {
    const response = await apiClient.put(`/camp/${campId}/review/${reviewId}`, data);
    return response.data;
  },

  // Delete review
  deleteReview: async (campId: string, reviewId: string) => {
    const response = await apiClient.delete(`/camp/${campId}/review/${reviewId}`);
    return response.data;
  },
};
