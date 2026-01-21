'use client'

import { useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'

export function AuthHandler() {
  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    // Check if there's a hash with tokens (magic link)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        // Set the session from the tokens
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ error }) => {
          if (!error) {
            // Clean up the URL hash
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
            // Store flag for toast after reload
            sessionStorage.setItem('show_welcome_toast', 'true')
            // Reload to update the UI
            window.location.reload()
          }
        })
      }
    }

    // Show welcome toast after reload (new subscriber logged in via magic link)
    if (sessionStorage.getItem('show_welcome_toast')) {
      sessionStorage.removeItem('show_welcome_toast')
      setTimeout(() => {
        toast.success('Welcome! You\'re all set 🎉')
      }, 100)
    }

    // Show toast for logged-in user who just subscribed
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('subscribed') === 'true') {
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname)
        setTimeout(() => {
          toast.success('Thanks for subscribing! 🎉')
        }, 100)
      }
    }
  }, [])

  return null
}
