import axios from 'axios';
import { get as getFromDB } from './indexedDB';

export const AUTH_TOKEN_STORAGE_KEY = 'auth-token';
const DEVICE_TOKEN_KEY = 'device-jwt';

const api = axios.create({
  // Cambiamos la URL absoluta por una relativa
  baseURL: import.meta.env.DEV ? 'http://localhost:3001/api' : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const deviceToken = await getFromDB(DEVICE_TOKEN_KEY);

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