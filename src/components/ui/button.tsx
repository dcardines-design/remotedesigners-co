import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  children: ReactNode
}

const variants = {
  primary: `
    text-white bg-[#2a2a2a]
    shadow-[0px_3px_0px_0px_rgba(0,0,0,0.3)]
    hover:translate-y-[1px] hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.3)]
    active:translate-y-[2px] active:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.3)]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0px_3px_0px_0px_rgba(0,0,0,0.3)]
  `,
  secondary: `
    text-neutral-900 bg-white
    border border-neutral-200
    shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)]
    hover:bg-neutral-50 hover:translate-y-[1px] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)]
    active:translate-y-[2px] active:shadow-none
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  outline: `
    text-neutral-700 bg-transparent
    border border-neutral-200
    hover:bg-neutral-50
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  ghost: `
    text-neutral-600 bg-transparent
    hover:text-neutral-900 hover:bg-neutral-100
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
}

const sizes = {
  sm: 'px-4 py-2 text-sm rounded-md',
  md: 'px-4 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2
          font-medium
          transition-all
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
