import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type PhysioInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon?: React.ReactNode
  error?: string
  showPasswordToggle?: boolean
}

const PhysioInput = React.forwardRef<HTMLInputElement, PhysioInputProps>(
  ({ label, icon, error, className, id, showPasswordToggle, type, ...props }, ref) => {
    const inputId = id ?? props.name
    const errorId = error ? `${inputId}-error` : undefined
    const [visible, setVisible] = useState(false)

    const isPassword = type === 'password'
    const showToggle = showPasswordToggle && isPassword
    const resolvedType = showToggle && visible ? 'text' : type

    return (
      <label
        htmlFor={inputId}
        className="flex w-full flex-col gap-2 text-[13px] font-medium text-[color:var(--color-text-muted)]"
      >
        <span>{label}</span>
        <div
          className={`flex items-center gap-2 rounded-lg border bg-[#F8FAFB] px-3 py-2 transition ${
            error
              ? 'border-[color:var(--color-danger)] shadow-[0_0_0_3px_rgba(192,57,43,0.15)]'
              : 'border-[#E2ECEE] focus-within:border-[color:var(--color-primary-light)] focus-within:shadow-[0_0_0_3px_rgba(42,157,166,0.12)]'
          } ${className ?? ''}`}
        >
          {icon ? (
            <span className="text-[#A8C4C8]" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <input
            key={resolvedType}
            ref={ref}
            id={inputId}
            type={resolvedType}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            className="w-full bg-transparent text-sm text-[color:var(--color-text)] placeholder:text-[#B0C8CB] focus:outline-none"
            {...props}
          />
          {showToggle ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="flex cursor-pointer items-center text-[#A8C4C8] hover:text-[color:var(--color-text-muted)]"
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : null}
        </div>
        {error ? (
          <span
            id={errorId}
            className="text-xs text-[color:var(--color-danger)]"
          >
            {error}
          </span>
        ) : null}
      </label>
    )
  },
)

PhysioInput.displayName = 'PhysioInput'

export default PhysioInput
