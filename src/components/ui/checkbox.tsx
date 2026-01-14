import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          ref={ref}
          type="checkbox"
          className={`
            mt-0.5 w-4 h-4
            rounded border-neutral-300
            text-neutral-900
            focus:ring-neutral-900 focus:ring-offset-0
            cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {label && (
          <span className="text-sm text-neutral-500">{label}</span>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
