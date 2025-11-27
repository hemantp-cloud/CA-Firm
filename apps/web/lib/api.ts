import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Get API_URL from environment variable or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Create axios instance with baseURL
const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor: Get token from localStorage and add Authorization header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    if (typeof window !== 'undefined') {
      try {
        // First try to get token directly from localStorage
        let token = localStorage.getItem('token');
        
        // If not found, try to get from auth-storage (Zustand store)
        if (!token) {
          const stored = localStorage.getItem('auth-storage');
          if (stored) {
            const parsed = JSON.parse(stored);
            token = parsed?.state?.token;
          }
        }
        
        // If token exists, adds Authorization: Bearer {token} header
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        // Silently fail if parsing fails
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle responses and errors
api.interceptors.response.use(
  // On success, returns response
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // On 401 error, clears localStorage and redirects to /login (if window exists)
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    // On other errors, returns Promise.reject(error)
    return Promise.reject(error);
  }
);

// Export api as default
export default api;
