import axios, { AxiosError } from "axios";
import { ApiErrorResponse } from "@/types/auth.types";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
});

// Flag to prevent multiple redirects
let isRedirecting = false;

// Function to clear all auth data
export const clearAuthData = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
    sessionStorage.clear();
  }
};

// Function to handle unauthorized access
export const handleUnauthorized = (redirectToLogin = true) => {
  if (isRedirecting) return;

  clearAuthData();

  if (
    redirectToLogin &&
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/auth/login")
  ) {
    isRedirecting = true;
    window.location.replace("/auth/login?session=expired");
  }
};

// Reset redirect flag when page loads
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    isRedirecting = false;
  });
}

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    // Network error
    if (!error.response) {
      console.error("Network Error:", error.message);
      return Promise.reject({
        message:
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
        statusCode: 0,
        isNetworkError: true,
      });
    }

    const status = error.response.status;
    const requestUrl = error.config?.url || "";

    // List of auth endpoints that should NOT trigger auto-logout on 401
    const authEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/verify-email",
    ];

    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      requestUrl.includes(endpoint)
    );

    // Handle 401 Unauthorized - but NOT for auth endpoints
    if (status === 401 && !isAuthEndpoint) {
      console.warn("Unauthorized access - clearing session");
      handleUnauthorized(true);
      return Promise.reject({
        ...error,
        isAuthError: true,
      });
    }

    // Handle 403 Forbidden
    if (status === 403) {
      console.error("Access Denied:", error.response.data?.message);
    }

    // Handle 404 Not Found
    if (status === 404) {
      console.error("Not Found:", error.response.data?.message);
    }

    // Handle 500 Server Error
    if (status >= 500) {
      console.error("Server Error:", error.response.data?.message);
    }

    return Promise.reject(error);
  }
);

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error as AxiosError<ApiErrorResponse>;

    if (apiError.response?.data?.message) {
      const message = apiError.response.data.message;
      return Array.isArray(message) ? message.join(", ") : message;
    }

    if (apiError.message) {
      return apiError.message;
    }
  }

  if (error && typeof error === "object" && "message" in error) {
    return (error as { message: string }).message;
  }

  return "Terjadi kesalahan yang tidak diketahui";
};
