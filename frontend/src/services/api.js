import axios from 'axios';

export const AUTH_TOKEN_STORAGE_KEY = 'auth-token';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const deviceToken = localStorage.getItem('device-token');

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (deviceToken) {
    config.headers = config.headers ?? {};
    config.headers['device-token'] = deviceToken;
  }

  return config;
});

export default api;
