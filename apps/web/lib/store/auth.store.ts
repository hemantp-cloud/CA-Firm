import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api';

// Define User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  firmId: string;
}

// Define AuthState interface
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Define AuthActions interface
interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

// Combined interface for the store
type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // login action: POST to http://localhost:4000/api/auth/login
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', {
            email,
            password,
          });

          if (response.data.success) {
            const { user, token } = response.data.data;
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
            throw new Error(response.data.message || 'Login failed');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(
            error.response?.data?.message || error.message || 'Login failed'
          );
        }
      },

      // logout action: clear state, remove from localStorage
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        // Persist middleware will handle localStorage cleanup
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      // checkAuth action: if token exists, call /api/auth/me to validate
      checkAuth: async () => {
        const state = useAuthStore.getState();
        
        if (!state.token) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await api.get('/auth/me');

          if (response.data.success) {
            set({
              user: response.data.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error: any) {
          // If auth fails, clear state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        // Persist only token to localStorage
        token: state.token,
      }),
    }
  )
);
