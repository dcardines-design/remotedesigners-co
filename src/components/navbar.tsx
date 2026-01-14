'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial state

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isTransparent = isHomePage && !scrolled

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

          <Link
            href="/post-job"
            className="relative inline-block p-[1px] rounded-[7px] shadow-[0px_3px_0px_0px_rgba(0,0,0,0.3),0px_1px_2px_0px_rgba(0,0,0,0.1)] hover:translate-y-[1px] hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.3),0px_1px_2px_0px_rgba(0,0,0,0.1)] active:translate-y-[2px] active:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.3)] transition-all"
            style={{ backgroundImage: 'linear-gradient(135deg, #00C939 0%, #FF8C00 33%, #FF6467 66%, #FF64F2 100%)' }}
          >
            <span
              className="block px-5 py-2 rounded-[6px] text-sm font-normal text-white"
              style={{ backgroundImage: 'linear-gradient(135deg, #3b3b3b 0%, #1a1a1a 100%)' }}
            >
              Post a job
            </span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
