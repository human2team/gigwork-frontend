import type { ReactNode } from 'react'
import { theme, mergeStyles } from '../../styles/utils'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
  size?: 'sm' | 'md'
  style?: React.CSSProperties
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  style
}: BadgeProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: size === 'sm' ? '4px 8px' : '6px 12px',
    borderRadius: theme.borderRadius.xl,
    fontSize: size === 'sm' ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    ...style
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: theme.colors.text.tertiary,
      color: theme.colors.text.inverse
    },
    success: {
      backgroundColor: theme.colors.success,
      color: theme.colors.text.inverse
    },
    error: {
      backgroundColor: theme.colors.error,
      color: theme.colors.text.inverse
    },
    warning: {
      backgroundColor: theme.colors.warning,
      color: theme.colors.text.inverse
    },
    info: {
      backgroundColor: theme.colors.info,
      color: theme.colors.text.inverse
    }
  }

  return (
    <span style={mergeStyles(baseStyle, variantStyles[variant])}>
      {children}
    </span>
  )
}

