import axios from 'axios';
<<<<<<< Updated upstream
=======
import toast from 'react-hot-toast';
>>>>>>> Stashed changes

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors and 401 redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
<<<<<<< Updated upstream
      // Token expired or invalid — clear auth and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
=======
      // Token expired or invalid — clear auth, notify user, and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        toast.error('Your session has expired. Please sign in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
>>>>>>> Stashed changes
      }
    }
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
