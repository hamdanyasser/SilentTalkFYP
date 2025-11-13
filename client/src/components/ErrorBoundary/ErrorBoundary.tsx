/**
 * Error Boundary Component
 *
 * Catches React errors and logs them with correlation context.
 * Provides fallback UI for error states.
 */

import { Component, ErrorInfo, ReactNode } from 'react'
import { logger } from '../../services/loggerService'
import './ErrorBoundary.css'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  correlationId?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Start error context
    const context = logger.startContext({
      component: errorInfo.componentStack,
    })

    // Log error with correlation ID
    logger.fatal('React Error Boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    })

    // Update state with correlation ID
    this.setState({
      errorInfo,
      correlationId: context.correlationId,
    })

    logger.endContext()

    // Call optional error callback
    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      correlationId: undefined,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary__container">
            <div className="error-boundary__icon" aria-hidden="true">
              ⚠️
            </div>
            <h1 className="error-boundary__title">Something went wrong</h1>
            <p className="error-boundary__message">
              We&apos;re sorry, but something unexpected happened. The error has been logged and our
              team will investigate.
            </p>

            {this.state.correlationId && (
              <div className="error-boundary__correlation">
                <strong>Error ID:</strong> {this.state.correlationId}
              </div>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-boundary__details">
                <summary className="error-boundary__details-summary">Error Details</summary>
                <div className="error-boundary__error-message">{this.state.error.message}</div>
                {this.state.error.stack && (
                  <pre className="error-boundary__stack">{this.state.error.stack}</pre>
                )}
                {this.state.errorInfo?.componentStack && (
                  <pre className="error-boundary__component-stack">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div className="error-boundary__actions">
              <button
                type="button"
                className="error-boundary__button error-boundary__button--primary"
                onClick={this.handleReset}
              >
                Try Again
              </button>
              <button
                type="button"
                className="error-boundary__button error-boundary__button--secondary"
                onClick={() => (window.location.href = '/')}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
