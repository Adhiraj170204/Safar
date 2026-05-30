import apiClient from './client';

export const authAPI = {
  // Signup
  signup: async (data: { name: string; username: string; email: string; password: string }) => {
    const response = await apiClient.post('/user/signup', data);
    return response.data;
  },

  // Login
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post('/user/login', credentials);
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await apiClient.post('/user/logout');
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: any) => {
    const response = await apiClient.put('/user/profile', data);
    return response.data;
  },

  // Request password reset
  requestPasswordReset: async (email: string) => {
    const response = await apiClient.post('/user/request-reset', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post('/user/reset', { token, password });
    return response.data;
  },

  // Resend verification email (Legacy)
  resendVerification: async (email: string) => {
    const response = await apiClient.post('/user/resend-verification', { email });
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (email: string, otp: string) => {
    const response = await apiClient.post('/user/verify-otp', { email, otp });
    return response.data;
  },

  // Resend OTP
  resendOTP: async (email: string) => {
    const response = await apiClient.post('/user/resend-otp', { email });
    return response.data;
  },

  // Change password (requires current password)
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.post('/user/change-password', { currentPassword, newPassword });
    return response.data;
  },

  // Upload profile image
  uploadProfileImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post('/user/profile/image', formData);
    return response.data;
  },

  // Favorites — list the current user's favorite camps
  getFavorites: async () => {
    const response = await apiClient.get('/user/favorites');
    return response.data;
  },

  // Favorites — toggle a camp in/out of favorites; returns { favorited, favorites }
  toggleFavorite: async (campId: string) => {
    const response = await apiClient.post(`/user/favorites/${campId}`);
    return response.data;
  },

  // Public profile by username (no auth required)
  getPublicProfile: async (username: string) => {
    const response = await apiClient.get(`/user/public/${username}`);
    return response.data;
  },
};
