'use client'

import { useState, useEffect } from 'react'
import { Input, Button } from '@/components/ui'

interface ImageGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  slug: string
  onGenerate: (options: { variant: string; context: string; shot: string }) => void
  isGenerating: boolean
}

// Color/mood variants
const VARIANTS = [
  { id: 'dreamy', name: 'Dreamy', description: 'Soft & hazy, morning light' },
  { id: 'vibrant', name: 'Vibrant', description: 'Rich sunset glow' },
  { id: 'minimal', name: 'Minimal', description: 'Muted, vast spaces' },
  { id: 'nature', name: 'Nature', description: 'Lush greenery' },
]

// Context type
const CONTEXTS = [
  { id: 'contextual', name: 'Contextual', description: 'Based on blog topic' },
  { id: 'abstract', name: 'Abstract', description: 'Generic beautiful scene' },
]

// Shot styles
const SHOTS = [
  { id: 'wide', name: 'Wide', description: 'Landscape, environment focus' },
  { id: 'medium', name: 'Medium', description: 'Balanced scene' },
  { id: 'closeup', name: 'Close-up', description: 'Detail focus' },
  { id: 'portrait', name: 'Portrait', description: 'People/character focus' },
]

export function ImageGeneratorModal({
  isOpen,
  onClose,
  slug,
  onGenerate,
  isGenerating,
}: ImageGeneratorModalProps) {
  const [password, setPassword] = useState('')
  const [variant, setVariant] = useState('dreamy')
  const [context, setContext] = useState('contextual')
  const [shot, setShot] = useState('wide')

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
      setVariant('dreamy')
      setContext('contextual')
      setShot('wide')
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
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
        <div className="text-center mb-5">
          <h2 className="text-xl font-medium text-neutral-900 tracking-tight">Generate Image</h2>
          <p className="mt-1 text-sm text-neutral-500">Create a new featured image</p>
        </div>

        {/* Password Input */}
        <div className="mb-5">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>

        {/* 1. Variant Selection */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Variant
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariant(v.id)}
                className={`
                  px-2 py-1.5 rounded-md border text-center transition-all text-xs
                  ${variant === v.id
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                  }
                `}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Context Selection */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Context
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {CONTEXTS.map((c) => (
              <button
                key={c.id}
                onClick={() => setContext(c.id)}
                className={`
                  px-3 py-2 rounded-md border text-left transition-all
                  ${context === c.id
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 hover:border-neutral-300'
                  }
                `}
              >
                <div className={`font-medium text-sm ${context === c.id ? 'text-white' : 'text-neutral-900'}`}>{c.name}</div>
                <div className={`text-xs mt-0.5 ${context === c.id ? 'text-neutral-300' : 'text-neutral-500'}`}>{c.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Shot Style Selection */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Shot Style
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {SHOTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setShot(s.id)}
                className={`
                  px-2 py-1.5 rounded-md border text-center transition-all text-xs
                  ${shot === s.id
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                  }
                `}
              >
                {s.name}
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
          onClick={() => onGenerate({ variant, context, shot })}
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
