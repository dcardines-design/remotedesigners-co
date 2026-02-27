export interface LandingPageStats {
  totalCount: number
  salaryMin: number | null
  salaryMax: number | null
  topCompanies: { name: string; count: number }[]
  postedToday: number
  postedThisWeek: number
  employmentBreakdown: { type: string; count: number }[]
}

export function computeLandingPageStats(jobs: any[], totalCount: number): LandingPageStats {
  const now = Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000
  const oneWeekMs = 7 * oneDayMs

  // Salary range from actual data
  const salaries: number[] = []
  for (const job of jobs) {
    if (job.salary_min && job.salary_min > 0) salaries.push(job.salary_min)
    if (job.salary_max && job.salary_max > 0) salaries.push(job.salary_max)
  }
  const salaryMin = salaries.length > 0 ? Math.min(...salaries) : null
  const salaryMax = salaries.length > 0 ? Math.max(...salaries) : null

  // Top companies
  const companyCounts: Record<string, number> = {}
  for (const job of jobs) {
    if (job.company) {
      companyCounts[job.company] = (companyCounts[job.company] || 0) + 1
    }
  }
  const topCompanies = Object.entries(companyCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Freshness
  let postedToday = 0
  let postedThisWeek = 0
  for (const job of jobs) {
    if (job.posted_at) {
      const diff = now - new Date(job.posted_at).getTime()
      if (diff < oneDayMs) postedToday++
      if (diff < oneWeekMs) postedThisWeek++
    }
  }

  // Employment type breakdown
  const typeCounts: Record<string, number> = {}
  for (const job of jobs) {
    const type = job.job_type || 'full-time'
    const label = type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')
    typeCounts[label] = (typeCounts[label] || 0) + 1
  }
  const employmentBreakdown = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  return { totalCount, salaryMin, salaryMax, topCompanies, postedToday, postedThisWeek, employmentBreakdown }
}

function formatSalaryShort(value: number): string {
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}k`
  }
  return `$${value.toLocaleString()}`
}

export function SEOLandingStats({ stats }: { stats: LandingPageStats }) {
  if (stats.totalCount === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {/* Job count */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <p className="text-2xl font-semibold text-neutral-900">{stats.totalCount.toLocaleString()}</p>
        <p className="text-sm text-neutral-500 mt-1">Open positions</p>
      </div>

      {/* Salary range */}
      {stats.salaryMin && stats.salaryMax && (
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-neutral-900">
            {formatSalaryShort(stats.salaryMin)} - {formatSalaryShort(stats.salaryMax)}
          </p>
          <p className="text-sm text-neutral-500 mt-1">Salary range</p>
        </div>
      )}

      {/* New this week */}
      {stats.postedThisWeek > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-neutral-900">{stats.postedThisWeek}</p>
          <p className="text-sm text-neutral-500 mt-1">New this week</p>
        </div>
      )}

      {/* Posted today */}
      {stats.postedToday > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-2xl font-semibold text-neutral-900">{stats.postedToday}</p>
          <p className="text-sm text-neutral-500 mt-1">Posted today</p>
        </div>
      )}

      {/* Top companies - spans full width */}
      {stats.topCompanies.length > 0 && (
        <div className="col-span-2 md:col-span-4 bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-sm font-medium text-neutral-900 mb-2">Top companies hiring</p>
          <div className="flex flex-wrap gap-2">
            {stats.topCompanies.map((company) => (
              <span
                key={company.name}
                className="bg-neutral-50 text-neutral-700 text-sm px-3 py-1 rounded-md border border-neutral-100"
              >
                {company.name}{company.count > 1 ? ` (${company.count})` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Employment type breakdown */}
      {stats.employmentBreakdown.length > 1 && (
        <div className="col-span-2 md:col-span-4 bg-white border border-neutral-200 rounded-lg p-4">
          <p className="text-sm font-medium text-neutral-900 mb-2">By employment type</p>
          <div className="flex flex-wrap gap-3">
            {stats.employmentBreakdown.map((item) => (
              <span key={item.type} className="text-sm text-neutral-600">
                {item.type}: <span className="font-medium text-neutral-900">{item.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
