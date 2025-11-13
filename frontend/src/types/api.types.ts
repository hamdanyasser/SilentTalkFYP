/**
 * API response types
 */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors: string[];
  timestamp: string;
}

export interface ApiError {
  message: string;
  errors: string[];
  statusCode: number;
}
