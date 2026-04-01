import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api');

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('healthai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('healthai_token');
      localStorage.removeItem('healthai_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// ─── Prediction ─────────────────────────────────────────
export const predictAPI = {
  structured: (data) => api.post('/predict', data),
  symptoms: (text) => api.post('/analyze-symptoms', { symptoms: text }),
  ocr: (formData) => api.post('/ocr', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDiseases: () => api.get('/diseases'),
};

// ─── History ────────────────────────────────────────────
export const historyAPI = {
  list: (page = 1, limit = 10) => api.get(`/history?page=${page}&limit=${limit}`),
};

// ─── Recommendations ────────────────────────────────────
export const recommendAPI = {
  get: (disease) => api.get(`/recommend?disease=${encodeURIComponent(disease)}`),
};

export default api;
