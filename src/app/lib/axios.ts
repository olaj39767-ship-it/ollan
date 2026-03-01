import axios from "axios";
import { useAuthStore } from "@/src/store/Authstore";


const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://ollanback.vercel.app/api",
  headers: { "Content-Type": "application/json" },
});

// Attach token from zustand store to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;