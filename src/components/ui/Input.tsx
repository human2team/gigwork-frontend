import { forwardRef, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { theme } from '../../styles/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, fullWidth = true, style, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    const baseStyle: React.CSSProperties = {
      width: fullWidth ? '100%' : 'auto',
      padding: theme.spacing.md,
      border: `1px solid ${
        isFocused
          ? error
            ? theme.colors.error
            : theme.colors.primary
          : error
          ? theme.colors.error
          : theme.colors.border.default
      }`,
      borderRadius: theme.borderRadius.md,
      fontSize: theme.typography.fontSize.base,
      fontFamily: theme.typography.fontFamily,
      transition: `border-color ${theme.transitions.normal}`,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text.primary,
      outline: 'none',
      ...style
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    return (
      <input
        ref={ref}
        style={baseStyle}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

