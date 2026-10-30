import axios from 'axios';

// Same site: '/api'. Render (separate API service): set VITE_API_URL=https://api.yourdomain.co.ke/api
export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000, // 30 seconds for image uploads
});

// Attach token to EVERY request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // If we're uploading a file, let the browser set the Content-Type
  // (including the boundary). Otherwise, default to JSON.
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// Auto-refresh on 401
let refreshing = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retried &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/verify-otp')
    ) {
      original._retried = true;

      try {
        refreshing = refreshing || axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        const { data } = await refreshing;
        refreshing = null;

        localStorage.setItem('token', data.token);
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch (err) {
        refreshing = null;
        localStorage.removeItem('token');
        window.location.href = window.location.pathname.startsWith('/dmc-console') ? '/dmc-console/login' : '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
