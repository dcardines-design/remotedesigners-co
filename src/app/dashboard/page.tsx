import Link from 'next/link'
import {
  Briefcase,
  FileText,
  Send,
  Bookmark,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  ArrowRight
} from 'lucide-react'

// Sample data (in production, fetch from Supabase)
const stats = {
  applications: 12,
  savedJobs: 8,
  interviews: 3,
  views: 45,
}

const recentApplications = [
  {
    id: '1',
    jobTitle: 'Senior Product Designer',
    company: 'Figma',
    status: 'interviewing',
    appliedAt: '2024-01-08',
  },
  {
    id: '2',
    jobTitle: 'UI/UX Designer',
    company: 'Webflow',
    status: 'applied',
    appliedAt: '2024-01-06',
  },
  {
    id: '3',
    jobTitle: 'Brand Designer',
    company: 'Notion',
    status: 'rejected',
    appliedAt: '2024-01-04',
  },
]

const savedJobs = [
  {
    id: '1',
    title: 'Product Designer',
    company: 'Linear',
    salary: '$130k - $170k',
  },
  {
    id: '2',
    title: 'Design Lead',
    company: 'Vercel',
    salary: '$180k - $220k',
  },
]

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Clock },
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-700', icon: Send },
  interviewing: { label: 'Interviewing', color: 'bg-yellow-100 text-yellow-700', icon: TrendingUp },
  offered: { label: 'Offered', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your job search progress</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.applications}</p>
                <p className="text-sm text-gray-500">Applications</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.interviews}</p>
                <p className="text-sm text-gray-500">Interviews</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.savedJobs}</p>
                <p className="text-sm text-gray-500">Saved Jobs</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.views}</p>
                <p className="text-sm text-gray-500">Profile Views</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Recent Applications</h2>
                <Link
                  href="/dashboard/applications"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View all
                </Link>
              </div>

              <div className="divide-y divide-gray-200">
                {recentApplications.map((app) => {
                  const status = statusConfig[app.status as keyof typeof statusConfig]
                  const StatusIcon = status.icon

                  return (
                    <div key={app.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{app.jobTitle}</h3>
                          <p className="text-sm text-gray-500">{app.company}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                          <span className="text-xs text-gray-400">{app.appliedAt}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {recentApplications.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No applications yet</p>
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 mt-2"
                  >
                    Browse jobs
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/resume-builder"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Resume Builder</p>
                    <p className="text-sm text-gray-500">Create or update resume</p>
                  </div>
                </Link>

                <Link
                  href="/cover-letter"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Cover Letter</p>
                    <p className="text-sm text-gray-500">Generate with AI</p>
                  </div>
                </Link>

                <Link
                  href="/jobs"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Browse Jobs</p>
                    <p className="text-sm text-gray-500">Find new opportunities</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Saved Jobs */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Saved Jobs</h2>
                <Link
                  href="/dashboard/saved"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View all
                </Link>
              </div>

              <div className="divide-y divide-gray-200">
                {savedJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block px-6 py-4 hover:bg-gray-50"
                  >
                    <h3 className="font-medium text-gray-900">{job.title}</h3>
                    <div className="flex justify-between mt-1">
                      <span className="text-sm text-gray-500">{job.company}</span>
                      <span className="text-sm text-gray-500">{job.salary}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
