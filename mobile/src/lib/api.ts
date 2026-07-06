import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { useAuthStore } from "../store/authStore";

// Support local development IP dynamically for physical devices running Expo Go
const getBackendUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    // Google OAuth rejects raw LAN IP redirects. We resolve raw IPs to domain names dynamically via nip.io.
    return `http://${ip}.nip.io:8000`;
  }
  return Platform.select({
    android: "http://10.0.2.2.nip.io:8000",
    default: "http://127.0.0.1:8000",
  });
};

export const API_BASE_URL = getBackendUrl();
console.log("[Wamdh API] Base URL resolved to:", API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically attach JWT token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh on 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if the error is 401 Unauthorized and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = useAuthStore.getState().refreshToken;
      const user = useAuthStore.getState().user;
      
      if (refreshToken && user) {
        try {
          // Attempt to refresh the access token
          const refreshRes = await axios.post(`${API_BASE_URL}/api/users/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access, refresh } = refreshRes.data;
          
          // Persist the new tokens in state and SecureStore
          await useAuthStore.getState().login(access, refresh || refreshToken, user);
          
          // Re-attach new access token and retry the original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh token expired or invalid -> log out user
          await useAuthStore.getState().logout();
        }
      } else {
        // No refresh token or user -> log out user
        await useAuthStore.getState().logout();
      }
    }
    
    return Promise.reject(error);
  }
);
