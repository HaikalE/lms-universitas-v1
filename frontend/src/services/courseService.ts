import api from './api';
import { ApiResponse, Course, CourseMaterial, User } from '../types';

interface CourseStudent {
  id: string;
  fullName: string;
  studentId: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  enrolledAt?: string; // Added missing enrolledAt property
}

interface EnrollStudentRequest {
  studentId: string;
}

interface EnrollMultipleStudentsRequest {
  studentIds: string[];
}

interface AddStudentByEmailRequest {
  email: string;
}

interface QueryCourseStudentsParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'fullName' | 'studentId' | 'enrolledAt';
  sortOrder?: 'ASC' | 'DESC';
}

export const courseService = {
  getCourses: async (params?: any): Promise<ApiResponse<Course[]>> => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  getCourse: async (id: string): Promise<Course> => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  createCourse: async (courseData: {
    code: string;
    name: string;
    description?: string;
    credits: number;
    semester: string;
    lecturerId: string;
  }): Promise<Course> => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  updateCourse: async (courseId: string, courseData: any): Promise<Course> => {
    const response = await api.patch(`/courses/${courseId}`, courseData);
    return response.data;
  },

  deleteCourse: async (courseId: string): Promise<void> => {
    await api.delete(`/courses/${courseId}`);
  },

  getMyCourses: async (params?: any): Promise<Course[]> => { // MODIFIED: Added params?: any
    const response = await api.get('/users/my-courses', { params }); // MODIFIED: Passed params to api.get
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

  // Student Management Methods
  getCourseStudents: async (
    courseId: string,
    params?: QueryCourseStudentsParams
  ): Promise<ApiResponse<CourseStudent[]>> => {
    const response = await api.get(`/courses/${courseId}/students`, { params });
    return response.data;
  },

  enrollStudent: async (
    courseId: string,
    studentData: EnrollStudentRequest
  ): Promise<{ message: string; student: CourseStudent }> => {
    const response = await api.post(`/courses/${courseId}/students/enroll`, studentData);
    return response.data;
  },

  enrollMultipleStudents: async (
    courseId: string,
    studentsData: EnrollMultipleStudentsRequest
  ): Promise<{
    message: string;
    enrolledStudents: CourseStudent[];
    errors?: string[];
  }> => {
    const response = await api.post(`/courses/${courseId}/students/enroll-multiple`, studentsData);
    return response.data;
  },

  addStudentByEmail: async (
    courseId: string,
    studentData: AddStudentByEmailRequest
  ): Promise<{ message: string; student: CourseStudent }> => {
    const response = await api.post(`/courses/${courseId}/students/add-by-email`, studentData);
    return response.data;
  },

  removeStudentFromCourse: async (
    courseId: string,
    studentId: string
  ): Promise<{ message: string; student: CourseStudent }> => {
    const response = await api.delete(`/courses/${courseId}/students/${studentId}`);
    return response.data;
  },

  getAvailableStudents: async (courseId: string): Promise<CourseStudent[]> => {
    const response = await api.get(`/courses/${courseId}/students/available`);
    return response.data;
  },
};

export type { CourseStudent, QueryCourseStudentsParams };
