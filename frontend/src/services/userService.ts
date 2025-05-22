import api from './api';
import { ApiResponse, User } from '../types';

export const userService = {
  getUsers: async (params?: any): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getStudents: async (params?: any): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/users/students', { params });
    return response.data;
  },

  getLecturers: async (params?: any): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/users/lecturers', { params });
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: any): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: any): Promise<User> => {
    const response = await api.patch(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  enrollStudent: async (studentId: string, courseId: string): Promise<void> => {
    await api.post(`/users/${studentId}/enroll`, { courseId });
  },

  unenrollStudent: async (studentId: string, courseId: string): Promise<void> => {
    await api.delete(`/users/${studentId}/enroll/${courseId}`);
  },

  getStudentCourses: async (studentId: string): Promise<any[]> => {
    const response = await api.get(`/users/${studentId}/courses`);
    return response.data;
  },

  getLecturerCourses: async (lecturerId: string): Promise<any[]> => {
    const response = await api.get(`/users/${lecturerId}/lecturer-courses`);
    return response.data;
  },
};
