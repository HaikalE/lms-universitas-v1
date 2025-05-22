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

  gradeSubmission: async (submissionId: string, gradeData: any): Promise<Grade> => {
    const response = await api.post(`/assignments/submissions/${submissionId}/grade`, gradeData);
    return response.data;
  },

  getMyGrades: async (): Promise<Grade[]> => {
    const response = await api.get('/assignments/grades/my-grades');
    return response.data;
  },

  getStudentGrades: async (studentId: string): Promise<Grade[]> => {
    const response = await api.get(`/assignments/grades/student/${studentId}`);
    return response.data;
  },
};
