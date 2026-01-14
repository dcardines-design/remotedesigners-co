'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

interface ApplicationSession {
  id: string
  status: string
  progress: number
  currentStep: string
  atsDetected?: string
  startedAt?: string
  completedAt?: string
  error?: string
  screenshots?: string[]
  result?: {
    success: boolean
    confirmationMessage?: string
    confirmationScreenshot?: string
  }
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: {
    icon: <Clock className="w-5 h-5" />,
    color: 'text-yellow-500 bg-yellow-50',
    label: 'Pending'
  },
  navigating: {
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
    color: 'text-blue-500 bg-blue-50',
    label: 'Navigating'
  },
  detecting: {
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
    color: 'text-blue-500 bg-blue-50',
    label: 'Detecting'
  },
  filling: {
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
    color: 'text-blue-500 bg-blue-50',
    label: 'Filling Form'
  },
  uploading: {
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
    color: 'text-blue-500 bg-blue-50',
    label: 'Uploading'
  },
  submitting: {
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
    color: 'text-blue-500 bg-blue-50',
    label: 'Submitting'
  },
  completed: {
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-green-500 bg-green-50',
    label: 'Completed'
  },
  failed: {
    icon: <XCircle className="w-5 h-5" />,
    color: 'text-red-500 bg-red-50',
    label: 'Failed'
  },
  captcha: {
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-orange-500 bg-orange-50',
    label: 'CAPTCHA Required'
  },
  manual: {
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-orange-500 bg-orange-50',
    label: 'Manual Action Needed'
  }
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function ApplicationCard({ session, expanded, onToggle }: {
  session: ApplicationSession
  expanded: boolean
  onToggle: () => void
}) {
  const config = statusConfig[session.status] || statusConfig.pending

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${config.color}`}>
              {config.icon}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                Application #{session.id.split('_').pop()}
              </p>
              <p className="text-sm text-gray-500">
                {session.currentStep}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {session.atsDetected && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm capitalize">
                {session.atsDetected}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
              {config.label}
            </span>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Progress bar for in-progress applications */}
        {!['completed', 'failed'].includes(session.status) && (
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Progress</span>
              <span>{session.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${session.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Started</p>
              <p className="font-medium">{formatDate(session.startedAt)}</p>
            </div>
            <div>
              <p className="text-gray-500">Completed</p>
              <p className="font-medium">{formatDate(session.completedAt)}</p>
            </div>
          </div>

          {session.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-700">{session.error}</p>
            </div>
          )}

          {session.result?.confirmationMessage && (
            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
              <p className="text-sm text-green-700">{session.result.confirmationMessage}</p>
            </div>
          )}

          {/* Screenshots */}
          {session.screenshots && session.screenshots.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Screenshots</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {session.screenshots.map((screenshot, index) => (
                  <img
                    key={index}
                    src={screenshot}
                    alt={`Screenshot ${index + 1}`}
                    className="h-24 rounded border border-gray-200 flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {session.result?.confirmationScreenshot && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Confirmation</p>
              <img
                src={session.result.confirmationScreenshot}
                alt="Confirmation screenshot"
                className="rounded-lg border border-gray-200 max-w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ApplicationsPage() {
  const [sessions, setSessions] = useState<ApplicationSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/applications/auto-apply')
      if (!response.ok) throw new Error('Failed to fetch applications')
      const data = await response.json()
      setSessions(data.sessions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()

    // Poll for updates every 5 seconds if there are in-progress sessions
    const interval = setInterval(() => {
      if (sessions.some(s => !['completed', 'failed', 'captcha', 'manual'].includes(s.status))) {
        fetchSessions()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    failed: sessions.filter(s => s.status === 'failed').length,
    inProgress: sessions.filter(s => !['completed', 'failed', 'captcha', 'manual'].includes(s.status)).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Application History</h1>
              <p className="text-gray-500 mt-1">Track your auto-applied job applications</p>
            </div>
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-green-600">Completed</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-sm text-red-600">Failed</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-sm text-blue-600">In Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading applications...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchSessions}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-500 mb-4">
              Start by using the "Auto Apply" button on any job listing.
            </p>
            <a
              href="/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <ExternalLink className="w-4 h-4" />
              Browse Jobs
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <ApplicationCard
                key={session.id}
                session={session}
                expanded={expandedId === session.id}
                onToggle={() => setExpandedId(expandedId === session.id ? null : session.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
