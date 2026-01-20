'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import { Button, RainbowButton, PersonalizedAlertsModal } from '@/components/ui'
import { Bell, ArrowUpRight, Menu, X, Briefcase, LogIn, Bookmark, FileText, LogOut, Sparkles } from 'lucide-react'
import { useSignupModal } from '@/context/signup-modal-context'
import { isCompMember } from '@/lib/admin'

function UserDropdown({ email, onSignOut, showBilling, billingUrl, isMember }: {
  email: string
  onSignOut: () => void
  showBilling: boolean
  billingUrl: string | null
  isMember: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-900 bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[1px] transition-all"
      >
        <span className="max-w-[160px] truncate">{email}</span>
        {isMember && (
          <span className="relative inline-flex items-center bg-pink-600 text-white text-[8px] font-medium tracking-wider px-1.5 py-0 rounded overflow-hidden">
            <span
              className="absolute animate-get-pro-shine"
              style={{
                inset: '-100%',
                width: '300%',
                backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.3) 45%, transparent 45%, transparent 47%, rgba(255,255,255,0.2) 47%, rgba(255,255,255,0.2) 48%, transparent 48%)',
              }}
            />
            <span className="relative">MEMBER</span>
          </span>
        )}
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
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Bookmark className="w-4 h-4 text-neutral-400" />
              Saved Jobs
            </Link>
            <Link
              href="/dashboard/alerts"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Bell className="w-4 h-4 text-neutral-400" />
              My Job Alerts
            </Link>
            <Link
              href="/posted-jobs"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <FileText className="w-4 h-4 text-neutral-400" />
              Jobs Posted
            </Link>
            {showBilling && (
              <a
                href={billingUrl || '/api/stripe/portal'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Manage Billing
                <ArrowUpRight className="w-4 h-4 text-neutral-400" />
              </a>
            )}
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
  const [authLoaded, setAuthLoaded] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null) // null = loading
  const [showBilling, setShowBilling] = useState(false)
  const [billingUrl, setBillingUrl] = useState<string | null>(null)
  const [alertsModalOpen, setAlertsModalOpen] = useState(false)
  const [existingAlertPreferences, setExistingAlertPreferences] = useState<{ jobTypes?: string[]; locations?: string[] } | undefined>(undefined)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { openSignupModal, openLoginModal } = useSignupModal()
  const isHomePage = pathname === '/'
  const isSEOPage = pathname?.startsWith('/remote-')
  const isPremiumPage = pathname === '/membership'
  const isSuccessPage = pathname === '/post-job/success'
  const isUnsubscribePage = pathname === '/unsubscribe'
  const isBlogPage = pathname === '/blog'
  const [isTransparentNavbarPage, setIsTransparentNavbarPage] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Check for transparent-navbar-page class on body (set by 404 and other pages)
  useEffect(() => {
    const checkBodyClass = () => {
      setIsTransparentNavbarPage(document.body.classList.contains('transparent-navbar-page'))
    }
    checkBodyClass()

    // Use MutationObserver to detect class changes
    const observer = new MutationObserver(checkBodyClass)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setAuthLoaded(true)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoaded(true)
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
        setShowBilling(false)
        setBillingUrl(null)
        return
      }

      // Set to null (loading) while we check
      setHasSubscription(null)

      // Comp member bypass - auto-subscribe complimentary members (no billing)
      if (isCompMember(user.email)) {
        setHasSubscription(true)
        setShowBilling(false)
        setBillingUrl(null)
        return
      }

      const supabase = createBrowserSupabaseClient()
      const { data } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single()

      if (data && data.status === 'active') {
        setHasSubscription(true)
        setShowBilling(true)
        setBillingUrl(null) // Portal URL fetched on demand via /api/stripe/portal
      } else {
        setHasSubscription(false)
        setShowBilling(false)
        setBillingUrl(null)
      }
    }
    fetchSubscription()
  }, [user])

  // Fetch existing alert preferences when modal opens
  useEffect(() => {
    const fetchAlertPreferences = async () => {
      if (!alertsModalOpen || !user) {
        return
      }

      try {
        const res = await fetch('/api/alerts')
        if (res.ok) {
          const data = await res.json()
          if (data.alert?.preferences) {
            setExistingAlertPreferences(data.alert.preferences)
          } else {
            setExistingAlertPreferences(undefined)
          }
        }
      } catch (error) {
        console.error('Failed to fetch alert preferences:', error)
      }
    }
    fetchAlertPreferences()
  }, [alertsModalOpen, user])

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const isTransparent = (isHomePage || isSEOPage || isPremiumPage || isSuccessPage || isUnsubscribePage || isBlogPage || isTransparentNavbarPage) && !scrolled && !mobileMenuOpen

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
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="RemoteDesigners.co"
              width={200}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            {!user && (
              <Button onClick={openLoginModal} variant="ghost" size="sm">
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
              <span>Job Alerts</span>
            </Button>
            {user && (
              <UserDropdown
                email={user.email || ''}
                onSignOut={handleSignOut}
                showBilling={showBilling}
                billingUrl={billingUrl}
                isMember={hasSubscription === true}
              />
            )}
            {authLoaded && hasSubscription === false && (
              <Link
                href="/membership"
                className="relative px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-pink-700 rounded-lg shadow-[0px_2px_0px_0px_#9d174d] hover:translate-y-[1px] hover:shadow-[0px_1px_0px_0px_#9d174d] active:translate-y-[2px] active:shadow-none transition-all overflow-hidden"
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

          {/* Mobile buttons */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setAlertsModalOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-neutral-200 bg-white shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)]"
            >
              <Bell className="w-5 h-5 text-neutral-600" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-neutral-200 bg-white shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay - starts below navbar */}
          <div
            className="md:hidden fixed inset-x-0 top-16 bottom-0 bg-black/20 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="md:hidden fixed top-16 left-0 right-0 bottom-0 bg-neutral-50 z-50 animate-fade-in flex flex-col">
            {/* Top: User email status */}
            {user && (
              <div className="px-4 pt-4">
                <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-neutral-900 bg-neutral-100 border border-neutral-200 rounded-lg">
                  <span className="truncate">{user.email}</span>
                  {hasSubscription === true && (
                    <span className="relative inline-flex items-center bg-pink-600 text-white text-[8px] font-medium tracking-wider px-1.5 py-0 rounded overflow-hidden flex-shrink-0">
                      <span
                        className="absolute animate-get-pro-shine"
                        style={{
                          inset: '-100%',
                          width: '300%',
                          backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.3) 45%, transparent 45%, transparent 47%, rgba(255,255,255,0.2) 47%, rgba(255,255,255,0.2) 48%, transparent 48%)',
                        }}
                      />
                      <span className="relative">MEMBER</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Bottom: All action buttons */}
            <div className="mt-auto px-4 pb-8 space-y-3">
              <Link
                href="/post-job"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <Briefcase className="w-4 h-4 text-neutral-400" />
                Post a job
              </Link>
              {!user && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    openLoginModal()
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-neutral-400" />
                  Log in
                </button>
              )}
              {user && (
                <>
                  <Link
                    href="/saved-jobs"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <Bookmark className="w-4 h-4 text-neutral-400" />
                    Saved Jobs
                  </Link>
                  <Link
                    href="/dashboard/alerts"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <Bell className="w-4 h-4 text-neutral-400" />
                    My Job Alerts
                  </Link>
                  <Link
                    href="/posted-jobs"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] active:translate-y-[1px] active:shadow-none transition-all"
                  >
                    <FileText className="w-4 h-4 text-neutral-400" />
                    Jobs Posted
                  </Link>
                  {showBilling && (
                    <a
                      href={billingUrl || '/api/stripe/portal'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] active:translate-y-[1px] active:shadow-none transition-all"
                    >
                      Manage Billing
                      <ArrowUpRight className="w-4 h-4 text-neutral-400" />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleSignOut()
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-neutral-400" />
                    Logout
                  </button>
                </>
              )}
              {authLoaded && hasSubscription === false && (
                <Link
                  href="/membership"
                  onClick={() => setMobileMenuOpen(false)}
                  className="relative flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-white bg-pink-600 border border-pink-700 rounded-lg shadow-[0px_2px_0px_0px_#9d174d] active:translate-y-[1px] active:shadow-none transition-all overflow-hidden"
                >
                  <span
                    className="absolute animate-get-pro-shine"
                    style={{
                      inset: '-100%',
                      width: '300%',
                      backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0.2) 45%, transparent 45%, transparent 47%, rgba(255,255,255,0.15) 47%, rgba(255,255,255,0.15) 48%, transparent 48%)',
                    }}
                  />
                  <Sparkles className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Get Membership</span>
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      <PersonalizedAlertsModal
        isOpen={alertsModalOpen}
        onClose={() => setAlertsModalOpen(false)}
        userEmail={user?.email}
        existingPreferences={existingAlertPreferences}
        isMember={hasSubscription === true}
      />
    </nav>
  )
}
