'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, Pause, Play, Pencil, Trash2, Plus, Clock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { PersonalizedAlertsModal } from '@/components/ui/personalized-alerts-modal'
import { RainbowButton } from '@/components/ui'

// Job type labels for display
const JOB_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  'product-design': { label: 'Product Design', emoji: '🎯' },
  'ux-design': { label: 'UX Design', emoji: '🔬' },
  'ui-design': { label: 'UI Design', emoji: '🎨' },
  'visual-design': { label: 'Visual Design', emoji: '👁️' },
  'brand-design': { label: 'Brand Design', emoji: '✨' },
  'graphic-design': { label: 'Graphic Design', emoji: '🖼️' },
  'motion-design': { label: 'Motion Design', emoji: '🎬' },
  'interaction-design': { label: 'Interaction Design', emoji: '👆' },
  'web-design': { label: 'Web Design', emoji: '🌐' },
  'design-systems': { label: 'Design Systems', emoji: '📐' },
  'design-lead': { label: 'Design Lead/Director', emoji: '👑' },
  'user-research': { label: 'User Research', emoji: '🔍' },
}

// Location labels for display
const LOCATION_LABELS: Record<string, { label: string; emoji: string }> = {
  'worldwide': { label: 'Anywhere in the World', emoji: '🌍' },
  'usa': { label: 'United States', emoji: '🇺🇸' },
  'europe': { label: 'Europe', emoji: '🇪🇺' },
  'uk': { label: 'United Kingdom', emoji: '🇬🇧' },
  'canada': { label: 'Canada', emoji: '🇨🇦' },
  'germany': { label: 'Germany', emoji: '🇩🇪' },
  'north-america': { label: 'North America', emoji: '🏈' },
  'latin-america': { label: 'Latin America', emoji: '💃' },
  'asia': { label: 'Asia', emoji: '⛩️' },
  'oceania': { label: 'Oceania', emoji: '🌊' },
  'middle-east': { label: 'Middle East', emoji: '🏜️' },
  'africa': { label: 'Africa', emoji: '🌍' },
}

interface AlertData {
  id: string
  email: string
  isActive: boolean
  frequency: string
  preferences: {
    jobTypes: string[]
    locations: string[]
  }
  lastEmailSentAt: string | null
  createdAt: string
}

interface AlertsResponse {
  hasAlerts: boolean
  alert: AlertData | null
  isPaidUser: boolean
}

export default function AlertsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [alertData, setAlertData] = useState<AlertsResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts')
      if (res.status === 401) {
        router.push('/')
        return
      }
      const data = await res.json()
      setAlertData(data)
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
      toast.error('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const handleTogglePause = async () => {
    if (!alertData?.alert) return
    setActionLoading(true)

    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !alertData.alert.isActive })
      })

      if (!res.ok) throw new Error('Failed to update')

      toast(alertData.alert.isActive ? 'Alert paused' : 'Alert resumed', {
        icon: (
          <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ),
      })
      fetchAlerts()
    } catch {
      toast.error('Failed to update alert')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your job alert?')) return
    setActionLoading(true)

    try {
      const res = await fetch('/api/alerts', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')

      toast('Alert deleted', {
        icon: (
          <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ),
      })
      fetchAlerts()
    } catch {
      toast.error('Failed to delete alert')
    } finally {
      setActionLoading(false)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    fetchAlerts()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-48 mb-8" />
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-neutral-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to jobs
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold text-neutral-900">My Job Alerts</h1>
              <p className="text-neutral-500 mt-1">
                Manage your email notification preferences
              </p>
            </div>
            {!alertData?.hasAlerts && (
              <div className="self-start md:self-auto">
                <RainbowButton onClick={() => setIsModalOpen(true)} size="sm">
                  Create alert
                </RainbowButton>
              </div>
            )}
          </div>
        </div>

        {alertData?.hasAlerts && alertData.alert ? (
          /* Alert Card */
          <div className="border border-neutral-200 rounded-xl bg-white overflow-hidden">
            {/* Status Header */}
            <div className={`px-6 py-5 border-b ${
              alertData.alert.isActive ? 'bg-green-50 border-green-100' : 'bg-neutral-50 border-neutral-100'
            }`}>
              {/* Mobile layout: stacked with buttons top-right */}
              <div className="relative md:hidden">
                <div className="flex items-center gap-2 absolute top-0 right-0">
                  <button
                    onClick={handleTogglePause}
                    disabled={actionLoading}
                    className="flex items-center justify-center w-9 h-9 rounded-lg border bg-white border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
                    title={alertData.alert.isActive ? 'Pause alert' : 'Resume alert'}
                  >
                    {alertData.alert.isActive ? <Pause className="w-4 h-4 text-neutral-500" /> : <Play className="w-4 h-4 text-neutral-500" />}
                  </button>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center w-9 h-9 rounded-lg border bg-white border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] active:translate-y-[1px] active:shadow-none transition-all"
                    title="Edit preferences"
                  >
                    <Pencil className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>
                <div className="flex flex-col items-start gap-3 pr-24">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    alertData.alert.isActive ? 'bg-green-100' : 'bg-neutral-200'
                  }`}>
                    <Bell className={`w-6 h-6 ${alertData.alert.isActive ? 'text-green-600' : 'text-neutral-400'}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 rounded ${
                      alertData.alert.isActive
                        ? 'bg-green-500 text-white'
                        : 'bg-neutral-300 text-neutral-600'
                    }`}>
                      {alertData.alert.isActive ? 'ACTIVE' : 'PAUSED'}
                    </span>
                    {alertData.isPaidUser && (
                      <span className="relative inline-flex items-center bg-pink-600 text-white text-[10px] font-medium tracking-wider px-2 py-0.5 rounded overflow-hidden">
                        <span
                          className="absolute animate-get-pro-shine"
                          style={{
                            inset: '-100%',
                            width: '300%',
                            backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.3) 45%, transparent 45%, transparent 47%, rgba(255,255,255,0.2) 47%, rgba(255,255,255,0.2) 48%, transparent 48%)',
                          }}
                        />
                        <span className="relative">MEMBER</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500">
                    {alertData.isPaidUser ? 'Daily personalized alerts' : 'Weekly alerts'}
                  </p>
                </div>
              </div>

              {/* Desktop layout: horizontal */}
              <div className="hidden md:flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    alertData.alert.isActive ? 'bg-green-100' : 'bg-neutral-200'
                  }`}>
                    <Bell className={`w-6 h-6 ${alertData.alert.isActive ? 'text-green-600' : 'text-neutral-400'}`} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium tracking-wider px-2 py-0.5 rounded ${
                        alertData.alert.isActive
                          ? 'bg-green-500 text-white'
                          : 'bg-neutral-300 text-neutral-600'
                      }`}>
                        {alertData.alert.isActive ? 'ACTIVE' : 'PAUSED'}
                      </span>
                      {alertData.isPaidUser && (
                        <span className="relative inline-flex items-center bg-pink-600 text-white text-[10px] font-medium tracking-wider px-2 py-0.5 rounded overflow-hidden">
                          <span
                            className="absolute animate-get-pro-shine"
                            style={{
                              inset: '-100%',
                              width: '300%',
                              backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.3) 45%, transparent 45%, transparent 47%, rgba(255,255,255,0.2) 47%, rgba(255,255,255,0.2) 48%, transparent 48%)',
                            }}
                          />
                          <span className="relative">MEMBER</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">
                      {alertData.isPaidUser ? 'Daily personalized alerts' : 'Weekly alerts'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePause}
                    disabled={actionLoading}
                    className="flex items-center justify-center w-9 h-9 rounded-lg border bg-white border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[1px] transition-all disabled:opacity-50"
                    title={alertData.alert.isActive ? 'Pause alert' : 'Resume alert'}
                  >
                    {alertData.alert.isActive ? <Pause className="w-4 h-4 text-neutral-500" /> : <Play className="w-4 h-4 text-neutral-500" />}
                  </button>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center w-9 h-9 rounded-lg border bg-white border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[1px] transition-all"
                    title="Edit preferences"
                  >
                    <Pencil className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Last sent */}
              {alertData.alert.lastEmailSentAt && (
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Clock className="w-4 h-4" />
                  Last email sent: {formatDate(alertData.alert.lastEmailSentAt)}
                </div>
              )}

              {/* Job Types */}
              <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-3">Job Types</h3>
                {alertData.alert.preferences.jobTypes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {alertData.alert.preferences.jobTypes.map(type => {
                      const info = JOB_TYPE_LABELS[type] || { label: type, emoji: '📋' }
                      return (
                        <span
                          key={type}
                          className="inline-flex items-center gap-1 bg-white text-neutral-600 text-[11px] px-2 py-0.5 rounded border border-neutral-200"
                        >
                          {info.emoji} {info.label}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400 italic">All job types</p>
                )}
              </div>

              {/* Locations */}
              <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-3">Locations</h3>
                {alertData.alert.preferences.locations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {alertData.alert.preferences.locations.map(loc => {
                      const info = LOCATION_LABELS[loc] || { label: loc, emoji: '📍' }
                      return (
                        <span
                          key={loc}
                          className="inline-flex items-center gap-1 bg-white text-neutral-600 text-[11px] px-2 py-0.5 rounded border border-neutral-200"
                        >
                          {info.emoji} {info.label}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400 italic">All locations</p>
                )}
              </div>

              {/* Upgrade CTA for free users */}
              {!alertData.isPaidUser && (
                <div className="bg-purple-50 rounded-lg px-4 py-3 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-neutral-900">Upgrade for daily alerts</span>
                    </div>
                    <Link
                      href="/membership"
                      className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      View plans
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100">
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete alert
              </button>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white border border-dashed border-neutral-300 rounded-xl px-12 py-20">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                <Bell className="w-8 h-8 text-neutral-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-medium text-neutral-900 mb-2">No job alerts set up yet</h2>
              <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
                Get notified when new jobs matching your preferences are posted.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white rounded-lg border border-neutral-200 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_1px_0px_0px_rgba(0,0,0,0.05)] hover:translate-y-[1px] transition-all"
              >
                <Plus className="w-4 h-4" />
                Set Up Job Alerts
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <PersonalizedAlertsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        userEmail={alertData?.alert?.email}
        existingPreferences={alertData?.alert?.preferences}
        isMember={alertData?.isPaidUser}
      />
    </div>
  )
}
