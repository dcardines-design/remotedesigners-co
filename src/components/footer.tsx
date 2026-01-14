import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-400 py-16">
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Job Types */}
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

          {/* Regions */}
          <div>
            <h3 className="text-white text-sm font-medium mb-4">By Region</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/remote-design-jobs-usa" className="hover:text-white transition-colors">USA</Link></li>
              <li><Link href="/remote-design-jobs-europe" className="hover:text-white transition-colors">Europe</Link></li>
              <li><Link href="/remote-design-jobs-uk" className="hover:text-white transition-colors">United Kingdom</Link></li>
              <li><Link href="/remote-design-jobs-canada" className="hover:text-white transition-colors">Canada</Link></li>
              <li><Link href="/remote-design-jobs-asia" className="hover:text-white transition-colors">Asia</Link></li>
              <li><Link href="/remote-design-jobs-australia" className="hover:text-white transition-colors">Australia</Link></li>
              <li><Link href="/remote-design-jobs-latam" className="hover:text-white transition-colors">Latin America</Link></li>
              <li><Link href="/remote-design-jobs-worldwide" className="hover:text-white transition-colors">Worldwide</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white text-sm font-medium mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/resume-builder" className="hover:text-white transition-colors">Resume Builder</Link></li>
              <li><Link href="/cover-letter" className="hover:text-white transition-colors">Cover Letter Generator</Link></li>
              <li><Link href="/" className="hover:text-white transition-colors">Browse All Jobs</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white text-sm font-medium mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/post-job" className="hover:text-white transition-colors">Post a Job</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Log In</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
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
