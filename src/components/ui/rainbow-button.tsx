import Link from 'next/link'

interface RainbowButtonProps {
  href?: string
  children: React.ReactNode
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'px-5 py-2 text-sm rounded-[6px]',
  md: 'px-6 py-3 rounded-[6.5px]',
  lg: 'px-8 py-3.5 rounded-[6.5px]',
}

const wrapperSizeClasses = {
  sm: 'rounded-[7px] shadow-[0px_3px_0px_0px_rgba(0,0,0,0.3),0px_1px_2px_0px_rgba(0,0,0,0.1)] hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.3),0px_1px_2px_0px_rgba(0,0,0,0.1)] active:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.3)]',
  md: 'rounded-[7.5px] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.3),0px_1px_2px_0px_rgba(0,0,0,0.1)] hover:shadow-[0px_3px_0px_0px_rgba(0,0,0,0.3),0px_1px_2px_0px_rgba(0,0,0,0.1)] active:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.3)]',
  lg: 'rounded-[7.5px] shadow-[0px_4px_0px_0px_rgba(0,0,0,0.3),0px_1px_2px_0px_rgba(0,0,0,0.1)] hover:shadow-[0px_3px_0px_0px_rgba(0,0,0,0.3),0px_1px_2px_0px_rgba(0,0,0,0.1)] active:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.3)]',
}

export function RainbowButton({
  href,
  children,
  type = 'button',
  disabled = false,
  onClick,
  fullWidth = false,
  size = 'lg',
  className = ''
}: RainbowButtonProps) {
  const wrapperClasses = `btn-rainbow-wrapper inline-block p-[1px] ${wrapperSizeClasses[size]} hover:translate-y-[1px] active:translate-y-[2px] transition-all ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`

  const innerClasses = `btn-rainbow-inner inline-flex items-center justify-center gap-2 ${sizeClasses[size]} text-white font-medium ${fullWidth ? 'w-full' : ''}`

  if (href) {
    return (
      <div className={wrapperClasses}>
        <Link href={href} className={innerClasses}>
          {children}
        </Link>
      </div>
    )
  }

  return (
    <div className={wrapperClasses}>
      <button type={type} disabled={disabled} onClick={onClick} className={innerClasses}>
        {children}
      </button>
    </div>
  )
}
