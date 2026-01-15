'use client'

import Link from 'next/link'
import { useRef, useEffect } from 'react'

export function Footer() {
  const footerRef = useRef<HTMLElement>(null)

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
        footerRef.current.style.backgroundImage = `linear-gradient(${angle}deg, #050505 0%, #0a0a0a 15%, #121212 30%, #181818 45%, #121212 60%, #0a0a0a 75%, #050505 90%, #080808 100%)`
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <footer
      ref={footerRef}
      className="text-neutral-400 py-16 rounded-xl mx-3 mb-3"
      style={{
        backgroundSize: '300% 300%',
        backgroundImage: 'linear-gradient(135deg, #050505 0%, #0a0a0a 15%, #121212 30%, #181818 45%, #121212 60%, #0a0a0a 75%, #050505 90%, #080808 100%)'
      }}
    >
      <div className="max-w-6xl mx-auto px-8">
        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-10 mb-12">
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
              <li><Link href="/login" className="hover:text-white transition-colors">Log In</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">RemoteDesigners.co</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} RemoteDesigners.co. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
