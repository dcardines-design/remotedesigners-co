'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import { Button, RainbowButton, PersonalizedAlertsModal } from '@/components/ui'
import { Bell, ArrowUpRight } from 'lucide-react'
import { useSignupModal } from '@/context/signup-modal-context'
import { isCompMember } from '@/lib/admin'

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
          <div className="absolute right-0 mt-1 w-full min-w-[180px] bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] z-20 overflow-hidden">
            <Link
              href="/saved-jobs"
              onClick={() => setOpen(false)}
              className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Saved Jobs
            </Link>
            <Link
              href="/posted-jobs"
              onClick={() => setOpen(false)}
              className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Jobs Posted
            </Link>
            <a
              href={billingUrl || '/api/stripe/portal'}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Manage Billing
              <ArrowUpRight className="w-4 h-4 text-neutral-400" />
            </a>
            <div className="border-t border-neutral-100" />
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
  const [alertsModalOpen, setAlertsModalOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { openSignupModal, openLoginModal } = useSignupModal()
  const isHomePage = pathname === '/'
  const isSEOPage = pathname?.startsWith('/remote-')
  const isPremiumPage = pathname === '/membership'

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

      // Comp member bypass - auto-subscribe complimentary members
      if (isCompMember(user.email)) {
        setHasSubscription(true)
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
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="font-medium text-neutral-900 text-lg tracking-tight">
            remotedesigners.co
          </Link>

          <div className="flex items-center gap-3">
            {!user && (
              <Button onClick={openLoginModal} variant="secondary" size="sm">
                Log in
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => window.location.href = '/post-job'}>
              Post a job
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAlertsModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Job Alerts</span>
            </Button>
            {user && (
              <UserDropdown
                email={user.email || ''}
                onSignOut={handleSignOut}
                hasSubscription={hasSubscription}
                billingUrl={billingUrl}
              />
            )}
            {!hasSubscription && (
              <Link
                href="/membership"
                className="relative px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-pink-700 rounded-md shadow-[0px_2px_0px_0px_#9d174d] hover:translate-y-[1px] hover:shadow-[0px_1px_0px_0px_#9d174d] active:translate-y-[2px] active:shadow-none transition-all overflow-hidden"
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
          </div>
        </div>
      </div>

      <PersonalizedAlertsModal
        isOpen={alertsModalOpen}
        onClose={() => setAlertsModalOpen(false)}
        userEmail={user?.email}
      />
    </nav>
  )
}
