'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { RainbowButton, Button } from '@/components/ui'
import { HeroBackground } from '@/components/hero-background'
import { SUBSCRIPTION_PRICING } from '@/lib/stripe'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'
import { useSignupModal } from '@/context/signup-modal-context'

// Animated gradient text component with fabric-like flowing effect
function AnimatedGradientText({ children }: { children: React.ReactNode }) {
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let animationId: number
    const startTime = Date.now()

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000

      // Use multiple sine waves at different frequencies for organic motion
      const x = 50 + Math.sin(elapsed * 0.5) * 30 + Math.sin(elapsed * 0.3) * 20
      const y = 50 + Math.cos(elapsed * 0.4) * 30 + Math.cos(elapsed * 0.6) * 20
      const angle = 135 + Math.sin(elapsed * 0.2) * 45

      if (spanRef.current) {
        spanRef.current.style.backgroundPosition = `${x}% ${y}%`
        spanRef.current.style.backgroundImage = `linear-gradient(${angle}deg, #0D9488 0%, #0891B2 15%, #2563EB 30%, #7C3AED 45%, #EC4899 60%, #F97316 75%, #EAB308 90%, #10B981 100%)`
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <span
      ref={spanRef}
      className="bg-clip-text text-transparent"
      style={{
        backgroundSize: '300% 300%',
        backgroundImage: 'linear-gradient(135deg, #0D9488 0%, #0891B2 15%, #2563EB 30%, #7C3AED 45%, #EC4899 60%, #F97316 75%, #EAB308 90%, #10B981 100%)'
      }}
    >
      {children}
    </span>
  )
}

type Plan = 'monthly' | 'quarterly' | 'annual'

const plans: { id: Plan; label: string; price: number; period: string; perMonth: string; savings?: string; savingsAmount?: string; savingsYearly?: string }[] = [
  { id: 'monthly', label: 'Monthly', price: SUBSCRIPTION_PRICING.MONTHLY, period: '/mo', perMonth: '' },
  { id: 'quarterly', label: 'Quarterly', price: SUBSCRIPTION_PRICING.QUARTERLY, period: '/quarter', perMonth: '$4/mo', savings: 'Save 20%', savingsAmount: 'Save $1/mo', savingsYearly: '$4/mo' },
  { id: 'annual', label: 'Annual', price: SUBSCRIPTION_PRICING.ANNUAL, period: '/year', perMonth: '$2.42/mo', savings: 'Best Value', savingsAmount: 'Save $2.57/mo', savingsYearly: '$2.42/mo' },
]

const stats = [
  { value: '10,000+', label: 'Designers hired', emoji: '👩‍🎨' },
  { value: '300+', label: 'New jobs weekly', emoji: '📮' },
  { value: '2.5x', label: 'Faster job search', emoji: '⚡' },
  { value: '94%', label: 'Success rate', emoji: '🎯' },
]

const valueProps = [
  { icon: '🎯', title: 'Direct from Source', description: 'Jobs pulled straight from company career pages, not recycled from other boards.' },
  { icon: '⚡', title: 'First to Apply', description: 'See jobs before they hit LinkedIn or Indeed. Less competition, more callbacks.' },
  { icon: '✅', title: 'Verified & Fresh', description: 'Every listing verified and updated hourly. No expired posts or scams.' },
  { icon: '🔓', title: 'Unlimited Access', description: 'Browse all curated design jobs without restrictions.' },
  { icon: '📬', title: 'Daily Job Alerts', description: 'Get matched jobs delivered to your inbox every morning.' },
  { icon: '📊', title: 'Salary Insights', description: 'Access salary data to negotiate better offers with confidence.' },
]

const testimonials = [
  { name: 'mei lin', role: 'product designer @ fintech startup', text: 'ok so i was mass applying on linkedin for like 3 weeks with zero responses. found this site, applied to 4 jobs and got 2 interviews?? one of them was a company i literally never heard of before. starting there next month lol', date: 'Jan 13, 2026', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Marcus J', role: 'Senior UI Designer', text: "The early access thing actually works. Applied to a role at 6am, recruiter told me I was one of the first 10 applicants. That never happens on other sites", date: 'Jan 10, 2026', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { name: 'em', role: 'Brand Designer', text: "finally a job board thats not 90% engineering roles. i dont have to scroll past \"senior backend engineer\" 50 times to find actual design jobs anymore thank god", date: 'Dec 18, 2025', avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
  { name: 'Aisha', role: 'UX Designer', text: "love the daily email. just 5-6 jobs every morning that are actually relevant. not like indeed where you get 100 notifications for roles you'd never apply to", date: 'Jan 12, 2026', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' },
  { name: 'Chris A.', role: 'Design Lead', text: "Been in the industry 12 years. This is the first job board that feels like it was made by someone who actually understands what designers are looking for. Simple as that.", date: 'Jan 10, 2026', avatar: 'https://randomuser.me/api/portraits/men/52.jpg' },
  { name: 'rachel m', role: 'UX Researcher', text: "not strictly a designer but the ux research roles here are solid. found my current job through here - fully remote, great team, good pay. 10/10", date: 'Jan 11, 2026', avatar: 'https://randomuser.me/api/portraits/women/89.jpg' },
  { name: 'Andre', role: 'UI Designer', text: "my only complaint is i wish i found this sooner lol. spent months on linkedin applying to jobs that probably had 500+ applicants already", date: 'Dec 22, 2025', avatar: 'https://randomuser.me/api/portraits/men/78.jpg' },
  { name: 'Jen Liu', role: 'Product Designer', text: "The fact that its designer-focused makes such a difference. I actually trust that when I click on a job its gonna be relevant to what I do", date: 'Jan 9, 2026', avatar: 'https://randomuser.me/api/portraits/women/42.jpg' },
  { name: 'tyler k', role: 'Visual Designer', text: "got my first fully remote job through here after 2 years of hybrid. the filter options are actually useful - i can find exactly what im looking for in like 30 seconds", date: 'Jan 8, 2026', avatar: 'https://randomuser.me/api/portraits/men/22.jpg' },
  { name: 'Sofia R.', role: 'Design Systems Lead', text: "Finally a job board that doesn't make me feel like I'm competing with 10,000 other applicants. The companies posting here are legit and actually respond.", date: 'Jan 7, 2026', avatar: 'https://randomuser.me/api/portraits/women/57.jpg' },
  { name: 'David Chen', role: 'Motion Designer', text: "motion design jobs are so hard to find. this is literally the only place that has a decent selection. landed a contract role within 2 weeks of signing up", date: 'Jan 5, 2026', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
  { name: 'priya', role: 'UX/UI Designer', text: "the kanban board for tracking applications is so helpful. i can finally see where im at with each job without using a separate spreadsheet", date: 'Jan 4, 2026', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { name: 'Jake M', role: 'Product Designer', text: "Went from mass applying to 50+ jobs a week to carefully selecting 5-6 quality ones. Way less stressful and actually getting more callbacks now", date: 'Dec 28, 2025', avatar: 'https://randomuser.me/api/portraits/men/36.jpg' },
  { name: 'Nina S', role: 'Interaction Designer', text: "switched from indeed and linkedin to just using this. way less noise and the jobs are actually relevant to what i do", date: 'Jan 2, 2026', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Lena', role: 'Senior Brand Designer', text: "the salary info alone is worth the subscription. finally know if im being lowballed before wasting time on interviews", date: 'Dec 20, 2025', avatar: 'https://randomuser.me/api/portraits/women/31.jpg' },
  { name: 'Omar H.', role: 'Graphic Designer', text: "as someone just starting out, this site has been a game changer. entry level roles that are actually entry level, not '5 years experience required'", date: 'Jan 6, 2026', avatar: 'https://randomuser.me/api/portraits/men/67.jpg' },
  { name: 'kate b', role: 'Content Designer', text: "content design is such a niche role and i found like 15 relevant jobs in my first search here. that would take hours on linkedin", date: 'Jan 3, 2026', avatar: 'https://randomuser.me/api/portraits/women/19.jpg' },
]

const faqs = [
  { question: 'What happens after I subscribe?', answer: 'You\'ll get instant access to all job listings, job alerts, and premium features. No waiting period.' },
  { question: 'Can I cancel anytime?', answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.' },
  { question: 'Do you offer refunds?', answer: 'Yes, we offer a 7-day money-back guarantee if you\'re not satisfied with your subscription. No questions asked.' },
  { question: 'Why not just use LinkedIn or Indeed?', answer: 'Those platforms are flooded with hundreds of applicants per job. We curate only remote design roles, so you\'re competing with fewer, more relevant candidates. Our members report 3-5x better response rates.' },
  { question: 'How often are new jobs added?', answer: 'We add 50-100 new remote design jobs daily. Our system pulls from company career pages, job boards, and exclusive partnerships 24/7.' },
  { question: 'Are these real, legitimate jobs?', answer: 'Yes. Every job is verified and links directly to the company\'s application page. We don\'t allow scams, MLMs, or "commission-only" roles.' },
  { question: 'What if I find a job quickly?', answer: 'That\'s the goal! Many members land jobs within weeks. You can cancel anytime, or keep access to explore better opportunities later.' },
  { question: 'Is it worth it if I\'m not actively job hunting?', answer: 'Many members use it passively - the daily email keeps them informed about the market and salary trends. When the right role appears, they\'re ready.' },
  { question: 'What types of design jobs do you list?', answer: 'UI/UX, Product Design, Brand Design, Graphic Design, Motion Design, Design Systems, UX Research, Design Management, and more. All remote-friendly.' },
  { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, debit cards, and PayPal through our secure payment processor.' },
  { question: 'Can I share my account?', answer: 'Accounts are for individual use. We track unusual activity and may suspend shared accounts. Each membership supports one job seeker.' },
  { question: 'How is this different from free access?', answer: 'Free users see only 20 jobs and can\'t apply. Premium members get unlimited access, daily job alerts, early access to new listings, and salary insights.' },
]

function PremiumContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [jobCount, setJobCount] = useState<number>(300)
  const { openLoginModal } = useSignupModal()

  const skipUrl = searchParams.get('skip_url') || '/'

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setUserEmail(user.email || null)
      }
    }
    checkAuth()
  }, [])

  // Fetch job count
  useEffect(() => {
    const fetchJobCount = async () => {
      try {
        const res = await fetch('/api/jobs?page=1&limit=1')
        const data = await res.json()
        if (data.total) {
          setJobCount(data.total)
        }
      } catch (e) {
        // Keep default value
      }
    }
    fetchJobCount()
  }, [])

  const handleSubscribe = async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/subscribe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, email: userEmail }),
      })

      const data = await response.json()

      // Handle test mode responses
      if (data.testMode) {
        if (data.needsEmail) {
          setError('Please enter your email below')
          setIsLoading(false)
          return
        }
        if (data.success) {
          if (data.redirectToLogin) {
            setSuccessMessage('Subscription created! Please log in with your email.')
            return
          }
          if (data.pendingEmail) {
            setSuccessMessage(data.message || 'Check your email to complete signup!')
            return
          }
          // Logged in user - save pending alert preferences if any, then redirect
          const pendingPrefs = sessionStorage.getItem('pendingAlertPreferences')
          if (pendingPrefs) {
            try {
              const prefs = JSON.parse(pendingPrefs)
              await fetch('/api/subscribe/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: prefs.email,
                  preferences: {
                    jobTypes: prefs.jobTypes,
                    locations: prefs.locations,
                  },
                }),
              })
              sessionStorage.removeItem('pendingAlertPreferences')
            } catch (e) {
              console.error('Failed to save pending preferences:', e)
            }
          }
          window.location.href = '/?subscribed=true'
          return
        }
      }

      if (!response.ok) throw new Error(data.error || 'Failed to create checkout')

      // Production - open Stripe checkout in new tab
      if (data.checkoutUrl) window.open(data.checkoutUrl, '_blank')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan)!

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Background - contained to hero area */}
      <div className="absolute top-0 left-0 right-0 h-[600px] overflow-hidden pointer-events-none">
        <img
          src="/premium-bg.png"
          alt=""
          className="w-full h-auto opacity-[0.12] object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(250,250,250,0) 0%, rgba(250,250,250,0) 50%, rgba(250,250,250,1) 100%)' }}
        />
      </div>

      {/* Hero */}
      <div className="pt-20 pb-[34px] px-4 relative">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Pro Membership Badge - commented out for future use
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs mb-6 bg-violet-600 overflow-hidden relative">
            <div
              className="absolute animate-diagonal-stripes"
              style={{
                inset: '-100%',
                width: '300%',
                backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0.2) 45%, transparent 45%, transparent 47%, rgba(255,255,255,0.15) 47%, rgba(255,255,255,0.15) 48%, transparent 48%)',
              }}
            />
            <svg className="w-3 h-3 text-white relative z-10" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-white font-medium relative z-10">
              Pro Membership
            </span>
          </div>
          <style jsx>{`
            @keyframes diagonal-stripes {
              0% { transform: translateX(-33%); }
              30% { transform: translateX(33%); }
              100% { transform: translateX(33%); }
            }
            .animate-diagonal-stripes {
              animation: diagonal-stripes 3.5s ease-out infinite;
            }
          `}</style>
          */}
          <h1 className="text-4xl md:text-5xl font-medium text-neutral-900 tracking-tight mb-4 font-display">
            Land Your <AnimatedGradientText><span className="font-ivy-display">Dream</span></AnimatedGradientText> Design Job
          </h1>
          <p className="text-lg text-neutral-500">
            Jobs sourced directly from company career pages. Apply before they hit LinkedIn.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-neutral-200 p-4 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)]"
                style={{
                  animation: `bounce-in 0.5s ease-out ${index * 0.1}s both`,
                }}
              >
                <div className="text-lg mb-1">{stat.emoji}</div>
                <div className="text-2xl font-bold text-neutral-900">{stat.value}</div>
                <div className="text-sm text-neutral-500">{stat.label}</div>
              </div>
            ))}
          </div>
          <style jsx>{`
            @keyframes bounce-in {
              0% {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
              }
              60% {
                transform: translateY(-5px) scale(1.02);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>

          {/* Pricing Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)] mt-6">
              <h2 className="text-xl font-semibold text-neutral-900 text-center mb-2">Choose Your Plan</h2>
              <p className="text-neutral-500 text-center mb-6">Cancel anytime. 7-day money-back guarantee.</p>

              {/* Plan Options - Horizontal */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative px-4 py-8 rounded-xl border text-center transition-all ${
                      selectedPlan === plan.id
                        ? 'border-neutral-900 bg-white shadow-[0px_6px_0px_0px_rgba(0,0,0,0.08)]'
                        : 'border-neutral-200 bg-white shadow-[0px_6px_0px_0px_rgba(0,0,0,0.03)] hover:translate-y-[1px] hover:shadow-[0px_5px_0px_0px_rgba(0,0,0,0.03)]'
                    }`}
                  >
                    {plan.savings && (
                      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-medium tracking-wider rounded-full whitespace-nowrap border ${
                        plan.savings === 'Best Value'
                          ? 'bg-violet-50 text-violet-600 border-violet-200'
                          : 'bg-blue-50 text-blue-600 border-blue-200'
                      }`}>
                        {plan.savings.toUpperCase()}
                      </div>
                    )}
                    <div className="font-medium text-neutral-900 text-sm mb-2">{plan.label}</div>
                    <div className="text-xl font-bold text-neutral-900 mb-1">${plan.price}</div>
                    <div className="text-xs text-neutral-500">{plan.period}</div>
                    {plan.savingsAmount && (
                      <div className="text-[11px] text-green-600 font-medium mt-2.5">
                        {plan.savingsAmount} <span className="text-neutral-400">({plan.savingsYearly})</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-4 px-4 py-2.5 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="mb-4 px-4 py-2.5 rounded-lg text-sm bg-green-50 text-green-800 border border-green-200">
                  {successMessage}
                </div>
              )}

              <RainbowButton onClick={handleSubscribe} disabled={isLoading} fullWidth>
                {isLoading ? 'Loading...' : `Get Membership — $${selectedPlanData.price}${selectedPlanData.period}`}
              </RainbowButton>

              <p className="mt-4 text-center text-xs text-neutral-400 flex items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 10h-1V7c0-3.3-2.7-6-6-6S6 3.7 6 7v3H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm-9 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3-8H8V7c0-1.7 1.3-3 3-3s3 1.3 3 3v3z"/></svg>
                Secure payment via Stripe
              </p>
          </div>

          {/* Features You'll Unlock */}
          <div className="mt-16">
            <h2 className="text-2xl font-semibold text-neutral-900 text-center mb-2">What You'll Unlock</h2>
            <p className="text-neutral-500 text-center mb-6">Everything you need to land your next role</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)]">
                <div className="text-2xl mb-2">🔓</div>
                <div className="text-xl font-semibold text-neutral-900">Unlimited Jobs</div>
                <div className="text-base text-neutral-500 mt-1">Access all {jobCount.toLocaleString()}+ listings</div>
              </div>
              <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)]">
                <div className="text-2xl mb-2">📬</div>
                <div className="text-xl font-semibold text-neutral-900">Tailored Daily Alerts</div>
                <div className="text-base text-neutral-500 mt-1">Your perfect jobs, every morning</div>
              </div>
              <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)]">
                <div className="text-2xl mb-2">📋</div>
                <div className="text-xl font-semibold text-neutral-900">Job Tracker</div>
                <div className="text-base text-neutral-500 mt-1">Kanban board for apps</div>
              </div>
              <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)]">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-xl font-semibold text-neutral-900">Apply Directly</div>
                <div className="text-base text-neutral-500 mt-1">Skip the middleman and job aggregators</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials - Masonry Grid */}
      <div className="px-4 pt-16 pb-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-neutral-900 text-center mb-2">Loved by Designers</h2>
          <p className="text-neutral-500 text-center mb-6">Join thousands who found their dream jobs</p>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {testimonials.map((t, i) => (
              <div key={i} className="break-inside-avoid bg-white border border-neutral-200 rounded-xl p-6 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-neutral-900">{t.name}</p>
                    <p className="text-sm text-neutral-500">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} width="14" height="14" viewBox="0 0 14 14" fill="#FBBF24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 1L8.5 5H13L9.5 8L11 13L7 10L3 13L4.5 8L1 5H5.5L7 1Z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-neutral-600 text-sm mb-3">{t.text}</p>
                <p className="text-xs text-neutral-400">{t.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="px-4 pb-4 md:pb-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 text-center mb-2">Frequently Asked Questions</h2>
          <p className="text-sm md:text-base text-neutral-500 text-center mb-6 md:mb-10">Everything you need to know about the membership</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 items-start">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i
              return (
                <button
                  key={i}
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full border-t border-neutral-200 hover:bg-neutral-100/50 transition-colors duration-150 py-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900">{faq.question}</span>
                    <div className={`w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="transition-transform duration-150"
                      >
                        <path
                          d="M3 7H11"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M7 3V11"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          className={`origin-center transition-transform duration-150 ${isOpen ? 'scale-y-0' : 'scale-y-100'}`}
                        />
                      </svg>
                    </div>
                  </div>
                  <div
                    className={`grid transition-all duration-150 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-neutral-600 pr-12">{faq.answer}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PremiumPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    }>
      <PremiumContent />
    </Suspense>
  )
}
