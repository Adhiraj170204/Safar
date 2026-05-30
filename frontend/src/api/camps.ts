import apiClient from './client';

export const campAPI = {
  // Get all camps with filters
  getCamps: async (params: any = {}) => {
    const response = await apiClient.get('/camp/index', { params });
    return response.data;
  },

  // Get single camp
  getCamp: async (id: string) => {
    const response = await apiClient.get(`/camp/${id}`);
    return response.data;
  },

  // Create camp (with images)
  createCamp: async (formData: FormData) => {
    const response = await apiClient.post('/camp/new', formData);
    return response.data;
  },

  // Update camp
  updateCamp: async (id: string, formData: FormData) => {
    const response = await apiClient.put(`/camp/${id}`, formData);
    return response.data;
  },

  // Delete camp
  deleteCamp: async (id: string) => {
    const response = await apiClient.delete(`/camp/${id}`);
    return response.data;
  },

  // Search camps
  searchCamps: async (searchParams: any) => {
    const response = await apiClient.get('/camp/index', {
      params: searchParams,
    });
    return response.data;
  },
};
