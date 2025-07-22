import api from './api';
import { ApiResponse, Course, CourseMaterial, User } from '../types';

interface CourseStudent {
  id: string;
  fullName: string;
  studentId: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  enrolledAt?: string;
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

interface CreateCourseFormData {
  lecturers: User[];
  statistics: {
    totalCourses: number;
    activeCourses: number;
    totalLecturers: number;
  };
  formFields: {
    semesters: string[];
    creditOptions: number[];
    maxStudentsOptions: number[];
  };
}

export const courseService = {
  getCourses: async (params?: any): Promise<ApiResponse<Course[]>> => {
    try {
      console.log('📚 Fetching all courses with params:', params);
      const response = await api.get('/courses', { params });
      console.log(`✅ Found ${response.data.data?.length || 0} courses`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
      throw error;
    }
  },

  getCourse: async (id: string): Promise<Course> => {
    try {
      // FIXED: Add validation to prevent reserved keywords being used as IDs
      const reservedKeywords = ['create', 'form-data', 'create-data', 'lecturers', 'new', 'edit', 'delete'];
      if (reservedKeywords.includes(id.toLowerCase())) {
        throw new Error(`"${id}" is a reserved keyword and cannot be used as a course ID`);
      }

      // FIXED: Add basic UUID validation
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(id)) {
        throw new Error(`Invalid course ID format: "${id}" is not a valid UUID`);
      }

      console.log('📚 Fetching course:', id);
      const response = await api.get(`/courses/${id}`);
      
      if (!response.data || !response.data.id) {
        throw new Error('Course not found or invalid response structure');
      }
      
      console.log('✅ Course fetched:', response.data.name || response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching course:', error);
      throw error;
    }
  },

  // FIXED: Updated endpoint to use new routing structure
  getCreateCourseData: async (): Promise<ApiResponse<CreateCourseFormData>> => {
    try {
      console.log('📋 Fetching course creation form data');
      
      // FIXED: Use the new endpoint that doesn't conflict with routing
      const response = await api.get('/courses/form-data');
      
      console.log('✅ Course creation data fetched:', response.data);
      
      // FIXED: Add response validation
      if (!response.data) {
        throw new Error('Invalid response structure from course form data endpoint');
      }
      
      // Handle both wrapped and direct response formats
      if (response.data.data) {
        return response.data;
      } else {
        // If data is returned directly, wrap it in the expected format
        return {
          success: true,
          data: response.data,
          message: 'Data retrieved successfully'
        };
      }
    } catch (error) {
      console.error('❌ Error fetching course creation data:', error);
      
      // FALLBACK: Try alternative endpoint
      try {
        console.log('🔄 Trying alternative endpoint...');
        const fallbackResponse = await api.get('/courses/create-data');
        console.log('✅ Fallback successful');
        
        if (fallbackResponse.data.data) {
          return fallbackResponse.data;
        } else {
          return {
            success: true,
            data: fallbackResponse.data,
            message: 'Data retrieved successfully via fallback'
          };
        }
      } catch (fallbackError) {
        console.error('❌ Both endpoints failed:', fallbackError);
        throw new Error('Unable to fetch course creation form data from any endpoint');
      }
    }
  },

  // FIXED: Updated to use new endpoint structure
  getAllLecturers: async (): Promise<ApiResponse<User[]>> => {
    try {
      console.log('👨‍🏫 Fetching all lecturers');
      const response = await api.get('/courses/lecturers');
      
      console.log(`✅ Found ${response.data.data?.length || 0} lecturers`);
      
      // Handle response structure
      if (response.data.data) {
        return response.data;
      } else if (Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
          message: 'Lecturers retrieved successfully'
        };
      } else {
        throw new Error('Invalid response structure from lecturers endpoint');
      }
    } catch (error) {
      console.error('❌ Error fetching lecturers:', error);
      throw error;
    }
  },

  createCourse: async (courseData: {
    code: string;
    name: string;
    description?: string;
    credits: number;
    semester: string;
    lecturerId: string;
  }): Promise<Course> => {
    try {
      console.log('➕ Creating course:', courseData.name);
      
      // FIXED: Add client-side validation
      if (!courseData.lecturerId || courseData.lecturerId.trim() === '') {
        throw new Error('Lecturer ID is required');
      }
      
      if (!courseData.code || courseData.code.trim() === '') {
        throw new Error('Course code is required');
      }
      
      if (!courseData.name || courseData.name.trim() === '') {
        throw new Error('Course name is required');
      }
      
      const response = await api.post('/courses', courseData);
      console.log('✅ Course created:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating course:', error);
      throw error;
    }
  },

  updateCourse: async (courseId: string, courseData: any): Promise<Course> => {
    try {
      console.log('✏️ Updating course:', courseId);
      const response = await api.patch(`/courses/${courseId}`, courseData);
      console.log('✅ Course updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating course:', error);
      throw error;
    }
  },

  deleteCourse: async (courseId: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting course:', courseId);
      await api.delete(`/courses/${courseId}`);
      console.log('✅ Course deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting course:', error);
      throw error;
    }
  },

  getMyCourses: async (params?: any): Promise<Course[]> => {
    try {
      console.log('👤 Fetching my courses with params:', params);
      const response = await api.get('/users/my-courses', { params });
      
      // ENHANCED: Better data handling and validation
      let courses: Course[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        courses = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        courses = response.data.data;
      } else {
        console.warn('⚠️ Unexpected response format for my courses:', response.data);
        courses = [];
      }
      
      console.log(`✅ Found ${courses.length} my courses:`);