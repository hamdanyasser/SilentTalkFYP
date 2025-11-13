/**
 * Authentication related types
 * Maps to backend DTOs (FR-001)
 */

export interface User {
  userId: string;
  email: string;
  displayName: string;
  profileImageUrl?: string;
  preferredLanguage: string;
  isOnline: boolean;
  availabilityStatus?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  preferredLanguage: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthResponse {
  userId: string;
  email: string;
  displayName: string;
  token: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
