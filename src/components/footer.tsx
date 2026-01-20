'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useEffect, useState } from 'react'
import { LoginModal } from '@/components/ui/login-modal'

export function Footer() {
  const footerRef = useRef<HTMLElement>(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  useEffect(() => {
    let animationId: number
    const startTime = Date.now()

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000

      // Use multiple sine waves at different frequencies for organic motion
      const x = 50 + Math.sin(elapsed * 0.5) * 30 + Math.sin(elapsed * 0.3) * 20
      const y = 50 + Math.cos(elapsed * 0.4) * 30 + Math.cos(elapsed * 0.6) * 20
      const angle = 135 + Math.sin(elapsed * 0.2) * 45

      if (footerRef.current) {
        footerRef.current.style.backgroundPosition = `${x}% ${y}%`
        footerRef.current.style.backgroundImage = `linear-gradient(${angle}deg, #0a0a0a 0%, #0f0f0f 15%, #141414 30%, #171717 45%, #141414 60%, #0f0f0f 75%, #0a0a0a 90%, #0c0c0c 100%)`
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <footer
      ref={footerRef}
      className="relative text-neutral-400 pt-8 pb-[18px] md:py-16 rounded-xl mx-3 mb-[14px] overflow-hidden"
      style={{
        backgroundSize: '300% 300%',
        backgroundImage: 'linear-gradient(135deg, #0a0a0a 0%, #0f0f0f 15%, #141414 30%, #171717 45%, #141414 60%, #0f0f0f 75%, #0a0a0a 90%, #0c0c0c 100%)'
      }}
    >
      <div className="max-w-6xl mx-auto px-8 relative z-10">
        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8 md:gap-y-10 mb-12">
          {/* By Specialty */}
          <div>
            <h3 className="text-white text-sm font-medium mb-4">By Specialty</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/remote-ui-ux-design-jobs" className="hover:text-white transition-colors">UI/UX Design Jobs</Link></li>
              <li><Link href="/remote-product-design-jobs" className="hover:text-white transition-colors">Product Design Jobs</Link></li>
              <li><Link href="/remote-graphic-design-jobs" className="hover:text-white transition-colors">Graphic Design Jobs</Link></li>
              <li><Link href="/remote-motion-design-jobs" className="hover:text-white transition-colors">Motion Design Jobs</Link></li>
              <li><Link href="/remote-brand-design-jobs" className="hover:text-white transition-colors">Brand Design Jobs</Link></li>
              <li><Link href="/remote-web-design-jobs" className="hover:text-white transition-colors">Web Design Jobs</Link></li>
              <li><Link href="/remote-interaction-design-jobs" className="hover:text-white transition-colors">Interaction Design Jobs</Link></li>
              <li><Link href="/remote-visual-design-jobs" className="hover:text-white transition-colors">Visual Design Jobs</Link></li>
            </ul>
          </div>

          {/* By Region */}
          <div>
            <h3 className="text-white text-sm font-medium mb-4">By Region</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/remote-design-jobs-usa" className="hover:text-white transition-colors">Remote Design Jobs USA</Link></li>
              <li><Link href="/remote-design-jobs-uk" className="hover:text-white transition-colors">Remote Design Jobs UK</Link></li>
              <li><Link href="/remote-design-jobs-europe" className="hover:text-white transition-colors">Remote Design Jobs Europe</Link></li>
              <li><Link href="/remote-design-jobs-canada" className="hover:text-white transition-colors">Remote Design Jobs Canada</Link></li>
              <li><Link href="/remote-design-jobs-australia" className="hover:text-white transition-colors">Remote Design Jobs Australia</Link></li>
              <li><Link href="/remote-design-jobs-asia" className="hover:text-white transition-colors">Remote Design Jobs Asia</Link></li>
              <li><Link href="/remote-design-jobs-latam" className="hover:text-white transition-colors">Remote Design Jobs LATAM</Link></li>
              <li><Link href="/remote-design-jobs-worldwide" className="hover:text-white transition-colors">Remote Design Jobs Worldwide</Link></li>
            </ul>
          </div>

          {/* By Experience */}
          <div>
            <h3 className="text-white text-sm font-medium mb-4">By Experience</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/entry-level-design-jobs" className="hover:text-white transition-colors">Entry Level Design Jobs</Link></li>
              <li><Link href="/junior-designer-jobs" className="hover:text-white transition-colors">Junior Designer Jobs</Link></li>
              <li><Link href="/mid-level-designer-jobs" className="hover:text-white transition-colors">Mid-Level Designer Jobs</Link></li>
              <li><Link href="/senior-designer-jobs" className="hover:text-white transition-colors">Senior Designer Jobs</Link></li>
              <li><Link href="/design-lead-jobs" className="hover:text-white transition-colors">Design Lead Jobs</Link></li>
              <li><Link href="/design-director-jobs" className="hover:text-white transition-colors">Design Director Jobs</Link></li>
            </ul>
          </div>

          {/* By Job Type */}
          <div>
            <h3 className="text-white text-sm font-medium mb-4">By Job Type</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/full-time-design-jobs" className="hover:text-white transition-colors">Full-Time Design Jobs</Link></li>
              <li><Link href="/part-time-design-jobs" className="hover:text-white transition-colors">Part-Time Design Jobs</Link></li>
              <li><Link href="/contract-design-jobs" className="hover:text-white transition-colors">Contract Design Jobs</Link></li>
              <li><Link href="/freelance-design-jobs" className="hover:text-white transition-colors">Freelance Design Jobs</Link></li>
              <li><Link href="/design-internships" className="hover:text-white transition-colors">Design Internships</Link></li>
            </ul>
          </div>

          {/* Popular Searches */}
          <div>
            <h3 className="text-white text-sm font-medium mb-4">Popular Searches</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/remote-product-design-jobs-usa" className="hover:text-white transition-colors">Product Designer Jobs USA</Link></li>
              <li><Link href="/remote-ui-ux-design-jobs-usa" className="hover:text-white transition-colors">UX Designer Jobs USA</Link></li>
              <li><Link href="/remote-ui-ux-design-jobs-uk" className="hover:text-white transition-colors">UX Designer Jobs UK</Link></li>
              <li><Link href="/remote-graphic-design-jobs-usa" className="hover:text-white transition-colors">Graphic Designer Jobs USA</Link></li>
              <li><Link href="/remote-product-design-jobs-europe" className="hover:text-white transition-colors">Product Designer Jobs Europe</Link></li>
              <li><Link href="/senior-designer-jobs" className="hover:text-white transition-colors">Senior Designer Jobs</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white text-sm font-medium mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/post-job" className="hover:text-white transition-colors">Post a Job</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><button onClick={() => setIsLoginModalOpen(true)} className="hover:text-white transition-colors">Log In</button></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-white.png"
              alt="RemoteDesigners.co"
              width={240}
              height={48}
              className="h-10 w-auto"
            />
          </div>
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} RemoteDesigners.co. All rights reserved.
          </p>
        </div>
      </div>

      {/* Rainbow gradient glow at very bottom */}
      <div
        className="absolute -bottom-4 left-0 right-0 h-20 pointer-events-none blur-3xl rounded-full animate-breathe"
        style={{
          background: 'linear-gradient(135deg, #0D9488 0%, #0891B2 15%, #2563EB 30%, #7C3AED 45%, #EC4899 60%, #F97316 75%, #EAB308 90%, #10B981 100%)',
          zIndex: 1,
        }}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToSignup={() => setIsLoginModalOpen(false)}
      />
    </footer>
  )
}
