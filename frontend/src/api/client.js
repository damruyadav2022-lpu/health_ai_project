import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
    // In Demo Mode, we don't force login redirects to prevent loops
    if (error.response?.status === 401) {
      console.warn('Session expired or unauthorized (Demo Mode)');
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
  list: (page = 1, limit = 10, all_users = true) => api.get(`/history?page=${page}&limit=${limit}&all_users=${all_users}`),
};

// ─── Recommendations ────────────────────────────────────
export const recommendAPI = {
  get: (disease) => api.get(`/recommend?disease=${encodeURIComponent(disease)}`),
};

// ─── Patients ───────────────────────────────────────────
export const patientsAPI = {
  list: (all_users = true) => api.get(`/patients?all_users=${all_users}`),
  get: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
};

// ─── Appointments ─────────────────────────────────────────
export const appointmentsAPI = {
  list: () => api.get('/appointments'),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
};

export default api;
