import axios, { AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { ApiError } from '../types';

// FIXED: Remove /api from base URL since setGlobalPrefix('api') in backend handles it
// This prevents duplicate /api/api/ in URLs
const API_BASE_URL = 'http://localhost:3000';

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
    
    if (response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
