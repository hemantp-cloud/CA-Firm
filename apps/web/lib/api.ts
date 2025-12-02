import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Get API_URL from environment variable or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Create axios instance with baseURL
const api = axios.create({
  baseURL: API_URL,
});

import { getSession } from 'next-auth/react';

// Request interceptor: Get token from localStorage and add Authorization header
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
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

        // If still not found, try to get from NextAuth session
        if (!token) {
          const session = await getSession();
          if (session?.accessToken) {
            token = session.accessToken;
            // Sync back to localStorage for future requests
            localStorage.setItem('token', token);
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
    // On 401 error, log but don't redirect (let Next.js middleware handle it)
    if (error.response?.status === 401) {
      console.error('API returned 401 Unauthorized');
      // Don't clear localStorage or redirect here - causes redirect loops
      // The Next.js middleware should handle auth redirects
    }
    // On other errors, returns Promise.reject(error)
    return Promise.reject(error);
  }
);

// Export api as default
export default api;
