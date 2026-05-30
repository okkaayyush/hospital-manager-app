import axios from 'axios';

const API = axios.create({
  baseURL: 'https://medibook-backend-imgg.onrender.com/api',
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  // Add timestamp to prevent caching
  req.params = { ...req.params, _t: Date.now() };
  return req;
});

export default API;