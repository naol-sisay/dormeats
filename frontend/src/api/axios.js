import axios from "axios";

// All requests go through the Vite proxy to the Express backend
const api = axios.create({
  baseURL: "/api",
});

// Attach the JWT token (if any) to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
