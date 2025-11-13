import type { ReactNode } from 'react'
import { theme, mergeStyles } from '../../styles/utils'

interface CardProps {
  children: ReactNode
  padding?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'outlined' | 'elevated'
  style?: React.CSSProperties
  onClick?: () => void
}

export function Card({
  children,
  padding = 'lg',
  variant = 'default',
  style,
  onClick
}: CardProps) {
  const paddingMap = {
    sm: theme.spacing.sm,
    md: theme.spacing.md,
    lg: theme.spacing.lg,
    xl: theme.spacing.xl
  }

  const baseStyle: React.CSSProperties = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: paddingMap[padding],
    transition: `all ${theme.transitions.normal}`,
    cursor: onClick ? 'pointer' : 'default',
    ...style
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      border: `1px solid ${theme.colors.border.default}`,
      boxShadow: theme.shadows.md
    },
    outlined: {
      border: `1px solid ${theme.colors.border.default}`,
      boxShadow: 'none'
    },
    elevated: {
      border: 'none',
      boxShadow: theme.shadows.lg
    }
  }

  return (
    <div
      style={mergeStyles(baseStyle, variantStyles[variant])}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

