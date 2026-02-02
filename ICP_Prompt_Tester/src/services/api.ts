import axios from 'axios';
import { Question, Prompt, TestResult, UploadedFile } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication API
export const register = async (email: string, password: string, name: string) => {
  const response = await api.post('/auth/register', { email, password, name });
  return response.data;
};

export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const verifyToken = async () => {
  const response = await api.get('/auth/verify');
  return response.data;
};

// Questions API
export const getQuestions = async (): Promise<Question[]> => {
  const response = await api.get('/questions');
  return response.data;
};

export const createQuestion = async (question: Omit<Question, 'id' | 'createdAt'>): Promise<Question> => {
  const response = await api.post('/questions', question);
  return response.data;
};

export const updateQuestion = async (id: string, question: Partial<Question>): Promise<Question> => {
  const response = await api.put(`/questions/${id}`, question);
  return response.data;
};

export const deleteQuestion = async (id: string): Promise<void> => {
  await api.delete(`/questions/${id}`);
};

// Prompts API
export const getPrompts = async (): Promise<Prompt[]> => {
  const response = await api.get('/prompts');
  return response.data;
};

export const getPrompt = async (id: string): Promise<Prompt> => {
  const response = await api.get(`/prompts/${id}`);
  return response.data;
};

export const createPrompt = async (prompt: Omit<Prompt, 'id' | 'createdAt'>): Promise<Prompt> => {
  const response = await api.post('/prompts', prompt);
  return response.data;
};

export const deletePrompt = async (id: string): Promise<void> => {
  await api.delete(`/prompts/${id}`);
};

// File Upload API
export const uploadJsonFile = async (file: File): Promise<UploadedFile> => {
  const formData = new FormData();
  formData.append('jsonFile', file);
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Testing API
export const testPrompt = async (promptId: string, jsonData: any): Promise<TestResult> => {
  const response = await api.post('/test', { promptId, jsonData });
  return response.data;
};

export const getTestResults = async (): Promise<TestResult[]> => {
  const response = await api.get('/results');
  return response.data;
};

export const getTestResultsForPrompt = async (promptId: string): Promise<TestResult[]> => {
  const response = await api.get(`/results/${promptId}`);
  return response.data;
};

// Analytics API
export const getOverallAnalytics = async () => {
  const response = await api.get('/analytics/overall');
  return response.data;
};

export const getPromptAnalytics = async (promptId: string, startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await api.get(`/analytics/prompt/${promptId}?${params.toString()}`);
  return response.data;
};

// Prompt versioning API
export const getPromptVersions = async (name: string) => {
  const response = await api.get(`/prompts/${name}/versions`);
  return response.data;
};

export const clonePrompt = async (promptId: string, name?: string) => {
  const response = await api.post(`/prompts/${promptId}/clone`, { name });
  return response.data;
};

export const comparePrompts = async (promptId: string, versionId: string) => {
  const response = await api.get(`/prompts/${promptId}/compare/${versionId}`);
  return response.data;
};
