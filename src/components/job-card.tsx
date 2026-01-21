'use client'

import Link from 'next/link'
import React from 'react'
import { trackEvent } from '@/components/analytics-provider'
import {
  getCompanyLogoUrl,
  getSourceFavicon,
  toTitleCase,
  getRegionChip,
  cleanJobTitle,
  isNewJob,
  formatSalary,
  isRemoteJob,
  formatLocation,
  formatTimeAgo,
  generateJobSlug,
} from '@/lib/job-utils'

export interface Job {
  id: string
  title: string
  company: string
  company_logo?: string | null
  location: string
  salary_min?: number | null
  salary_max?: number | null
  salary_text?: string | null
  job_type?: string | null
  experience_level?: string | null
  skills?: string[] | null
  apply_url: string
  posted_at: string
  source?: string
  is_featured?: boolean
  is_sticky?: boolean
  is_rainbow?: boolean
  sticky_until?: string | null
}

interface JobCardProps {
  job: Job
  onSave?: (e: React.MouseEvent, jobId: string) => void
  isSaved?: boolean
  isSaving?: boolean
  showActions?: boolean
  variant?: 'default' | 'simple'
  isSubscribed?: boolean
}

export function JobCard({
  job,
  onSave,
  isSaved = false,
  isSaving = false,
  showActions = true,
  variant = 'default',
  isSubscribed = true,
}: JobCardProps) {
  const isNew = isNewJob(job.posted_at)
  const timeAgo = formatTimeAgo(job.posted_at)
  const salary = formatSalary(job)
  const remote = isRemoteJob(job.location)

  const getBorderColor = () => {
    if (job.is_rainbow) return ''
    if (job.is_sticky) return 'bg-purple-500'
    if (job.is_featured) return 'bg-amber-400'
    if (isNew) return 'bg-green-500'
    return 'bg-neutral-200'
  }

  const rainbowStyle = job.is_rainbow ? {
    background: 'linear-gradient(180deg, #ec4899 0%, #8b5cf6 20%, #3b82f6 40%, #10b981 60%, #eab308 80%, #ec4899 100%)',
    backgroundSize: '100% 300%',
    animation: 'rainbowFlow 2s linear infinite'
  } : {}

  // Clickable chip style
  const chipClass = "bg-white text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"

  // Build chips array
  const buildChips = () => {
    const regionChip = getRegionChip(job.location)
    const allChips: { key: string; element: React.ReactNode }[] = []

    if (job.is_featured) {
      allChips.push({
        key: 'featured',
        element: (
          <a
            href="/?featured=true"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="bg-yellow-400 text-neutral-900 text-xs font-medium px-2.5 py-1 rounded border border-yellow-500 hover:shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
          >
            Featured
          </a>
        )
      })
    }

    if (job.job_type) {
      allChips.push({
        key: 'job_type',
        element: (
          <a
            href={`/?type=${job.job_type.toLowerCase()}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={chipClass}
          >
            {toTitleCase(job.job_type)}
          </a>
        )
      })
    }

    if (job.experience_level) {
      allChips.push({
        key: 'experience',
        element: (
          <a
            href={`/?experience=${job.experience_level.toLowerCase()}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={chipClass}
          >
            {toTitleCase(job.experience_level)}
          </a>
        )
      })
    }

    if (regionChip) {
      allChips.push({
        key: 'region',
        element: (
          <a
            href={`/?location=${regionChip.value}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={chipClass}
          >
            {regionChip.label}
          </a>
        )
      })
    }

    if (salary) {
      allChips.push({
        key: 'salary',
        element: (
          <span className="bg-neutral-100 text-neutral-600 text-xs px-2.5 py-1 rounded border border-neutral-200">
            {salary}
          </span>
        )
      })
    }

    if (remote) {
      allChips.push({
        key: 'remote',
        element: (
          <a
            href="/?remote_type=remote"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={chipClass}
          >
            Remote
          </a>
        )
      })
    }

    if (job.skills) {
      job.skills.forEach((skill, index) => {
        allChips.push({
          key: `skill-${index}`,
          element: (
            <a
              href={`/?skill=${encodeURIComponent(skill)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={chipClass}
            >
              {toTitleCase(skill)}
            </a>
          )
        })
      })
    }

    return allChips
  }

  const allChips = buildChips()
  const MAX_CHIPS = 5
  const visibleChips = allChips.slice(0, MAX_CHIPS)
  const hiddenChips = allChips.slice(MAX_CHIPS)
  const remainingCount = hiddenChips.length

  return (
    <Link
      href={`/jobs/${generateJobSlug(job.title, job.company, job.id)}`}
      className={`block border rounded-xl p-5 relative hover:shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08),0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-all duration-200 cursor-pointer ${
        job.is_featured
          ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
          : 'bg-white border-neutral-200 hover:border-neutral-300'
      }`}
    >
      {/* Left border indicator */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${getBorderColor()}`}
        style={rainbowStyle}
      />

      <div className="flex flex-col gap-3 px-2 md:pl-3 md:pr-0 md:flex-row md:gap-4">
        {/* Company Avatar */}
        <CompanyLogo
          company={job.company}
          companyLogo={job.company_logo}
          source={job.source}
          sizeClasses="w-10 h-10 md:w-12 md:h-12"
          iconSize={20}
        />

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h3 className="text-lg font-normal text-neutral-900">{cleanJobTitle(job.title)}</h3>
            {/* Desktop: badges top right */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {job.is_sticky && (() => {
                // Determine sticky type: 24h = blue, 7d = purple
                const is7Day = job.sticky_until && job.posted_at
                  ? (new Date(job.sticky_until).getTime() - new Date(job.posted_at).getTime()) > 2 * 24 * 60 * 60 * 1000
                  : true // Default to 7d if we can't determine
                const pinColor = is7Day ? 'text-purple-500' : 'text-blue-500'
                return (
                  <span className={`${pinColor} flex items-center`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 4l4 4-1.5 1.5-1-1L14 12l1 5-3 3-2.5-5L5 19.5 4.5 19l4.5-4.5-5-2.5 3-3 5 1 3.5-3.5-1-1L16 4z"/>
                    </svg>
                  </span>
                )
              })()}
              {isNew && (
                <span className="bg-green-500 text-white text-[10px] font-medium tracking-wider px-2 py-0.5 rounded">
                  NEW
                </span>
              )}
              <span className="text-sm text-neutral-400">{timeAgo}</span>
            </div>
          </div>

          <p className="text-sm text-neutral-500 mb-3">
            {job.company} · {formatLocation(job.location)}
          </p>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap gap-2 md:max-w-[70%]">
              {visibleChips.map(chip => (
                <span key={chip.key}>{chip.element}</span>
              ))}
              {remainingCount > 0 && (
                <div className="relative group/chips">
                  <span className="bg-white text-neutral-400 text-xs px-2.5 py-1 rounded border border-neutral-200 cursor-default group-hover/chips:border-neutral-300 group-hover/chips:text-neutral-500 transition-all">
                    +{remainingCount}
                  </span>
                  <div className="absolute left-0 bottom-full mb-1.5 z-20 opacity-0 invisible group-hover/chips:opacity-100 group-hover/chips:visible transition-all duration-150">
                    <div className="bg-neutral-100 border border-neutral-200 rounded-lg shadow-[0px_4px_0px_0px_rgba(0,0,0,0.08)] p-2 flex flex-wrap gap-2 min-w-[280px] max-w-[400px]">
                      {hiddenChips.map(chip => (
                        <span key={chip.key}>{chip.element}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between md:justify-end gap-2">
              {/* Mobile: badges on left */}
              <div className="flex md:hidden items-center gap-2">
                {job.is_sticky && (() => {
                  const is7Day = job.sticky_until && job.posted_at
                    ? (new Date(job.sticky_until).getTime() - new Date(job.posted_at).getTime()) > 2 * 24 * 60 * 60 * 1000
                    : true
                  const pinColor = is7Day ? 'text-purple-500' : 'text-blue-500'
                  return (
                    <span className={`${pinColor} flex items-center`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 4l4 4-1.5 1.5-1-1L14 12l1 5-3 3-2.5-5L5 19.5 4.5 19l4.5-4.5-5-2.5 3-3 5 1 3.5-3.5-1-1L16 4z"/>
                      </svg>
                    </span>
                  )
                })()}
                {isNew && (
                  <span className="bg-green-500 text-white text-[10px] font-medium tracking-wider px-2 py-0.5 rounded">
                    NEW
                  </span>
                )}
                <span className="text-sm text-neutral-400">{timeAgo}</span>
              </div>
              {showActions && (
                <div className="flex items-center gap-2">
                  {onSave && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onSave(e, job.id)
                      }}
                      disabled={isSaving}
                      className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded border transition-all ${
                        isSaved
                          ? 'bg-white border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)]'
                          : 'bg-white border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[1px] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)]'
                      } ${isSaving ? 'opacity-50' : ''}`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill={isSaved ? '#ef4444' : 'none'}
                        stroke={isSaved ? '#ef4444' : '#737373'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  )}
                  <a
                    href={isSubscribed ? job.apply_url : "/membership"}
                    target={isSubscribed ? "_blank" : undefined}
                    rel={isSubscribed ? "noopener noreferrer" : undefined}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isSubscribed) {
                        trackEvent.applyClick(job.id, job.title, job.company, job.apply_url)
                      }
                    }}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-800 rounded shadow-[0px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[1px] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    Apply
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
