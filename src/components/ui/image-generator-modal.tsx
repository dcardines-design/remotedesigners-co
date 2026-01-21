'use client'

import { useState, useEffect } from 'react'
import { Input, Button } from '@/components/ui'

interface ImageGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  slug: string
  onGenerate: (style: string) => void
  isGenerating: boolean
}

const IMAGE_STYLES = [
  {
    id: 'dreamy',
    name: 'Dreamy',
    description: 'Soft anime watercolor, pastel colors, ethereal',
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Bold colors, energetic, dynamic composition',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple shapes, lots of whitespace, clean',
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Lush landscapes, organic forms, serene',
  },
]

export function ImageGeneratorModal({
  isOpen,
  onClose,
  slug,
  onGenerate,
  isGenerating,
}: ImageGeneratorModalProps) {
  const [password, setPassword] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('dreamy')

  const isPasswordCorrect = password === '1011'

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPassword('')
      setSelectedStyle('dreamy')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-medium text-neutral-900 tracking-tight">Generate Image</h2>
          <p className="mt-2 text-neutral-500">Create a new featured image for this post</p>
        </div>

        {/* Password Input */}
        <div className="mb-6">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>

        {/* Style Tabs */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Image Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {IMAGE_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`
                  p-3 rounded-lg border text-left transition-all
                  ${selectedStyle === style.id
                    ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                    : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                  }
                `}
              >
                <div className="font-medium text-sm text-neutral-900">{style.name}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{style.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!isPasswordCorrect || isGenerating}
          onClick={() => onGenerate(selectedStyle)}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </span>
          ) : (
            'Generate'
          )}
        </Button>

        {!isPasswordCorrect && password.length > 0 && (
          <p className="mt-3 text-sm text-red-500 text-center">Incorrect password</p>
        )}
      </div>
    </div>
  )
}
