'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'

export type ColumnStatus = 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected'

interface SavedJob {
  savedJobId: string
  status: ColumnStatus
  id: string
  title: string
  company: string
  company_logo?: string
  location: string
  apply_url: string
  job_type?: string
  experience_level?: string
  skills?: string[]
}

interface KanbanColumnProps {
  id: ColumnStatus
  title: string
  jobs: SavedJob[]
  color: string
  bgColor: string
  onDeleteJob?: (savedJobId: string) => void
}

export function KanbanColumn({ id, title, jobs, color, bgColor, onDeleteJob }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex-shrink-0 flex-grow-0 w-72 min-w-[288px] max-w-[288px]">
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2 py-0.5 text-[10px] font-medium tracking-wider rounded ${color} ${bgColor}`}>
          {title}
        </span>
        <span className="text-sm text-neutral-400">{jobs.length}</span>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={`
          h-[calc(100vh-320px)] rounded-2xl transition-colors duration-150 overflow-auto
          ${isOver ? 'bg-neutral-200' : 'bg-neutral-100'}
        `}
      >
        <SortableContext items={jobs.map(j => j.savedJobId)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 p-3">
            {jobs.map((job) => (
              <KanbanCard
                key={job.savedJobId}
                id={job.savedJobId}
                title={job.title}
                company={job.company}
                company_logo={job.company_logo}
                location={job.location}
                apply_url={job.apply_url}
                job_type={job.job_type}
                experience_level={job.experience_level}
                skills={job.skills}
                onDelete={onDeleteJob}
              />
            ))}
            {jobs.length === 0 && (
              <div className="flex items-center justify-center h-32 text-sm text-neutral-400">
                Drop jobs here
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
