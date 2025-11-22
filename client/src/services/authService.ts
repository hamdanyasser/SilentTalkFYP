/**
 * Authentication API Service
 *
 * Handles all authentication-related API calls.
 * Currently uses mock implementations - replace with real API calls.
 */

import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  PasswordResetRequest,
  PasswordResetResponse,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest,
  TwoFactorVerifyResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UploadAvatarResponse,
  User,
} from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Simulated delay for mock API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        displayName: data.username || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        preferredLanguage: data.preferredSignLanguage || 'ASL',
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: result.error || result.errors?.join(', ') || 'Registration failed',
        requiresEmailVerification: false,
      }
    }

    // Store tokens
    if (result.accessToken) {
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('refreshToken', result.refreshToken)
    }

    return {
      success: true,
      message: 'Registration successful! You can now start using SilentTalk.',
      userId: result.user?.id,
      requiresEmailVerification: !result.user?.emailConfirmed,
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      success: false,
      message: 'Registration failed. Please check your connection and try again.',
      requiresEmailVerification: false,
    }
  }
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: result.error || 'Invalid email or password',
      }
    }

    // Check if 2FA is required
    if (result.requiresTwoFactor) {
      return {
        success: true,
        requiresTwoFactor: true,
        twoFactorToken: result.accessToken,
        message: 'Please enter your 2FA code',
      }
    }

    // Store tokens
    if (result.accessToken) {
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('refreshToken', result.refreshToken)
    }

    // Map backend user format to frontend format
    const user: User = {
      id: result.user.id,
      email: result.user.email,
      username: result.user.displayName || result.user.email.split('@')[0],
      firstName: result.user.displayName?.split(' ')[0],
      lastName: result.user.displayName?.split(' ').slice(1).join(' '),
      avatarUrl: result.user.profileImageUrl,
      isEmailVerified: result.user.emailConfirmed,
      isTwoFactorEnabled: result.user.twoFactorEnabled,
      status: 'online',
      createdAt: new Date(),
      updatedAt: new Date(),
      preferredSignLanguage: result.user.preferredLanguage || 'ASL',
      notificationPreferences: {
        email: {
          enabled: true,
          messageReceived: true,
          callIncoming: true,
          callMissed: true,
          weeklyDigest: false,
        },
        push: {
          enabled: true,
          messageReceived: true,
          callIncoming: true,
          callMissed: true,
        },
        inApp: {
          enabled: true,
          sound: true,
          vibration: true,
        },
      },
      accessibilityPreferences: {
        highContrast: false,
        reduceMotion: false,
        largeText: false,
        captionsEnabled: true,
        captionFontSize: 'normal',
        screenReaderOptimized: false,
      },
      privacySettings: {
        profileVisibility: 'public',
        showOnlineStatus: true,
        showLastSeen: true,
        allowCallsFrom: 'everyone',
        allowMessagesFrom: 'everyone',
        dataCollection: {
          analytics: true,
          usageStatistics: true,
          crashReports: true,
        },
      },
    }

    return {
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user,
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      message: 'Login failed. Please check your connection and try again.',
    }
  }
}

/**
 * Verify email with token
 */
export async function verifyEmail(_data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
  try {
    // TODO: Replace with real API call
    await delay(1000)

    return {
      success: true,
      message: 'Email verified successfully! You can now log in.',
    }
  } catch (error) {
    console.error('Email verification error:', error)
    return {
      success: false,
      message: 'Email verification failed. The link may be expired.',
    }
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(
  _data: PasswordResetRequest,
): Promise<PasswordResetResponse> {
  try {
    // TODO: Replace with real API call
    await delay(1000)

    return {
      success: true,
      message:
        'If an account exists with this email, you will receive a password reset link shortly.',
    }
  } catch (error) {
    console.error('Password reset request error:', error)
    return {
      success: false,
      message: 'Failed to send password reset email. Please try again.',
    }
  }
}

/**
 * Confirm password reset with token
 */
export async function confirmPasswordReset(
  _data: PasswordResetConfirmRequest,
): Promise<PasswordResetConfirmResponse> {
  try {
    // TODO: Replace with real API call
    await delay(1000)

    return {
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
    }
  } catch (error) {
    console.error('Password reset confirmation error:', error)
    return {
      success: false,
      message: 'Failed to reset password. The link may be expired.',
    }
  }
}

/**
 * Setup 2FA for user
 */
export async function setupTwoFactor(): Promise<TwoFactorSetupResponse> {
  try {
    // TODO: Replace with real API call
    await delay(1000)

    return {
      success: true,
      qrCodeUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      secret: 'MOCK2FASECRET123',
      backupCodes: [
        '12345678',
        '87654321',
        '11111111',
        '22222222',
        '33333333',
        '44444444',
        '55555555',
        '66666666',
      ],
    }
  } catch (error) {
    console.error('2FA setup error:', error)
    throw new Error('Failed to setup 2FA')
  }
}

/**
 * Verify 2FA code
 */
export async function verifyTwoFactor(
  data: TwoFactorVerifyRequest,
): Promise<TwoFactorVerifyResponse> {
  try {
    // TODO: Replace with real API call
    await delay(1000)

    // Mock implementation
    if (data.code === '123456') {
      return {
        success: true,
        message: '2FA verified successfully',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: getMockUser(),
      }
    }

    return {
      success: false,
      message: 'Invalid 2FA code',
    }
  } catch (error) {
    console.error('2FA verification error:', error)
    return {
      success: false,
      message: 'Failed to verify 2FA code',
    }
  }
}

/**
 * Update user profile
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  try {
    // TODO: Replace with real API call
    await delay(1000)

    return {
      success: true,
      message: 'Profile updated successfully',
      user: { ...getMockUser(), ...data } as User,
    }
  } catch (error) {
    console.error('Profile update error:', error)
    return {
      success: false,
      message: 'Failed to update profile',
    }
  }
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(file: File): Promise<UploadAvatarResponse> {
  try {
    // TODO: Replace with real API call
    await delay(1500)

    // Mock implementation
    const mockUrl = URL.createObjectURL(file)

    return {
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl: mockUrl,
    }
  } catch (error) {
    console.error('Avatar upload error:', error)
    return {
      success: false,
      message: 'Failed to upload avatar',
    }
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    const token = localStorage.getItem('accessToken')

    if (token) {
      // Call backend logout endpoint
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    }

    // Clear tokens from localStorage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  } catch (error) {
    console.error('Logout error:', error)
    // Still clear local storage even if API call fails
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }
}

/**
 * Get current user from token
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = localStorage.getItem('accessToken')
    if (!token) return null

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // Token is invalid, clear storage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      return null
    }

    const result = await response.json()

    // Map backend user format to frontend format
    const user: User = {
      id: result.id,
      email: result.email,
      username: result.displayName || result.email.split('@')[0],
      firstName: result.displayName?.split(' ')[0],
      lastName: result.displayName?.split(' ').slice(1).join(' '),
      avatarUrl: result.profileImageUrl,
      isEmailVerified: result.emailConfirmed,
      isTwoFactorEnabled: result.twoFactorEnabled,
      status: 'online',
      createdAt: new Date(),
      updatedAt: new Date(),
      preferredSignLanguage: result.preferredLanguage || 'ASL',
      notificationPreferences: {
        email: {
          enabled: true,
          messageReceived: true,
          callIncoming: true,
          callMissed: true,
          weeklyDigest: false,
        },
        push: {
          enabled: true,
          messageReceived: true,
          callIncoming: true,
          callMissed: true,
        },
        inApp: {
          enabled: true,
          sound: true,
          vibration: true,
        },
      },
      accessibilityPreferences: {
        highContrast: false,
        reduceMotion: false,
        largeText: false,
        captionsEnabled: true,
        captionFontSize: 'normal',
        screenReaderOptimized: false,
      },
      privacySettings: {
        profileVisibility: 'public',
        showOnlineStatus: true,
        showLastSeen: true,
        allowCallsFrom: 'everyone',
        allowMessagesFrom: 'everyone',
        dataCollection: {
          analytics: true,
          usageStatistics: true,
          crashReports: true,
        },
      },
    }

    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

/**
 * OAuth login
 */
export function initiateOAuthLogin(provider: 'google' | 'github' | 'facebook' | 'microsoft') {
  // TODO: Replace with real OAuth flow
  const oauthUrls = {
    google: `${API_BASE_URL}/auth/oauth/google`,
    github: `${API_BASE_URL}/auth/oauth/github`,
    facebook: `${API_BASE_URL}/auth/oauth/facebook`,
    microsoft: `${API_BASE_URL}/auth/oauth/microsoft`,
  }

  window.location.href = oauthUrls[provider]
}

/**
 * Mock user data
 */
function getMockUser(): User {
  return {
    id: 'mock-user-id',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: undefined,
    isEmailVerified: true,
    isTwoFactorEnabled: false,
    status: 'online',
    createdAt: new Date(),
    updatedAt: new Date(),
    preferredSignLanguage: 'ASL',
    notificationPreferences: {
      email: {
        enabled: true,
        messageReceived: true,
        callIncoming: true,
        callMissed: true,
        weeklyDigest: false,
      },
      push: {
        enabled: true,
        messageReceived: true,
        callIncoming: true,
        callMissed: true,
      },
      inApp: {
        enabled: true,
        sound: true,
        vibration: true,
      },
    },
    accessibilityPreferences: {
      highContrast: false,
      reduceMotion: false,
      largeText: false,
      captionsEnabled: true,
      captionFontSize: 'normal',
      screenReaderOptimized: false,
    },
    privacySettings: {
      profileVisibility: 'public',
      showOnlineStatus: true,
      showLastSeen: true,
      allowCallsFrom: 'everyone',
      allowMessagesFrom: 'everyone',
      dataCollection: {
        analytics: true,
        usageStatistics: true,
        crashReports: true,
      },
    },
  }
}
