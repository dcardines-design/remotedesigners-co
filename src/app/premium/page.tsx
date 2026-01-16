'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { RainbowButton, Button } from '@/components/ui'
import { HeroBackground } from '@/components/hero-background'
import { SUBSCRIPTION_PRICING } from '@/lib/lemonsqueezy'
import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

type Plan = 'monthly' | 'quarterly' | 'annual'

const plans: { id: Plan; label: string; price: number; period: string; perMonth: string; savings?: string; savingsAmount?: string }[] = [
  { id: 'monthly', label: 'Monthly', price: SUBSCRIPTION_PRICING.MONTHLY, period: '/mo', perMonth: '' },
  { id: 'quarterly', label: 'Quarterly', price: SUBSCRIPTION_PRICING.QUARTERLY, period: '/quarter', perMonth: '$9.67/mo', savings: 'Save 25%', savingsAmount: 'Save $40/yr' },
  { id: 'annual', label: 'Annual', price: SUBSCRIPTION_PRICING.ANNUAL, period: '/year', perMonth: '$4.08/mo', savings: 'Best Value', savingsAmount: 'Save $107/yr' },
]

const stats = [
  { value: '10,000+', label: 'Designers hired', emoji: '👩‍🎨' },
  { value: '300+', label: 'New jobs weekly', emoji: '📮' },
  { value: '2.5x', label: 'Faster job search', emoji: '⚡' },
  { value: '94%', label: 'Success rate', emoji: '🎯' },
]

const valueProps = [
  { icon: '🔓', title: 'Unlimited Job Access', description: 'Browse all 300+ design jobs without any restrictions.' },
  { icon: '🔔', title: 'Instant Job Alerts', description: 'Get notified the moment new jobs match your skills.' },
  { icon: '⚡', title: 'Early Access', description: 'See new job postings 24 hours before free users.' },
  { icon: '📊', title: 'Salary Insights', description: 'Access detailed salary data to negotiate better offers.' },
  { icon: '⭐', title: 'Unlimited Saves', description: 'Save as many jobs as you want and track applications.' },
  { icon: '💬', title: 'Priority Support', description: 'Get help within 24 hours from our team.' },
]

const testimonials = [
  { name: 'Sarah M.', role: 'Product Designer at Stripe', text: 'Found my dream job within 2 weeks of subscribing. The early access feature gave me a huge advantage.', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', date: '2 weeks ago' },
  { name: 'James K.', role: 'Senior UX Designer', text: 'The best investment I made in my job search. Landed a role paying 40% more than my previous job. The salary insights were incredibly helpful during negotiations.', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', date: '1 month ago' },
  { name: 'Emily R.', role: 'UI Designer at Figma', text: 'Job alerts saved me hours of searching.', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', date: '3 weeks ago' },
  { name: 'David L.', role: 'Design Lead at Notion', text: 'Premium is worth every penny. The salary insights helped me negotiate a better offer. I recommend it to every designer I know.', avatar: 'https://randomuser.me/api/portraits/men/75.jpg', date: '2 months ago' },
  { name: 'Lisa T.', role: 'Brand Designer', text: 'Went from endless scrolling to targeted applications. Quality over quantity.', avatar: 'https://randomuser.me/api/portraits/women/90.jpg', date: '1 week ago' },
  { name: 'Michael B.', role: 'UX Researcher at Meta', text: 'The 24-hour early access is a game changer. Applied to my job before it was even public. Got the interview within days.', avatar: 'https://randomuser.me/api/portraits/men/86.jpg', date: '3 months ago' },
  { name: 'Anna S.', role: 'Motion Designer', text: 'Canceled all my other subscriptions. This is the only job board you need for design roles.', avatar: 'https://randomuser.me/api/portraits/women/28.jpg', date: '2 weeks ago' },
  { name: 'Chris W.', role: 'Product Designer', text: 'Finally, a job board that understands designers.', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', date: '1 month ago' },
  { name: 'Rachel P.', role: 'UX Designer at Airbnb', text: 'Three interviews in my first week. The quality of jobs here is unmatched. Best decision I made for my career.', avatar: 'https://randomuser.me/api/portraits/women/56.jpg', date: '6 weeks ago' },
]

const faqs = [
  { question: 'What happens after I subscribe?', answer: 'You\'ll get instant access to all job listings, job alerts, and premium features. No waiting period.' },
  { question: 'Can I cancel anytime?', answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.' },
  { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, debit cards, and PayPal through our secure payment processor.' },
  { question: 'Is there a free trial?', answer: 'We offer a 20-job free tier so you can experience the platform before subscribing. No credit card required.' },
  { question: 'How is this different from free access?', answer: 'Free users can only view 20 jobs. Premium members get unlimited access, early job alerts, and exclusive features.' },
  { question: 'Do you offer refunds?', answer: 'Yes, we offer a 7-day money-back guarantee if you\'re not satisfied with your subscription.' },
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

  const handleSubscribe = async () => {
    if (!userEmail && !userId) {
      router.push(`/login?redirect=/premium?skip_url=${encodeURIComponent(skipUrl)}`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/subscribe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, email: userEmail }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout')
      if (data.checkoutUrl) window.LemonSqueezy?.Url?.Open?.(data.checkoutUrl)
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs mb-6 bg-amber-500 overflow-hidden relative">
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
          <h1 className="text-4xl md:text-5xl font-semibold text-neutral-900 tracking-tight mb-4">
            Land Your Dream Design Job
          </h1>
          <p className="text-lg text-neutral-500">
            Join 10,000+ designers who found their perfect remote role with Premium.
          </p>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)]">
              <h2 className="text-xl font-semibold text-neutral-900 text-center mb-1">Choose Your Plan</h2>
              <p className="text-neutral-500 text-center text-sm mb-6">Cancel anytime. 7-day money-back guarantee.</p>

              {/* Plan Options - Horizontal */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative p-4 rounded-xl border text-center transition-all ${
                      selectedPlan === plan.id
                        ? 'border-neutral-900 bg-white shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] -translate-y-1'
                        : 'border-neutral-200 bg-white shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.06)]'
                    }`}
                  >
                    {plan.savings && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-semibold tracking-wide rounded-full whitespace-nowrap border border-green-200 shadow-sm">
                        {plan.savings}
                      </div>
                    )}
                    <div className="font-medium text-neutral-900 text-sm mb-1">{plan.label}</div>
                    <div className="text-xl font-bold text-neutral-900">${plan.price}</div>
                    <div className="text-xs text-neutral-500">{plan.period}</div>
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-4 px-4 py-2.5 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200">
                  {error}
                </div>
              )}

              <RainbowButton onClick={handleSubscribe} disabled={isLoading} fullWidth>
                {isLoading ? 'Loading...' : `Get Premium — $${selectedPlanData.price}${selectedPlanData.period}`}
              </RainbowButton>

              <p className="mt-4 text-center text-xs text-neutral-400">
                Secure payment via Lemon Squeezy
              </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-neutral-200 p-4 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0px_6px_0px_0px_rgba(0,0,0,0.05)] transition-all cursor-default"
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
        </div>
      </div>

      {/* Testimonials - Masonry Grid */}
      <div className="px-4 pt-16 pb-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-neutral-900 text-center mb-2">Loved by Designers</h2>
          <p className="text-neutral-500 text-center mb-10">Join thousands who found their dream jobs</p>
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
                <p className="text-neutral-600 text-sm mb-3">&ldquo;{t.text}&rdquo;</p>
                <p className="text-xs text-neutral-400">{t.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="px-4 pb-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-normal text-neutral-900 mb-12">
            Questions,<br />answered.
          </h2>

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

      {/* Final CTA */}
      <div className="px-4 pb-20 relative z-10">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-3">Ready to Get Started?</h2>
          <p className="text-neutral-500 mb-6">Join 10,000+ designers who upgraded their careers.</p>
          <RainbowButton onClick={handleSubscribe} disabled={isLoading}>
            {isLoading ? 'Loading...' : `Get Premium — $${selectedPlanData.price}${selectedPlanData.period}`}
          </RainbowButton>
          <div className="mt-6">
            <Link href={skipUrl} className="text-sm text-neutral-500 hover:text-neutral-700 underline underline-offset-4">
              No thanks, continue with free access
            </Link>
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
