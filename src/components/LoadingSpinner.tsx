import { theme } from '../styles/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  fullScreen?: boolean
  message?: string
}

export function LoadingSpinner({
  size = 'md',
  color = theme.colors.primary,
  fullScreen = false,
  message
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: '24px',
    md: '40px',
    lg: '64px'
  }

  const spinnerSize = sizeMap[size]
  const borderWidth = size === 'sm' ? '2px' : size === 'lg' ? '4px' : '3px'

  const spinner = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md
    }}>
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `${borderWidth} solid ${color}20`,
          borderTop: `${borderWidth} solid ${color}`,
          borderRadius: theme.borderRadius.full,
          animation: 'spin 1s linear infinite'
        }}
      />
      {message && (
        <p style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          margin: 0
        }}>
          {message}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.overlay,
        zIndex: theme.zIndex.modal
      }}>
        {spinner}
      </div>
    )
  }

  return spinner
}

// CSS 애니메이션 추가를 위한 스타일 태그
const style = document.createElement('style')
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`
if (!document.head.querySelector('style[data-spinner]')) {
  style.setAttribute('data-spinner', 'true')
  document.head.appendChild(style)
}

