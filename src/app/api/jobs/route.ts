import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { LOCATION_KEYWORDS } from '@/lib/location-keywords'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search')?.toLowerCase()
    const location = searchParams.get('location')?.toLowerCase()
    const jobType = searchParams.get('type')?.toLowerCase()
    const skills = searchParams.get('skills')
    const experience = searchParams.get('experience')?.toLowerCase()
    const salaryMin = searchParams.get('salary_min')
    const salaryMax = searchParams.get('salary_max')
    const datePosted = searchParams.get('date_posted')
    const remoteType = searchParams.get('remote_type')?.toLowerCase()
    const titleKeywords = searchParams.get('title_keywords')
    const locationKeywords = searchParams.get('location_keywords')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query - sticky jobs first, then featured, then by date
    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('is_sticky', { ascending: false, nullsFirst: false })
      .order('is_featured', { ascending: false })
      .order('posted_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`)
    }

    if (location && location !== 'all') {
      // Support multiple locations and expand each to its keywords
      const locations = location.split(',').map(l => l.trim())
      const allKeywords = locations.flatMap(loc => LOCATION_KEYWORDS[loc] || [loc])
      const orConditions = allKeywords.map(kw => `location.ilike.%${kw}%`).join(',')
      query = query.or(orConditions)
    }

    if (jobType && jobType !== 'all') {
      query = query.ilike('job_type', `%${jobType}%`)
    }

    // Skills filter - check if any of the requested skills are in the job's skills array
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim())
      // Use overlaps to check if job has ANY of the requested skills
      query = query.overlaps('skills', skillsArray)
    }

    // Experience level filter
    if (experience && experience !== 'all') {
      query = query.ilike('experience_level', `%${experience}%`)
    }

    // Salary range filters
    if (salaryMin) {
      query = query.gte('salary_min', parseInt(salaryMin))
    }
    if (salaryMax) {
      query = query.lte('salary_max', parseInt(salaryMax))
    }

    // Date posted filter
    if (datePosted && datePosted !== 'all') {
      const days = parseInt(datePosted.replace('d', ''))
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      query = query.gte('posted_at', cutoffDate.toISOString())
    }

    // Remote type filter
    if (remoteType && remoteType !== 'all') {
      if (remoteType === 'remote') {
        query = query.ilike('location', '%remote%')
      } else if (remoteType === 'hybrid') {
        query = query.ilike('location', '%hybrid%')
      } else if (remoteType === 'onsite') {
        query = query.not('location', 'ilike', '%remote%').not('location', 'ilike', '%hybrid%')
      }
    }

    // Title keywords filter (for SEO landing pages - matches any keyword in title)
    if (titleKeywords) {
      const keywords = titleKeywords.split(',').map(k => k.trim().toLowerCase())
      const orConditions = keywords.map(k => `title.ilike.%${k}%`).join(',')
      query = query.or(orConditions)
    }

    // Location keywords filter (for regional SEO pages - matches any keyword in location)
    if (locationKeywords) {
      const keywords = locationKeywords.split(',').map(k => k.trim().toLowerCase())
      const orConditions = keywords.map(k => `location.ilike.%${k}%`).join(',')
      query = query.or(orConditions)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: jobs, error, count } = await query

    if (error) {
      console.error('Supabase query error:', error)
      throw error
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    const now = new Date().toISOString()

    // Transform to match frontend expected format
    // Check if sticky has expired - if sticky_until is in the past, treat as not sticky
    const normalizedJobs = (jobs || []).map(job => {
      const isStillSticky = job.is_sticky && job.sticky_until && job.sticky_until > now
      return {
        id: job.id,
        source: job.source,
        title: job.title,
        company: job.company,
        company_logo: job.company_logo,
        location: job.location,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_text: job.salary_text,
        description: job.description,
        job_type: job.job_type,
        experience_level: job.experience_level,
        skills: job.skills || [],
        apply_url: job.apply_url,
        posted_at: job.posted_at,
        is_featured: job.is_featured,
        is_sticky: isStillSticky,
        sticky_until: job.sticky_until,
        is_rainbow: job.is_rainbow || false,
      }
    })

    // Re-sort to account for expired sticky jobs
    // Order: active sticky first, then featured, then by date
    normalizedJobs.sort((a, b) => {
      // Sticky jobs first
      if (a.is_sticky && !b.is_sticky) return -1
      if (!a.is_sticky && b.is_sticky) return 1
      // Then featured
      if (a.is_featured && !b.is_featured) return -1
      if (!a.is_featured && b.is_featured) return 1
      // Then by date (newest first)
      return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
    })

    return NextResponse.json({
      jobs: normalizedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (error) {
    console.error('Jobs API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}
