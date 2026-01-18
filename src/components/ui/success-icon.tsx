interface SuccessIconProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6',
  },
  md: {
    container: 'w-16 h-16',
    icon: 'w-8 h-8',
  },
  lg: {
    container: 'w-20 h-20',
    icon: 'w-10 h-10',
  },
}

export function SuccessIcon({ size = 'lg', className = '' }: SuccessIconProps) {
  const { container, icon } = sizeClasses[size]

  return (
    <div className={`${container} rounded-full bg-green-600 flex items-center justify-center ${className}`}>
      <svg className={`${icon} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
}
