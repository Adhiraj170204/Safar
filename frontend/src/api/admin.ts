import apiClient from './client';

export const adminAPI = {
  // Get dashboard stats
  getStats: async () => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  // Get all users
  getUsers: async (params: any = {}) => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  // Update user role
  updateUserRole: async (userId: string, role: string) => {
    const response = await apiClient.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Delete user
  deleteUser: async (userId: string) => {
    const response = await apiClient.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Get all camps (admin view)
  getAllCamps: async (params: any = {}) => {
    const response = await apiClient.get('/admin/camps', { params });
    return response.data;
  },

  // Delete any camp
  deleteCamp: async (campId: string) => {
    const response = await apiClient.delete(`/admin/camps/${campId}`);
    return response.data;
  },

  // Get all reviews
  getAllReviews: async (params: any = {}) => {
    const response = await apiClient.get('/admin/reviews', { params });
    return response.data;
  },

  // Delete any review
  deleteReview: async (reviewId: string) => {
    const response = await apiClient.delete(`/admin/reviews/${reviewId}`);
    return response.data;
  },
};
