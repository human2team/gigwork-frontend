import { useState } from 'react'
import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { theme, mergeStyles } from '../../styles/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const baseStyle: React.CSSProperties = {
    padding: size === 'sm' ? '8px 16px' : size === 'lg' ? '16px 32px' : '12px 24px',
    borderRadius: theme.borderRadius.md,
    fontSize: size === 'sm' ? theme.typography.fontSize.sm : size === 'lg' ? theme.typography.fontSize.lg : theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: `all ${theme.transitions.normal}`,
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
    ...style
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: isHovered && !disabled ? theme.colors.primaryDark : theme.colors.primary,
      color: theme.colors.text.inverse
    },
    secondary: {
      backgroundColor: isHovered && !disabled ? theme.colors.secondaryDark : theme.colors.secondary,
      color: theme.colors.text.inverse
    },
    outline: {
      backgroundColor: isHovered && !disabled ? theme.colors.surfaceVariant : 'transparent',
      border: `1px solid ${theme.colors.border.default}`,
      color: theme.colors.text.primary
    },
    danger: {
      backgroundColor: isHovered && !disabled ? theme.colors.errorDark : theme.colors.error,
      color: theme.colors.text.inverse
    }
  }

  return (
    <button
      style={mergeStyles(baseStyle, variantStyles[variant])}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

