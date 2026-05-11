import React from 'react'

type PhysioInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon?: React.ReactNode
  error?: string
}

const PhysioInput = React.forwardRef<HTMLInputElement, PhysioInputProps>(
  ({ label, icon, error, className, id, ...props }, ref) => {
    const inputId = id ?? props.name
    const errorId = error ? `${inputId}-error` : undefined

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
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            className="w-full bg-transparent text-sm text-[color:var(--color-text)] placeholder:text-[#B0C8CB] focus:outline-none"
            {...props}
          />
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
