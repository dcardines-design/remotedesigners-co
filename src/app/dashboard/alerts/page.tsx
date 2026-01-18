'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, Pause, Play, Pencil, Trash2, Plus, Clock, Sparkles, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PersonalizedAlertsModal } from '@/components/ui/personalized-alerts-modal'

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
        router.push('/login')
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

      toast.success(alertData.alert.isActive ? 'Alert paused' : 'Alert resumed')
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

      toast.success('Alert deleted')
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Job Alerts</h1>
            <p className="text-gray-600 mt-1">Manage your email notification preferences</p>
          </div>
        </div>

        {alertData?.hasAlerts && alertData.alert ? (
          /* Alert Card */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Status Header */}
            <div className={`px-6 py-4 flex items-center justify-between ${
              alertData.alert.isActive ? 'bg-green-50 border-b border-green-100' : 'bg-gray-50 border-b border-gray-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  alertData.alert.isActive ? 'bg-green-100' : 'bg-gray-200'
                }`}>
                  <Bell className={`w-5 h-5 ${alertData.alert.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                      alertData.alert.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        alertData.alert.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`}></span>
                      {alertData.alert.isActive ? 'Active' : 'Paused'}
                    </span>
                    {alertData.isPaidUser && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        <Sparkles className="w-3 h-3" />
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {alertData.isPaidUser ? 'Daily personalized alerts' : 'Alerts every 2 days'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePause}
                  disabled={actionLoading}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title={alertData.alert.isActive ? 'Pause alert' : 'Resume alert'}
                >
                  {alertData.alert.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Edit preferences"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-5">
              {/* Last sent */}
              {alertData.alert.lastEmailSentAt && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  Last email sent: {formatDate(alertData.alert.lastEmailSentAt)}
                </div>
              )}

              {/* Job Types */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Job Types</h3>
                {alertData.alert.preferences.jobTypes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {alertData.alert.preferences.jobTypes.map(type => {
                      const info = JOB_TYPE_LABELS[type] || { label: type, emoji: '📋' }
                      return (
                        <span
                          key={type}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                        >
                          {info.emoji} {info.label}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">All job types</p>
                )}
              </div>

              {/* Locations */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Locations</h3>
                {alertData.alert.preferences.locations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {alertData.alert.preferences.locations.map(loc => {
                      const info = LOCATION_LABELS[loc] || { label: loc, emoji: '📍' }
                      return (
                        <span
                          key={loc}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                        >
                          {info.emoji} {info.label}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">All locations</p>
                )}
              </div>

              {/* Upgrade CTA for free users */}
              {!alertData.isPaidUser && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Upgrade for Daily Alerts</p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Get personalized job alerts every day instead of every 2 days.
                      </p>
                      <Link
                        href="/pricing"
                        className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700 mt-2"
                      >
                        View plans
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete alert
              </button>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              No job alerts set up yet
            </h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Get notified when new jobs matching your preferences are posted.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Set Up Job Alerts
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <PersonalizedAlertsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        userEmail={alertData?.alert?.email}
        existingPreferences={alertData?.alert?.preferences}
      />
    </div>
  )
}
