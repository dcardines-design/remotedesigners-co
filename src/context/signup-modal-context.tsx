'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { SignupModal } from '@/components/ui/signup-modal'

interface SignupModalContextType {
  openSignupModal: () => void
  closeSignupModal: () => void
}

const SignupModalContext = createContext<SignupModalContextType | undefined>(undefined)

export function SignupModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openSignupModal = () => setIsOpen(true)
  const closeSignupModal = () => setIsOpen(false)

  return (
    <SignupModalContext.Provider value={{ openSignupModal, closeSignupModal }}>
      {children}
      <SignupModal isOpen={isOpen} onClose={closeSignupModal} />
    </SignupModalContext.Provider>
  )
}

export function useSignupModal() {
  const context = useContext(SignupModalContext)
  if (!context) {
    throw new Error('useSignupModal must be used within SignupModalProvider')
  }
  return context
}
