import axios from 'axios';
import { getDeviceFingerprint } from './fingerprint';

const API_BASE_URL = 'http://localhost:8005/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor to attach auth token and device fingerprint
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('bucoride_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const deviceHash = await getDeviceFingerprint();
  if (deviceHash) {
    config.headers['X-Device-Fingerprint'] = deviceHash;
  }

  return config;
});

export default api;
