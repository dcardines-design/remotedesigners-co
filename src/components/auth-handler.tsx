'use client'

import { useEffect } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

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
            // Store flag for welcome modal after reload
            sessionStorage.setItem('show_welcome_modal', 'true')
            // Redirect to home with welcome param to trigger modal
            window.location.href = '/?welcome=true'
          }
        })
      }
    }

    // Clean up welcome modal flag (modal is triggered by URL param)
    if (sessionStorage.getItem('show_welcome_modal')) {
      sessionStorage.removeItem('show_welcome_modal')
    }
  }, [])

  return null
}
