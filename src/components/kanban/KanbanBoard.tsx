'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { toast } from 'sonner'
import { KanbanColumn, ColumnStatus } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'

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

interface KanbanBoardProps {
  initialJobs: SavedJob[]
}

const COLUMNS: { id: ColumnStatus; title: string; color: string; bgColor: string }[] = [
  { id: 'saved', title: 'SAVED', color: 'text-white', bgColor: 'bg-neutral-500' },
  { id: 'applied', title: 'APPLIED', color: 'text-white', bgColor: 'bg-blue-500' },
  { id: 'interviewing', title: 'INTERVIEWING', color: 'text-white', bgColor: 'bg-violet-500' },
  { id: 'offered', title: 'OFFERED', color: 'text-white', bgColor: 'bg-green-500' },
  { id: 'rejected', title: 'REJECTED', color: 'text-white', bgColor: 'bg-red-500' },
]

const TOAST_MESSAGES: Record<ColumnStatus, string> = {
  saved: 'Job moved back to Saved',
  applied: 'Nice! Marked as Applied 🎯',
  interviewing: 'Good luck with the interview! 🤞',
  offered: 'Congrats on the offer! 🎉',
  rejected: 'On to the next one 💪',
}

export function KanbanBoard({ initialJobs }: KanbanBoardProps) {
  const [jobs, setJobs] = useState<SavedJob[]>(initialJobs)
  const [activeJob, setActiveJob] = useState<SavedJob | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const getJobsByStatus = (status: ColumnStatus) => {
    return jobs.filter(job => job.status === status)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const job = jobs.find(j => j.savedJobId === event.active.id)
    if (job) setActiveJob(job)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveJob(null)

    if (!over) return

    const activeJobId = active.id as string
    const overId = over.id as string

    // Find the job being dragged
    const draggedJob = jobs.find(j => j.savedJobId === activeJobId)
    if (!draggedJob) return

    // Determine the target column
    let targetStatus: ColumnStatus

    // Check if dropped on a column directly
    if (COLUMNS.some(col => col.id === overId)) {
      targetStatus = overId as ColumnStatus
    } else {
      // Dropped on another card - find which column that card is in
      const targetJob = jobs.find(j => j.savedJobId === overId)
      if (!targetJob) return
      targetStatus = targetJob.status
    }

    // Don't update if same column
    if (draggedJob.status === targetStatus) return

    // Optimistic update
    const previousJobs = [...jobs]
    setJobs(jobs.map(j =>
      j.savedJobId === activeJobId
        ? { ...j, status: targetStatus }
        : j
    ))

    // Show toast
    toast.success(TOAST_MESSAGES[targetStatus])

    // API call
    try {
      const response = await fetch('/api/saved-jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          savedJobId: activeJobId,
          status: targetStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      // Revert on error
      setJobs(previousJobs)
      toast.error('Failed to update job status')
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 pb-4">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            jobs={getJobsByStatus(column.id)}
            color={column.color}
            bgColor={column.bgColor}
          />
        ))}
      </div>

      <DragOverlay>
        {activeJob ? (
          <div className="rotate-3">
            <KanbanCard
              id={activeJob.savedJobId}
              title={activeJob.title}
              company={activeJob.company}
              company_logo={activeJob.company_logo}
              location={activeJob.location}
              apply_url={activeJob.apply_url}
              job_type={activeJob.job_type}
              experience_level={activeJob.experience_level}
              skills={activeJob.skills}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
