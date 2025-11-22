/**
 * Authentication & User Types
 */

export type UserStatus = 'online' | 'offline' | 'away' | 'busy' | 'do-not-disturb'

export type SignLanguage =
  | 'ASL' // American Sign Language
  | 'BSL' // British Sign Language
  | 'Auslan' // Australian Sign Language
  | 'FSL' // French Sign Language (Langue des Signes Française)
  | 'DGS' // German Sign Language (Deutsche Gebärdensprache)
  | 'JSL' // Japanese Sign Language
  | 'ISL' // Indian Sign Language
  | 'CSL' // Chinese Sign Language
  | 'Other'

export interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  isEmailVerified: boolean
  isTwoFactorEnabled: boolean
  status: UserStatus
  lastSeen?: Date
  createdAt: Date
  updatedAt: Date

  // Preferences
  preferredSignLanguage?: SignLanguage
  notificationPreferences: NotificationPreferences
  accessibilityPreferences: AccessibilityPreferences
  privacySettings: PrivacySettings
}

export interface NotificationPreferences {
  email: {
    enabled: boolean
    messageReceived: boolean
    callIncoming: boolean
    callMissed: boolean
    weeklyDigest: boolean
  }
  push: {
    enabled: boolean
    messageReceived: boolean
    callIncoming: boolean
    callMissed: boolean
  }
  inApp: {
    enabled: boolean
    sound: boolean
    vibration: boolean
  }
}

export interface AccessibilityPreferences {
  highContrast: boolean
  reduceMotion: boolean
  largeText: boolean
  captionsEnabled: boolean
  captionFontSize: 'normal' | 'large' | 'extra-large'
  screenReaderOptimized: boolean
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private'
  showOnlineStatus: boolean
  showLastSeen: boolean
  allowCallsFrom: 'everyone' | 'contacts' | 'nobody'
  allowMessagesFrom: 'everyone' | 'contacts' | 'nobody'
  dataCollection: {
    analytics: boolean
    usageStatistics: boolean
    crashReports: boolean
  }
}

// Authentication Request/Response Types
export interface RegisterRequest {
  email: string
  username: string
  password: string
  confirmPassword: string
  firstName?: string
  lastName?: string
}

export interface RegisterResponse {
  success: boolean
  message: string
  userId?: string
  requiresEmailVerification: boolean
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  success: boolean
  message?: string
  requiresTwoFactor?: boolean
  twoFactorToken?: string
  accessToken?: string
  refreshToken?: string
  user?: User
}

export interface VerifyEmailRequest {
  token: string
}

export interface VerifyEmailResponse {
  success: boolean
  message: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetResponse {
  success: boolean
  message: string
}

export interface PasswordResetConfirmRequest {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface PasswordResetConfirmResponse {
  success: boolean
  message: string
}

export interface TwoFactorSetupResponse {
  success: boolean
  qrCodeUrl: string
  secret: string
  backupCodes: string[]
}

export interface TwoFactorVerifyRequest {
  code: string
  token?: string // For login flow
}

export interface TwoFactorVerifyResponse {
  success: boolean
  message?: string
  accessToken?: string
  refreshToken?: string
  user?: User
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  username?: string
  preferredSignLanguage?: SignLanguage
  status?: UserStatus
}

export interface UpdateProfileResponse {
  success: boolean
  message: string
  user?: User
}

export interface UploadAvatarResponse {
  success: boolean
  message: string
  avatarUrl?: string
}

export interface OAuthProvider {
  id: 'google' | 'github' | 'facebook' | 'microsoft'
  name: string
  icon: string
  color: string
}

// Form validation types
export interface FormErrors {
  [key: string]: string | undefined
}

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  match?: string // Field name to match (for password confirmation)
  custom?: (value: unknown) => string | undefined
}

export interface ValidationRules {
  [key: string]: ValidationRule
}
