import { Component } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { theme } from '../styles/utils'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.xl,
          backgroundColor: theme.colors.background
        }}>
          <Card padding="xl" style={{ maxWidth: '600px', width: '100%' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: theme.spacing.lg
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: theme.borderRadius.full,
                backgroundColor: theme.colors.error + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={32} color={theme.colors.error} />
              </div>

              <div>
                <h1 style={{
                  fontSize: theme.typography.fontSize['2xl'],
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.sm
                }}>
                  오류가 발생했습니다
                </h1>
                <p style={{
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.md
                }}>
                  예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 홈으로 돌아가주세요.
                </p>
                {this.state.error && (
                  <details style={{
                    marginTop: theme.spacing.md,
                    padding: theme.spacing.md,
                    backgroundColor: theme.colors.surfaceVariant,
                    borderRadius: theme.borderRadius.md,
                    textAlign: 'left',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary
                  }}>
                    <summary style={{ cursor: 'pointer', marginBottom: theme.spacing.xs }}>
                      오류 상세 정보
                    </summary>
                    <pre style={{
                      marginTop: theme.spacing.sm,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.text.tertiary
                    }}>
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: theme.spacing.md,
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <Button
                  variant="primary"
                  onClick={this.handleReset}
                  style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}
                >
                  <RefreshCw size={18} />
                  다시 시도
                </Button>
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}
                >
                  <Home size={18} />
                  홈으로
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

