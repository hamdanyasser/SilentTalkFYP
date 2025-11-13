import { apiService } from './api.service';
import { RegisterRequest, LoginRequest, AuthResponse } from '@/types/auth.types';

/**
 * Authentication service
 * Maps to FR-001: User Authentication and Authorization
 */
class AuthService {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register', data);
    this.saveAuthData(response);
    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', data);
    this.saveAuthData(response);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } finally {
      this.clearAuthData();
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/refresh', refreshToken);
    this.saveAuthData(response);
    return response;
  }

  async confirmEmail(userId: string, token: string): Promise<boolean> {
    return await apiService.get<boolean>(`/auth/confirm-email?userId=${userId}&token=${token}`);
  }

  async forgotPassword(email: string): Promise<boolean> {
    return await apiService.post<boolean>('/auth/forgot-password', email);
  }

  private saveAuthData(authResponse: AuthResponse): void {
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('refreshToken', authResponse.refreshToken);
    localStorage.setItem('user', JSON.stringify({
      userId: authResponse.userId,
      email: authResponse.email,
      displayName: authResponse.displayName,
    }));
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < exp;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
