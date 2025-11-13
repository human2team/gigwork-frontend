import { AlertCircle, X } from 'lucide-react'
import { theme } from '../styles/utils'
import { Card } from './ui/Card'
import { Button } from './ui/Button'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  variant?: 'error' | 'warning' | 'info'
  fullWidth?: boolean
}

export function ErrorMessage({
  title = '오류가 발생했습니다',
  message,
  onRetry,
  onDismiss,
  variant = 'error',
  fullWidth = false
}: ErrorMessageProps) {
  const variantStyles = {
    error: {
      backgroundColor: theme.colors.error + '10',
      borderColor: theme.colors.error,
      iconColor: theme.colors.error
    },
    warning: {
      backgroundColor: theme.colors.warning + '10',
      borderColor: theme.colors.warning,
      iconColor: theme.colors.warning
    },
    info: {
      backgroundColor: theme.colors.info + '10',
      borderColor: theme.colors.info,
      iconColor: theme.colors.info
    }
  }

  const style = variantStyles[variant]

  return (
    <Card
      padding="lg"
      variant="outlined"
      style={{
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        borderWidth: '2px',
        width: fullWidth ? '100%' : 'auto'
      }}
    >
      <div style={{ display: 'flex', gap: theme.spacing.md }}>
        <div style={{ flexShrink: 0 }}>
          <AlertCircle size={20} color={style.iconColor} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.xs
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            marginBottom: onRetry || onDismiss ? theme.spacing.md : 0
          }}>
            {message}
          </p>
          {(onRetry || onDismiss) && (
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              {onRetry && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onRetry}
                >
                  다시 시도
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDismiss}
                >
                  닫기
                </Button>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: theme.spacing.xs,
              display: 'flex',
              alignItems: 'center',
              color: theme.colors.text.tertiary
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>
    </Card>
  )
}

