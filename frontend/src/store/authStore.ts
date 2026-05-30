import { create } from 'zustand';
import { authAPI } from '../api/auth';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  profileImage?: {
    url: string;
    public_id?: string;
  };
  verified: boolean;
  createdCamps?: string[];
  favorites?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  initAuth: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
  updateUser: (userData: User & { _id?: string }) => void;
  setFavorites: (favorites: string[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Initialize auth state
  initAuth: async () => {
    try {
      const userData = await authAPI.getProfile();
      // Normalize user data - ensure 'id' field exists
      const user = {
        ...userData,
        id: userData.id || userData._id
      };
      set({ user, isAuthenticated: true, isLoading: false });
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      // Try to get user from localStorage as fallback
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Normalize user data
          const user = {
            ...userData,
            id: userData.id || userData._id
          };
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
          localStorage.removeItem('user');
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  },

  // Login
  login: async (credentials) => {
    const data = await authAPI.login(credentials);
    set({ user: data.user, isAuthenticated: true });
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  // Logout
  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({ user: null, isAuthenticated: false });
      localStorage.removeItem('user');
    }
  },

  // Update user
  updateUser: (userData: User & { _id?: string }) => {
    const id = userData.id ?? userData._id;
    if (!id) return;
    const user: User = { ...userData, id };
    set({ user, isAuthenticated: true });
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Update only the favorites list (after a toggle), keeping the rest of the user intact
  setFavorites: (favorites) => {
    set((state) => {
      if (!state.user) return state;
      const user = { ...state.user, favorites };
      localStorage.setItem('user', JSON.stringify(user));
      return { user };
    });
  },

  // Set loading
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));
