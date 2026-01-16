'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import { Button, RainbowButton } from '@/components/ui'
import { useSignupModal } from '@/context/signup-modal-context'

function UserDropdown({ email, onSignOut, hasSubscription, billingUrl }: {
  email: string
  onSignOut: () => void
  hasSubscription: boolean
  billingUrl: string | null
}) {
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
          <div className="absolute right-0 mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] z-20 overflow-hidden">
            {billingUrl && (
              <a
                href={billingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Manage Billing
              </a>
            )}
            <button
              onClick={() => {
                setOpen(false)
                onSignOut()
              }}
              className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
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
  const [savedCount, setSavedCount] = useState(0)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [billingUrl, setBillingUrl] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { openSignupModal, openLoginModal } = useSignupModal()
  const isHomePage = pathname === '/'
  const isSEOPage = pathname?.startsWith('/remote-')
  const isPremiumPage = pathname === '/premium'

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

  // Fetch saved jobs count
  useEffect(() => {
    const fetchSavedCount = async () => {
      if (!user) {
        setSavedCount(0)
        return
      }
      const supabase = createBrowserSupabaseClient()
      const { count } = await supabase
        .from('saved_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setSavedCount(count || 0)
    }
    fetchSavedCount()

    // Listen for saved jobs changes
    const handleSavedJobsChange = () => fetchSavedCount()
    window.addEventListener('saved-jobs-changed', handleSavedJobsChange)
    return () => window.removeEventListener('saved-jobs-changed', handleSavedJobsChange)
  }, [user])

  // Fetch subscription status
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setHasSubscription(false)
        setBillingUrl(null)
        return
      }
      const supabase = createBrowserSupabaseClient()
      const { data } = await supabase
        .from('subscriptions')
        .select('status, customer_portal_url')
        .eq('user_id', user.id)
        .single()

      if (data && data.status === 'active') {
        setHasSubscription(true)
        setBillingUrl(data.customer_portal_url)
      } else {
        setHasSubscription(false)
        setBillingUrl(null)
      }
    }
    fetchSubscription()
  }, [user])

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  const isTransparent = (isHomePage || isSEOPage || isPremiumPage) && !scrolled

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
              <>
                <Link
                  href="/saved-jobs"
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all"
                >
                  Saved Jobs{savedCount > 0 && ` (${savedCount})`}
                </Link>
                <Link
                  href="/posted-jobs"
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all"
                >
                  Jobs Posted
                </Link>
                <UserDropdown
                  email={user.email || ''}
                  onSignOut={handleSignOut}
                  hasSubscription={hasSubscription}
                  billingUrl={billingUrl}
                />
                <Button variant="secondary" size="sm" onClick={() => window.location.href = '/post-job'}>
                  Post a job
                </Button>
              </>
            ) : (
              <>
                <Button onClick={openLoginModal} variant="ghost" size="sm">
                  Log in
                </Button>
                <Button onClick={openSignupModal} variant="secondary" size="sm">
                  Sign up
                </Button>
                <Button variant="secondary" size="sm" onClick={() => window.location.href = '/post-job'}>
                  Post a job
                </Button>
              </>
            )}
            {!hasSubscription && (
              <Link
                href="/premium"
                className="relative px-3 py-2 text-sm font-medium text-white bg-violet-600 border border-violet-700 rounded-lg shadow-[0px_2px_0px_0px_#8b5cf6] hover:translate-y-[1px] hover:shadow-[0px_1px_0px_0px_#8b5cf6] active:translate-y-[2px] active:shadow-none transition-all overflow-hidden"
              >
                <span
                  className="absolute animate-get-pro-shine"
                  style={{
                    inset: '-100%',
                    width: '300%',
                    backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0.2) 45%, transparent 45%, transparent 47%, rgba(255,255,255,0.15) 47%, rgba(255,255,255,0.15) 48%, transparent 48%)',
                  }}
                />
                <span className="relative z-10">Get Membership</span>
              </Link>
            )}
            <style jsx global>{`
              @keyframes get-pro-shine {
                0% { transform: translateX(-50%); }
                30% { transform: translateX(50%); }
                100% { transform: translateX(50%); }
              }
              .animate-get-pro-shine {
                animation: get-pro-shine 3.5s ease-out infinite;
              }
            `}</style>
          </div>
        </div>
      </div>
    </nav>
  )
}
