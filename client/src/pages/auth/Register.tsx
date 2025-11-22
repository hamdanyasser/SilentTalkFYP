import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, Stack } from '../../design-system'
import { register } from '../../services/authService'
import {
  validateForm,
  hasErrors,
  commonValidationRules,
  getPasswordStrength,
} from '../../utils/validation'
import { FormErrors, RegisterRequest } from '../../types/auth'
import './Auth.css'

export const Register: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const passwordStrength = getPasswordStrength(formData.password)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }

    // Clear server error when user types
    if (serverError) {
      setServerError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const validationErrors = validateForm(
      formData,
      {
        email: commonValidationRules.email,
        username: commonValidationRules.username,
        password: commonValidationRules.password,
        confirmPassword: commonValidationRules.confirmPassword,
        firstName: commonValidationRules.firstName,
        lastName: commonValidationRules.lastName,
      },
    )

    if (hasErrors(validationErrors)) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    setServerError(null)

    try {
      const response = await register(formData)

      if (response.success) {
        setSuccessMessage(response.message)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { state: { email: formData.email } })
        }, 3000)
      } else {
        setServerError(response.message)
      }
    } catch (error) {
      setServerError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (successMessage) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-success">
              <div className="auth-success-icon">✓</div>
              <h2>Registration Successful!</h2>
              <p>{successMessage}</p>
              <p className="text-secondary">Redirecting to login page...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Join SilentTalk to connect with the deaf and hard-of-hearing community</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {serverError && (
              <div className="auth-alert auth-alert--error" role="alert">
                {serverError}
              </div>
            )}

            <Stack gap={4}>
              {/* Email */}
              <div className="form-field">
                <label htmlFor="email" className="form-label">
                  Email Address <span className="text-error">*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  hasError={!!errors.email}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  placeholder="you@example.com"
                  autoComplete="email"
                  fullWidth
                />
                {errors.email && (
                  <div id="email-error" className="form-error" role="alert">
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Username */}
              <div className="form-field">
                <label htmlFor="username" className="form-label">
                  Username <span className="text-error">*</span>
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  hasError={!!errors.username}
                  aria-invalid={!!errors.username}
                  aria-describedby={errors.username ? 'username-error' : undefined}
                  placeholder="johndoe"
                  autoComplete="username"
                  fullWidth
                />
                {errors.username && (
                  <div id="username-error" className="form-error" role="alert">
                    {errors.username}
                  </div>
                )}
                <div className="form-hint">
                  3-20 characters, letters, numbers, underscores, and hyphens
                </div>
              </div>

              {/* First Name & Last Name */}
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="firstName" className="form-label">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName || ''}
                    onChange={handleChange}
                    hasError={!!errors.firstName}
                    placeholder="John"
                    autoComplete="given-name"
                    fullWidth
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="lastName" className="form-label">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName || ''}
                    onChange={handleChange}
                    hasError={!!errors.lastName}
                    placeholder="Doe"
                    autoComplete="family-name"
                    fullWidth
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-field">
                <label htmlFor="password" className="form-label">
                  Password <span className="text-error">*</span>
                </label>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  hasError={!!errors.password}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : 'password-strength'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  fullWidth
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  }
                />
                {errors.password && (
                  <div id="password-error" className="form-error" role="alert">
                    {errors.password}
                  </div>
                )}
                {formData.password && (
                  <div id="password-strength" className="password-strength">
                    <div className="password-strength-bar">
                      <div
                        className="password-strength-fill"
                        style={{
                          width: `${(passwordStrength.score / 4) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        }}
                      />
                    </div>
                    <span style={{ color: passwordStrength.color }}>
                      {passwordStrength.label.charAt(0).toUpperCase() +
                        passwordStrength.label.slice(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-field">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password <span className="text-error">*</span>
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  hasError={!!errors.confirmPassword}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  fullWidth
                />
                {errors.confirmPassword && (
                  <div id="confirmPassword-error" className="form-error" role="alert">
                    {errors.confirmPassword}
                  </div>
                )}
              </div>

              {/* Terms acceptance */}
              <div className="form-terms">
                <p>
                  By creating an account, you agree to our <Link to="/terms">Terms of Service</Link>{' '}
                  and <Link to="/privacy">Privacy Policy</Link>.
                </p>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                loadingText="Creating account..."
              >
                Create Account
              </Button>
            </Stack>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
