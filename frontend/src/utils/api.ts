import axios from 'axios';

const api = axios.create({
  baseURL: ((import.meta as any).env?.VITE_API_URL as string) || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT tokens
api.interceptors.request.use(
  (config) => {
    // Check if path is admin endpoint
    const isAdminPath = config.url?.startsWith('/admin');
    
    if (isAdminPath) {
      const adminToken = localStorage.getItem('admin_token');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      const userToken = localStorage.getItem('token');
      if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
