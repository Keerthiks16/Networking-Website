// zustand.js
import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  authLoading: true,

  signup: async (formData) => {
    try {
      set({ loading: true });
      const response = await axios.post("/api/v1/auth/signup", formData);
      console.log("Signup response:", response.data);

      // Immediately fetch user data after successful signup
      const userResponse = await axios.get("/api/v1/auth/me");
      console.log("User data after signup:", userResponse.data);

      set({
        user: userResponse.data.user,
        loading: false,
      });

      toast.success("Account created successfully");
      return userResponse.data;
    } catch (error) {
      console.error("Signup error:", error);
      set({ loading: false });
      toast.error(error.response?.data?.message || "Signup failed");
      throw error;
    }
  },

  login: async (formData) => {
    try {
      set({ loading: true });
      const response = await axios.post("/api/v1/auth/login", formData);
      console.log("Login response:", response.data);

      // Since login is successful, immediately fetch user data
      const userResponse = await axios.get("/api/v1/auth/me");
      console.log("User data:", userResponse.data);

      set({
        user: userResponse.data.user,
        loading: false,
      });

      toast.success("Login successful");
      return userResponse.data;
    } catch (error) {
      console.error("Login error:", error);
      set({ loading: false });
      toast.error(error.response?.data?.message || "Login failed");
      throw error;
    }
  },
  logout: async () => {
    try {
      set({ loading: true });
      await axios.post("/api/v1/auth/logout");
      set({ user: null, loading: false });
      toast.success("Logged out successfully");
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Logout failed");
      throw error;
    }
  },

  authCheck: async () => {
    try {
      set({ authLoading: true });
      const response = await axios.get("/api/v1/auth/me");
      console.log("Auth check response:", response.data);
      set({ user: response.data.user, authLoading: false });
      return response.data;
    } catch (error) {
      console.error("Auth check error:", error);
      set({ user: null, authLoading: false });
    }
  },
}));

// Axios default configuration
axios.defaults.withCredentials = true;

export default useAuthStore;
