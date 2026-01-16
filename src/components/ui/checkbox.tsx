'use client'

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
}

// Standalone checkbox visual (for use inside custom labels)
export function CheckboxIcon({ checked, disabled }: { checked?: boolean; disabled?: boolean }) {
  return (
    <div className={`
      w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center
      ${checked
        ? 'bg-blue-500 border-blue-500'
        : 'bg-white border-neutral-300'
      }
      ${disabled ? 'opacity-50' : ''}
    `}>
      {checked && (
        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  )
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', checked, ...props }, ref) => {
    return (
      <label className="flex items-start gap-3 cursor-pointer">
        <div className="relative mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            className="sr-only"
            {...props}
          />
          <CheckboxIcon checked={checked} disabled={props.disabled} />
        </div>
        {label && (
          <span className="text-sm text-neutral-500">{label}</span>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
