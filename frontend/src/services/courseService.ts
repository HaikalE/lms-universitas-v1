import api from './api';
import { ApiResponse, Course, CourseMaterial } from '../types';

export const courseService = {
  getCourses: async (params?: any): Promise<ApiResponse<Course[]>> => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  getCourse: async (id: string): Promise<Course> => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  getMyCourses: async (): Promise<Course[]> => {
    const response = await api.get('/users/my-courses');
    return response.data;
  },

  getCourseMaterials: async (courseId: string): Promise<CourseMaterial[]> => {
    const response = await api.get(`/courses/${courseId}/materials`);
    return response.data;
  },

  createCourseMaterial: async (
    courseId: string,
    materialData: any
  ): Promise<CourseMaterial> => {
    const response = await api.post(`/courses/${courseId}/materials`, materialData);
    return response.data;
  },

  updateCourseMaterial: async (
    courseId: string,
    materialId: string,
    materialData: any
  ): Promise<CourseMaterial> => {
    const response = await api.patch(
      `/courses/${courseId}/materials/${materialId}`,
      materialData
    );
    return response.data;
  },

  deleteCourseMaterial: async (courseId: string, materialId: string): Promise<void> => {
    await api.delete(`/courses/${courseId}/materials/${materialId}`);
  },

  getCourseStats: async (courseId: string): Promise<any> => {
    const response = await api.get(`/courses/${courseId}/stats`);
    return response.data;
  },
};
