import Link from 'next/link'
import { Button, SuccessIcon } from '@/components/ui'

export default function PostJobSuccessPage() {
  return (
    <div className="min-h-screen relative">
      {/* Hero Background - Mobile */}
      <div className="md:hidden absolute left-0 right-0 overflow-hidden pointer-events-none" style={{ top: '-64px', height: '50vh' }}>
        <img
          src="/success-bg.png"
          alt=""
          className="w-full h-full object-cover object-top"
          style={{ opacity: 0.4 }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(250,250,250,0) 0%, rgba(250,250,250,0.5) 30%, rgba(250,250,250,1) 60%)' }}
        />
      </div>

      {/* Hero Background - Desktop (original) */}
      <div className="hidden md:block absolute left-0 right-0 overflow-hidden pointer-events-none" style={{ top: '-64px', height: '500px' }}>
        <img
          src="/success-bg.png"
          alt=""
          className="w-full h-auto"
          style={{ opacity: 0.4, marginTop: '-280px' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(250,250,250,0) 0%, rgba(250,250,250,0) 60%, rgba(250,250,250,1) 100%)' }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4">
        <div className="mx-auto text-center -mt-10 md:-mt-20 max-w-md">
        {/* Mobile: smaller icon */}
        <div className="md:hidden">
          <SuccessIcon size="md" className="mx-auto mb-6" />
        </div>
        {/* Desktop: larger icon */}
        <div className="hidden md:block">
          <SuccessIcon size="lg" className="mx-auto mb-6" />
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-3">
          Job Posted Successfully!
        </h1>

        <p className="text-neutral-500 mb-8 max-w-md mx-auto">
          Your job listing is now live and visible to thousands of remote designers.
          {' '}You&apos;ll start receiving applications soon.
        </p>

        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <Link href="/">
            <Button variant="primary" size="lg" fullWidth>
              View Job Listings
            </Button>
          </Link>

          <Link href="/post-job">
            <Button variant="secondary" size="lg" fullWidth>
              Post Another Job
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-sm text-neutral-400">
          Need help? Contact us at{' '}
          <a href="mailto:hello@remotedesigners.co" className="text-neutral-600 hover:underline">
            hello@remotedesigners.co
          </a>
        </p>
        </div>
      </div>
    </div>
  )
}
