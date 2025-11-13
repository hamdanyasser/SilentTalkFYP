import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError } from '@/types/api.types';

/**
 * API Service for making HTTP requests
 * Implements NFR-001: API response time requirements
 * Implements NFR-004: Security with JWT tokens
 */
class ApiService {
  private api: AxiosInstance;
  private readonly BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5001/api';

  constructor() {
    this.api = axios.create({
      baseURL: this.BASE_URL,
      timeout: 10000, // 10 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              await this.refreshToken(refreshToken);
              // Retry the original request
              if (error.config) {
                return this.api.request(error.config);
              }
            } catch (refreshError) {
              // Refresh failed, logout user
              this.logout();
              window.location.href = '/login';
            }
          } else {
            this.logout();
            window.location.href = '/login';
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      const data = error.response.data as any;
      return {
        message: data.message || 'An error occurred',
        errors: data.errors || [],
        statusCode: error.response.status,
      };
    } else if (error.request) {
      return {
        message: 'No response from server',
        errors: ['Network error'],
        statusCode: 0,
      };
    } else {
      return {
        message: error.message || 'Unknown error',
        errors: [],
        statusCode: 0,
      };
    }
  }

  private async refreshToken(refreshToken: string): Promise<void> {
    const response = await this.api.post<ApiResponse<any>>('/auth/refresh', refreshToken);
    if (response.data.success && response.data.data) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
    }
  }

  private logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  // Get raw axios instance for special cases
  getAxiosInstance(): AxiosInstance {
    return this.api;
  }
}

export const apiService = new ApiService();
