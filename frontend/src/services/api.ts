import axios, { AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { ApiError } from '../types';

// CORRECTED: Restore /api in base URL since backend uses setGlobalPrefix('api')
// All endpoints need /api/ prefix: auth/login → /api/auth/login
const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and handle FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // DEBUG: Log authorization header for video-progress requests
      if (config.url?.includes('video-progress')) {
        console.log('🔐 Adding auth header for video-progress:', {
          url: config.url,
          hasToken: !!token,
          tokenLength: token.length,
          authHeader: `Bearer ${token.substring(0, 20)}...`
        });
      }
    } else {
      // DEBUG: Log when no token found
      if (config.url?.includes('video-progress')) {
        console.log('⚠️ No token found for video-progress request');
      }
    }
    
    // Check if the request data is FormData
    if (config.data instanceof FormData) {
      // Remove Content-Type header for FormData requests
      // This allows the browser to set the correct multipart/form-data content type with boundary
      delete config.headers['Content-Type'];
      console.log('🗂️ FormData detected, Content-Type header removed for multipart/form-data');
    }
    
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    if (config.data instanceof FormData) {
      console.log('📤 Request contains FormData with file upload');
    }
    
    return config;
  },
  (error) => {
    console.error('🚨 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError<ApiError>) => {
    const { response } = error;
    console.error('🚨 API Response Error:', error.message, response?.status);
    
    // DEBUG: Enhanced 401 error logging
    if (response?.status === 401) {
      console.log('🔐 401 Unauthorized Error Details:', {
        url: error.config?.url,
        method: error.config?.method,
        hasAuthHeader: !!error.config?.headers?.Authorization,
        responseData: response.data
      });
      
      // Check if user data exists
      const userData = localStorage.getItem('user');
      const userObj = userData ? JSON.parse(userData) : null;
      console.log('👤 Current user data:', {
        hasUser: !!userObj,
        userRole: userObj?.role,
        userId: userObj?.id
      });
      
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error('Sesi Anda telah berakhir. Silakan login ulang.');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    if (response?.status === 403) {
      toast.error('Anda tidak memiliki akses untuk melakukan aksi ini');
      return Promise.reject(error);
    }
    
    if (response && response.status >= 500) {
      toast.error('Terjadi kesalahan pada server. Silakan coba lagi.');
      return Promise.reject(error);
    }
    
    // Handle validation errors
    if (response?.status === 400 && response.data?.message) {
      if (Array.isArray(response.data.message)) {
        response.data.message.forEach((msg: string) => {
          toast.error(msg);
        });
      } else {
        toast.error(response.data.message);
      }
      return Promise.reject(error);
    }
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      toast.error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      return Promise.reject(error);
    }
    
    // Handle other client errors
    if (response?.data?.message) {
      toast.error(response.data.message);
    } else if (error.message) {
      toast.error(error.message);
    } else {
      toast.error('Terjadi kesalahan yang tidak diketahui');
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Helper functions
export const setAuthToken = (token: string) => {
  localStorage.setItem('token', token);
  api.defaults.headers.Authorization = `Bearer ${token}`;
};

export const clearAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete api.defaults.headers.Authorization;
};

export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setStoredUser = (user: any) => {
  localStorage.setItem('user', JSON.stringify(user));
};
