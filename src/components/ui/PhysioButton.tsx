import React from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

type PhysioButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[color:var(--color-primary)] text-white shadow-[0_10px_20px_-12px_rgba(14,74,80,0.7)] hover:bg-[color:var(--color-primary-dark)]',
  secondary:
    'bg-[color:var(--color-surface)] text-[color:var(--color-primary)] border border-[color:var(--color-border)] hover:border-[color:var(--color-primary-light)]',
  ghost:
    'bg-transparent text-[color:var(--color-text-muted)] hover:text-[color:var(--color-primary)]',
  danger:
    'bg-[color:var(--color-danger)] text-white hover:bg-[#a93226]',
}

const sizeStyles = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
}

const PhysioButton = React.forwardRef<HTMLButtonElement, PhysioButtonProps>(
  ({
    variant,
    size = 'md',
    loading = false,
    fullWidth = false,
    className,
    disabled,
    children,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition duration-200 ease-out active:translate-y-0 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary-light)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-70 ${
          variantStyles[variant]
        } ${sizeStyles[size]} ${
          fullWidth ? 'w-full' : ''
        } ${className ?? ''}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? null : children}
      </button>
    )
  },
)

PhysioButton.displayName = 'PhysioButton'

export default PhysioButton
