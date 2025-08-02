import api from './api';
import { ApiResponse, Assignment, Submission, Grade } from '../types';

export const assignmentService = {
  getAssignments: async (params?: any): Promise<ApiResponse<Assignment[]>> => {
    const response = await api.get('/assignments', { params });
    return response.data;
  },

  getAssignment: async (id: string): Promise<Assignment> => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  createAssignment: async (assignmentData: any): Promise<Assignment> => {
    const response = await api.post('/assignments', assignmentData);
    return response.data;
  },

  updateAssignment: async (id: string, assignmentData: any): Promise<Assignment> => {
    const response = await api.patch(`/assignments/${id}`, assignmentData);
    return response.data;
  },

  deleteAssignment: async (id: string): Promise<void> => {
    await api.delete(`/assignments/${id}`);
  },

  submitAssignment: async (assignmentId: string, submissionData: any): Promise<Submission> => {
    const response = await api.post(`/assignments/${assignmentId}/submit`, submissionData);
    return response.data;
  },

  updateSubmission: async (assignmentId: string, submissionData: any): Promise<Submission> => {
    const response = await api.patch(`/assignments/${assignmentId}/submit`, submissionData);
    return response.data;
  },

  getAssignmentSubmissions: async (assignmentId: string): Promise<Submission[]> => {
    const response = await api.get(`/assignments/${assignmentId}/submissions`);
    return response.data;
  },

  // 🎯 FIXED: Quick grading dengan proper DTO structure
  gradeSubmission: async (submissionId: string, gradeData: {
    score: number;
    feedback?: string;
  }): Promise<Grade> => {
    try {
      console.log('🎯 Quick grading submission:', submissionId, 'with score:', gradeData.score);
      
      // Client-side validation
      if (!submissionId || submissionId.trim() === '') {
        throw new Error('Submission ID is required');
      }
      
      if (typeof gradeData.score !== 'number' || gradeData.score < 0 || gradeData.score > 100) {
        throw new Error('Score must be a number between 0 and 100');
      }

      // 🔧 FIXED: Only send properties that are in CreateGradeDto
      const requestData = {
        score: gradeData.score,
        feedback: gradeData.feedback || ''
        // ❌ REMOVED: gradedAt - backend will set this automatically
      };

      console.log('✅ Sending grade request:', requestData);
      
      const response = await api.post(`/assignments/submissions/${submissionId}/grade`, requestData);
      
      console.log('✅ Submission graded successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error grading submission:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Submission tidak ditemukan');
      } else if (error.response?.status === 403) {
        throw new Error('Anda tidak memiliki permission untuk menilai submission ini');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Data yang dikirim tidak valid';
        console.error('🔍 Detailed 400 error:', error.response.data);
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },

  // 🔍 NEW: Get pending submissions for lecturer dashboard
  getPendingSubmissions: async (params?: {
    limit?: number;
    courseId?: string;
    sortBy?: 'submittedAt' | 'dueDate' | 'studentName';
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<ApiResponse<Submission[]>> => {
    try {
      console.log('📝 Fetching pending submissions for lecturer');
      const response = await api.get('/assignments/submissions/pending', { params });
      console.log(`✅ Found ${response.data.data?.length || 0} pending submissions`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching pending submissions:', error);
      throw error;
    }
  },

  // 🎯 FIXED: Bulk grading dengan proper DTO structure
  bulkGradeSubmissions: async (gradesData: Array<{
    submissionId: string;
    score: number;
    feedback?: string;
  }>): Promise<{ success: Grade[], failed: Array<{submissionId: string, error: string}> }> => {
    try {
      console.log('📊 Bulk grading', gradesData.length, 'submissions');
      
      // 🔧 FIXED: Ensure each grade object follows DTO structure
      const cleanedGrades = gradesData.map(grade => ({
        submissionId: grade.submissionId,
        score: grade.score,
        feedback: grade.feedback || ''
        // ❌ REMOVED: gradedAt - backend will set this
      }));
      
      const response = await api.post('/assignments/submissions/bulk-grade', { 
        grades: cleanedGrades 
      });
      console.log('✅ Bulk grading completed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error in bulk grading:', error);
      throw error;
    }
  },

  // 📈 NEW: Get grading statistics for lecturer
  getGradingStats: async (): Promise<{
    totalPending: number;
    totalGraded: number;
    averageGrade: number;
    lateSubmissions: number;
    gradingTrend: Array<{ date: string; count: number; }>;
  }> => {
    try {
      console.log('📊 Fetching grading statistics');
      const response = await api.get('/assignments/grading/stats');
      console.log('✅ Grading stats fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching grading stats:', error);
      throw error;
    }
  },

  getMyGrades: async (): Promise<Grade[]> => {
    const response = await api.get('/assignments/grades/my-grades');
    return response.data;
  },

  getStudentGrades: async (studentId: string): Promise<Grade[]> => {
    const response = await api.get(`/assignments/grades/student/${studentId}`);
    return response.data;
  },

  // 🔄 FIXED: Auto-save draft grades dengan proper structure
  saveDraftGrade: async (submissionId: string, draftData: {
    score?: number;
    feedback?: string;
    isDraft: boolean;
  }): Promise<{ message: string }> => {
    try {
      console.log('💾 Saving draft grade for submission:', submissionId);
      
      // 🔧 FIXED: Only send valid DTO properties
      const requestData = {
        score: draftData.score,
        feedback: draftData.feedback,
        isDraft: draftData.isDraft
        // ❌ REMOVED: gradedAt - backend will handle timestamps
      };
      
      const response = await api.patch(`/assignments/submissions/${submissionId}/draft`, requestData);
      console.log('✅ Draft grade saved');
      return response.data;
    } catch (error) {
      console.error('❌ Error saving draft grade:', error);
      throw error;
    }
  },

  // 🔍 NEW: Get submission details with enhanced data
  getSubmissionDetail: async (submissionId: string): Promise<Submission & {
    student: { id: string; fullName: string; email: string; };
    assignment: { title: string; maxScore: number; dueDate: string; };
    course: { name: string; code: string; };
    isLate: boolean;
    daysPastDue?: number;
  }> => {
    try {
      console.log('🔍 Fetching submission detail:', submissionId);
      const response = await api.get(`/assignments/submissions/${submissionId}/detail`);
      console.log('✅ Submission detail fetched:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching submission detail:', error);
      throw error;
    }
  },
};