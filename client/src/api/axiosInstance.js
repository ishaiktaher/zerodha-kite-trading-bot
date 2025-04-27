// src/api/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:4000", // Your server base URL
});

// Add an interceptor to attach accessToken automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // Pull from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Add it to headers
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
