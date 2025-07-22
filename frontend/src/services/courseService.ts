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
      // REMOVED: Client-side validation - let backend handle routing properly
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

  // FIXED: Updated to use new /create endpoint first, then fallbacks
  getCreateCourseData: async (): Promise<ApiResponse<CreateCourseFormData>> => {
    try {
      console.log('📋 Fetching course creation form data');
      
      // FIXED: Try the new /create endpoint first (most direct)
      try {
        console.log('🔄 Trying /courses/create endpoint...');
        const response = await api.get('/courses/create');
        console.log('✅ Course creation data fetched via /create:', response.data);
        
        // Handle response format
        if (response.data.data) {
          return response.data;
        } else {
          return {
            success: true,
            data: response.data,
            message: 'Data retrieved successfully via /create'
          };
        }
      } catch (createError) {
        console.log('⚠️ /create endpoint failed, trying form-data...');
        
        // FALLBACK: Try /form-data endpoint
        try {
          console.log('🔄 Trying /courses/form-data endpoint...');
          const response = await api.get('/courses/form-data');
          console.log('✅ Course creation data fetched via /form-data:', response.data);
          
          if (response.data.data) {
            return response.data;
          } else {
            return {
              success: true,
              data: response.data,
              message: 'Data retrieved successfully via /form-data'
            };
          }
        } catch (formDataError) {
          console.log('⚠️ /form-data endpoint failed, trying create-data...');
          
          // FINAL FALLBACK: Try /create-data endpoint
          try {
            console.log('🔄 Trying /courses/create-data endpoint...');
            const fallbackResponse = await api.get('/courses/create-data');
            console.log('✅ Fallback successful via /create-data');
            
            if (fallbackResponse.data.data) {
              return fallbackResponse.data;
            } else {
              return {
                success: true,
                data: fallbackResponse.data,
                message: 'Data retrieved successfully via /create-data'
              };
            }
          } catch (finalError) {
            console.error('❌ All endpoints failed:', finalError);
            throw new Error('Unable to fetch course creation form data from any endpoint');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching course creation data:', error);
      throw new Error('Unable to fetch course creation form data');
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
      courses.forEach(course => {
        console.log(`   - ${course.code}: ${course.name} (ID: ${course.id})`);
      });
      
      return courses;
    } catch (error) {
      console.error('❌ Error fetching my courses:', error);
      throw error;
    }
  },

  getCourseMaterials: async (courseId: string): Promise<CourseMaterial[]> => {
    try {
      console.log('📖 Fetching course materials for:', courseId);
      const response = await api.get(`/courses/${courseId}/materials`);
      console.log(`✅ Found ${response.data.length || 0} materials`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching course materials:', error);
      throw error;
    }
  },

  createCourseMaterial: async (
    courseId: string,
    materialData: any
  ): Promise<CourseMaterial> => {
    try {
      console.log('➕ Creating course material for:', courseId);
      const response = await api.post(`/courses/${courseId}/materials`, materialData);
      console.log('✅ Course material created:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating course material:', error);
      throw error;
    }
  },

  updateCourseMaterial: async (
    courseId: string,
    materialId: string,
    materialData: any
  ): Promise<CourseMaterial> => {
    try {
      console.log('✏️ Updating course material:', materialId);
      const response = await api.patch(
        `/courses/${courseId}/materials/${materialId}`,
        materialData
      );
      console.log('✅ Course material updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating course material:', error);
      throw error;
    }
  },

  deleteCourseMaterial: async (courseId: string, materialId: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting course material:', materialId);
      await api.delete(`/courses/${courseId}/materials/${materialId}`);
      console.log('✅ Course material deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting course material:', error);
      throw error;
    }
  },

  getCourseStats: async (courseId: string): Promise<any> => {
    try {
      console.log('📊 Fetching course stats for:', courseId);
      const response = await api.get(`/courses/${courseId}/stats`);
      console.log('✅ Course stats fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching course stats:', error);
      throw error;
    }
  },

  // Student Management Methods
  getCourseStudents: async (
    courseId: string,
    params?: QueryCourseStudentsParams
  ): Promise<ApiResponse<CourseStudent[]>> => {
    try {
      console.log('👥 Fetching course students for:', courseId);
      const response = await api.get(`/courses/${courseId}/students`, { params });
      console.log(`✅ Found ${response.data.data?.length || 0} students`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching course students:', error);
      throw error;
    }
  },

  enrollStudent: async (
    courseId: string,
    studentData: EnrollStudentRequest
  ): Promise<{ message: string; student: CourseStudent }> => {
    try {
      console.log('✅ Enrolling student to course:', courseId);
      const response = await api.post(`/courses/${courseId}/students/enroll`, studentData);
      console.log('✅ Student enrolled successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error enrolling student:', error);
      throw error;
    }
  },

  enrollMultipleStudents: async (
    courseId: string,
    studentsData: EnrollMultipleStudentsRequest
  ): Promise<{
    message: string;
    enrolledStudents: CourseStudent[];
    errors?: string[];
  }> => {
    try {
      console.log('✅ Enrolling multiple students to course:', courseId);
      const response = await api.post(`/courses/${courseId}/students/enroll-multiple`, studentsData);
      console.log('✅ Multiple students enrolled successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error enrolling multiple students:', error);
      throw error;
    }
  },

  addStudentByEmail: async (
    courseId: string,
    studentData: AddStudentByEmailRequest
  ): Promise<{ message: string; student: CourseStudent }> => {
    try {
      console.log('📧 Adding student by email to course:', courseId);
      const response = await api.post(`/courses/${courseId}/students/add-by-email`, studentData);
      console.log('✅ Student added by email successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error adding student by email:', error);
      throw error;
    }
  },

  removeStudentFromCourse: async (
    courseId: string,
    studentId: string
  ): Promise<{ message: string; student: CourseStudent }> => {
    try {
      console.log('➖ Removing student from course:', courseId);
      const response = await api.delete(`/courses/${courseId}/students/${studentId}`);
      console.log('✅ Student removed from course successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error removing student from course:', error);
      throw error;
    }
  },

  getAvailableStudents: async (courseId: string): Promise<CourseStudent[]> => {
    try {
      console.log('🔍 Fetching available students for course:', courseId);
      const response = await api.get(`/courses/${courseId}/students/available`);
      console.log(`✅ Found ${response.data.length || 0} available students`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching available students:', error);
      throw error;
    }
  },
};

export type { CourseStudent, QueryCourseStudentsParams, CreateCourseFormData };
