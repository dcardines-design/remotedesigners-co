'use client'

import { useState, useRef, useEffect } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
}

export function Select({ label, value, onChange, options, placeholder = 'Select...', required }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label.endsWith(' *') ? (
            <>
              {label.slice(0, -2)}
              <span className="text-red-500"> *</span>
            </>
          ) : (
            label
          )}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-neutral-200 rounded-lg px-4 py-2.5 text-sm text-left hover:border-neutral-300 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.04)] transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 flex items-center justify-between"
        >
          <span className={selectedOption ? 'text-neutral-900' : 'text-neutral-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false) }}
                className={`w-full px-4 py-2.5 text-sm text-left hover:bg-neutral-50 transition-colors ${
                  value === opt.value ? 'bg-neutral-50 text-neutral-900 font-medium' : 'text-neutral-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        {/* Hidden input for form validation */}
        {required && (
          <input
            type="text"
            value={value}
            required={required}
            onChange={() => {}}
            className="sr-only"
            tabIndex={-1}
          />
        )}
      </div>
    </div>
  )
}
