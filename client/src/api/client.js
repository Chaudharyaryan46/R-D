import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('webbill_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('webbill_token');
      localStorage.removeItem('webbill_user');
      localStorage.removeItem('webbill_business');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
