'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { SignupModal } from '@/components/ui/signup-modal'
import { LoginModal } from '@/components/ui/login-modal'

interface AuthModalContextType {
  openSignupModal: () => void
  closeSignupModal: () => void
  openLoginModal: () => void
  closeLoginModal: () => void
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function SignupModalProvider({ children }: { children: ReactNode }) {
  const [isSignupOpen, setIsSignupOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  const openSignupModal = () => {
    setIsLoginOpen(false)
    setIsSignupOpen(true)
  }
  const closeSignupModal = () => setIsSignupOpen(false)

  const openLoginModal = () => {
    setIsSignupOpen(false)
    setIsLoginOpen(true)
  }
  const closeLoginModal = () => setIsLoginOpen(false)

  const handleSwitchToSignup = () => {
    setIsLoginOpen(false)
    setIsSignupOpen(true)
  }

  const handleSwitchToLogin = () => {
    setIsSignupOpen(false)
    setIsLoginOpen(true)
  }

  return (
    <AuthModalContext.Provider value={{ openSignupModal, closeSignupModal, openLoginModal, closeLoginModal }}>
      {children}
      <SignupModal isOpen={isSignupOpen} onClose={closeSignupModal} onSwitchToLogin={handleSwitchToLogin} />
      <LoginModal isOpen={isLoginOpen} onClose={closeLoginModal} onSwitchToSignup={handleSwitchToSignup} />
    </AuthModalContext.Provider>
  )
}

export function useSignupModal() {
  const context = useContext(AuthModalContext)
  if (!context) {
    throw new Error('useSignupModal must be used within SignupModalProvider')
  }
  return context
}
