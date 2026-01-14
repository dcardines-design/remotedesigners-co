'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import { RainbowButton } from '@/components/ui'
import { useSignupModal } from '@/context/signup-modal-context'

function UserDropdown({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-900 bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[1px] transition-all"
      >
        <span className="max-w-[160px] truncate">{email}</span>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] z-20">
            <Link
              href="/saved-jobs"
              onClick={() => setOpen(false)}
              className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors rounded-lg"
            >
              Saved Jobs
            </Link>
            <button
              onClick={() => {
                setOpen(false)
                onSignOut()
              }}
              className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors rounded-lg"
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { openSignupModal } = useSignupModal()
  const isHomePage = pathname === '/'
  const isSEOPage = pathname?.startsWith('/remote-')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  const isTransparent = (isHomePage || isSEOPage) && !scrolled

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-150 border-b ${
        isTransparent
          ? 'border-transparent'
          : 'border-neutral-200'
      }`}
      style={{ backgroundColor: isTransparent ? 'rgba(250,250,250,0)' : 'rgba(250,250,250,1)' }}
    >
      <div className="max-w-6xl mx-auto px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="font-medium text-neutral-900 text-lg tracking-tight">
            remotedesigners.co
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <UserDropdown email={user.email || ''} onSignOut={handleSignOut} />
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Log in
                </Link>
                <RainbowButton onClick={openSignupModal} size="sm">
                  Sign up
                </RainbowButton>
              </>
            )}
            <RainbowButton href="/post-job" size="sm">
              Post a job
            </RainbowButton>
          </div>
        </div>
      </div>
    </nav>
  )
}
