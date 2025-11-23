import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types/auth'
import * as authService from '../services/authService'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken')
        if (accessToken) {
          const currentUser = await authService.getCurrentUser()
          if (currentUser) {
            setUser(currentUser)
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password })

      if (response.success && response.accessToken && response.user) {
        // Store tokens
        localStorage.setItem('accessToken', response.accessToken)
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken)
        }

        // Update user state
        setUser(response.user)

        return { success: true }
      } else {
        return { success: false, message: response.message || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'An unexpected error occurred' }
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData })
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
