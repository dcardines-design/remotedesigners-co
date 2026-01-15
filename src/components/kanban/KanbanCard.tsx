'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui'

interface KanbanCardProps {
  id: string
  title: string
  company: string
  company_logo?: string
  location: string
  apply_url: string
  job_type?: string
  experience_level?: string
  skills?: string[]
  onDelete?: (id: string) => void
}

// Helper to convert to title case
const toTitleCase = (str: string) => {
  return str.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Generate company logo URL using Clearbit
const getCompanyLogoUrl = (company: string): string => {
  const cleanName = company.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')
  return `https://logo.clearbit.com/${cleanName}.com`
}

// Google Favicon fallback
const getGoogleFaviconUrl = (company: string): string => {
  const cleanName = company.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')
  return `https://www.google.com/s2/favicons?domain=${cleanName}.com&sz=128`
}

const getInitials = (company: string) => company.substring(0, 2).toUpperCase()

export function KanbanCard({ id, title, company, company_logo, location, apply_url, job_type, experience_level, skills, onDelete }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Build chips array (max 3 for compact cards)
  const chips: string[] = []
  if (job_type) chips.push(toTitleCase(job_type))
  if (experience_level) chips.push(toTitleCase(experience_level))
  if (skills && skills.length > 0) {
    chips.push(...skills.map(s => toTitleCase(s)))
  }
  const visibleChips = chips.slice(0, 3)
  const hiddenChips = chips.slice(3)
  const remainingCount = hiddenChips.length

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white border border-neutral-200 rounded-xl p-3 cursor-grab active:cursor-grabbing
        shadow-[0px_3px_0px_0px_rgba(0,0,0,0.08)] hover:shadow-[0px_3px_0px_0px_rgba(0,0,0,0)] hover:border-neutral-300
        transition-all duration-200
        ${isDragging ? 'opacity-50 shadow-lg scale-105' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Company Logo */}
        <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img
            src={company_logo || getCompanyLogoUrl(company)}
            alt={company}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              if (!target.dataset.triedFallback) {
                target.dataset.triedFallback = 'true'
                target.src = getGoogleFaviconUrl(company)
              } else {
                target.style.display = 'none'
                target.parentElement!.innerHTML = `<span class="text-xs font-medium text-neutral-400">${getInitials(company)}</span>`
              }
            }}
          />
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-neutral-900 truncate">{title}</h4>
          <p className="text-xs text-neutral-500 truncate">{company}</p>
          <p className="text-xs text-neutral-400 truncate mt-0.5">{location}</p>
        </div>
      </div>

      {/* Chips */}
      {visibleChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          {visibleChips.map((chip, i) => (
            <span
              key={i}
              className="bg-white text-neutral-500 text-[10px] px-2 py-0.5 rounded border border-neutral-200"
            >
              {chip}
            </span>
          ))}
          {remainingCount > 0 && (
            <div className="relative group/chips inline-flex">
              <span className="bg-white text-neutral-400 text-[10px] px-2 py-0.5 rounded border border-neutral-200 cursor-default group-hover/chips:border-neutral-300 group-hover/chips:text-neutral-500 transition-all">
                +{remainingCount}
              </span>
              <div className="absolute right-0 bottom-full mb-1.5 z-50 opacity-0 invisible group-hover/chips:opacity-100 group-hover/chips:visible transition-all duration-150">
                <div className="bg-neutral-100 border border-neutral-200 rounded-lg shadow-[0px_3px_0px_0px_rgba(0,0,0,0.08)] p-2 flex flex-wrap gap-1.5 min-w-[140px] max-w-[200px]">
                  {hiddenChips.map((chip, i) => (
                    <span
                      key={i}
                      className="bg-white text-neutral-500 text-[10px] px-2 py-0.5 rounded border border-neutral-200"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3">
        <a
          href={apply_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex-1"
        >
          <Button variant="secondary" size="sm" className="w-full !py-1.5 !text-xs">
            View job
          </Button>
        </a>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(id)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded border bg-white border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[1px] transition-all"
            title="Remove saved job"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="#ef4444"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
