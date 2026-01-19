/**
 * Job insights module - queries job data for blog content
 */

import { createServerSupabaseClient } from '@/lib/supabase'

export interface JobInsights {
  totalJobs: number
  jobsByType: Record<string, number>
  topCompanies: Array<{ company: string; count: number }>
  topLocations: Array<{ location: string; count: number }>
  recentTrends: {
    newJobsThisWeek: number
    newJobsLastWeek: number
    weeklyGrowth: number
  }
  salaryRanges: {
    average: { min: number; max: number } | null
    byType: Record<string, { min: number; max: number }>
  }
}

/**
 * Get comprehensive job market insights
 */
export async function getJobInsights(): Promise<JobInsights> {
  const supabase = createServerSupabaseClient()

  // Get all active jobs
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, company, location, job_type, salary_min, salary_max, posted_at')
    .order('posted_at', { ascending: false })
    .limit(10000)

  if (error || !jobs) {
    console.error('Error fetching jobs for insights:', error)
    return getEmptyInsights()
  }

  // Total jobs
  const totalJobs = jobs.length

  // Jobs by type
  const jobsByType: Record<string, number> = {}
  jobs.forEach(job => {
    const type = job.job_type || 'Other'
    jobsByType[type] = (jobsByType[type] || 0) + 1
  })

  // Top companies
  const companyCount: Record<string, number> = {}
  jobs.forEach(job => {
    if (job.company) {
      companyCount[job.company] = (companyCount[job.company] || 0) + 1
    }
  })
  const topCompanies = Object.entries(companyCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([company, count]) => ({ company, count }))

  // Top locations
  const locationCount: Record<string, number> = {}
  jobs.forEach(job => {
    if (job.location) {
      locationCount[job.location] = (locationCount[job.location] || 0) + 1
    }
  })
  const topLocations = Object.entries(locationCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([location, count]) => ({ location, count }))

  // Recent trends
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const newJobsThisWeek = jobs.filter(job => new Date(job.posted_at) >= oneWeekAgo).length
  const newJobsLastWeek = jobs.filter(job => {
    const date = new Date(job.posted_at)
    return date >= twoWeeksAgo && date < oneWeekAgo
  }).length

  const weeklyGrowth = newJobsLastWeek > 0
    ? Math.round(((newJobsThisWeek - newJobsLastWeek) / newJobsLastWeek) * 100)
    : 0

  // Salary ranges
  const jobsWithSalary = jobs.filter(job => job.salary_min && job.salary_max)
  let averageSalary: { min: number; max: number } | null = null

  if (jobsWithSalary.length > 0) {
    const avgMin = Math.round(jobsWithSalary.reduce((sum, job) => sum + (job.salary_min || 0), 0) / jobsWithSalary.length)
    const avgMax = Math.round(jobsWithSalary.reduce((sum, job) => sum + (job.salary_max || 0), 0) / jobsWithSalary.length)
    averageSalary = { min: avgMin, max: avgMax }
  }

  const salaryByType: Record<string, { min: number; max: number }> = {}
  Object.keys(jobsByType).forEach(type => {
    const typeJobs = jobsWithSalary.filter(job => job.job_type === type)
    if (typeJobs.length > 0) {
      salaryByType[type] = {
        min: Math.round(typeJobs.reduce((sum, job) => sum + (job.salary_min || 0), 0) / typeJobs.length),
        max: Math.round(typeJobs.reduce((sum, job) => sum + (job.salary_max || 0), 0) / typeJobs.length),
      }
    }
  })

  return {
    totalJobs,
    jobsByType,
    topCompanies,
    topLocations,
    recentTrends: {
      newJobsThisWeek,
      newJobsLastWeek,
      weeklyGrowth,
    },
    salaryRanges: {
      average: averageSalary,
      byType: salaryByType,
    },
  }
}

/**
 * Get insights for a specific job category
 */
export async function getCategoryInsights(category: string): Promise<{
  totalJobs: number
  topCompanies: Array<{ company: string; count: number }>
  averageSalary: { min: number; max: number } | null
}> {
  const supabase = createServerSupabaseClient()

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('company, salary_min, salary_max')
    .ilike('job_type', `%${category}%`)
    .limit(5000)

  if (error || !jobs) {
    return { totalJobs: 0, topCompanies: [], averageSalary: null }
  }

  const companyCount: Record<string, number> = {}
  jobs.forEach(job => {
    if (job.company) {
      companyCount[job.company] = (companyCount[job.company] || 0) + 1
    }
  })

  const topCompanies = Object.entries(companyCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([company, count]) => ({ company, count }))

  const jobsWithSalary = jobs.filter(job => job.salary_min && job.salary_max)
  let averageSalary: { min: number; max: number } | null = null

  if (jobsWithSalary.length > 0) {
    averageSalary = {
      min: Math.round(jobsWithSalary.reduce((sum, job) => sum + (job.salary_min || 0), 0) / jobsWithSalary.length),
      max: Math.round(jobsWithSalary.reduce((sum, job) => sum + (job.salary_max || 0), 0) / jobsWithSalary.length),
    }
  }

  return {
    totalJobs: jobs.length,
    topCompanies,
    averageSalary,
  }
}

function getEmptyInsights(): JobInsights {
  return {
    totalJobs: 0,
    jobsByType: {},
    topCompanies: [],
    topLocations: [],
    recentTrends: {
      newJobsThisWeek: 0,
      newJobsLastWeek: 0,
      weeklyGrowth: 0,
    },
    salaryRanges: {
      average: null,
      byType: {},
    },
  }
}

/**
 * Format salary for display
 */
export function formatSalary(amount: number): string {
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}k`
  }
  return `$${amount.toLocaleString()}`
}

/**
 * Generate hiring companies summary for blog content
 */
export function generateCompanySummary(companies: Array<{ company: string; count: number }>): string {
  if (companies.length === 0) return ''

  const topNames = companies.slice(0, 5).map(c => c.company)
  if (topNames.length === 1) return topNames[0]
  if (topNames.length === 2) return `${topNames[0]} and ${topNames[1]}`

  const last = topNames.pop()
  return `${topNames.join(', ')}, and ${last}`
}
