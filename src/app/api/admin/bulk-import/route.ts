import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const maxDuration = 60 // 1 minute per batch

// Design keywords for filtering
const DESIGN_KEYWORDS = [
  'designer', 'design', 'ux', 'ui', 'ui/ux', 'ux/ui', 'product designer',
  'graphic designer', 'visual designer', 'brand designer', 'web designer',
  'motion designer', 'creative director', 'art director', 'figma', 'sketch'
]

function isDesignJob(title: string): boolean {
  const titleLower = title.toLowerCase()
  return DESIGN_KEYWORDS.some(kw => titleLower.includes(kw))
}

// Batch configurations - smaller batches for reliability
const INDEED_BATCHES: Record<number, { queries: string[]; localities: string[]; pages: number[] }> = {
  1: { queries: ['designer'], localities: ['us'], pages: [1, 2] },
  2: { queries: ['UI designer'], localities: ['us'], pages: [1, 2] },
  3: { queries: ['UX designer'], localities: ['us'], pages: [1, 2] },
  4: { queries: ['product designer'], localities: ['us'], pages: [1, 2] },
  5: { queries: ['graphic designer'], localities: ['us'], pages: [1, 2] },
  6: { queries: ['web designer'], localities: ['us'], pages: [1, 2] },
  7: { queries: ['designer'], localities: ['gb'], pages: [1, 2] },
  8: { queries: ['designer'], localities: ['ca'], pages: [1, 2] },
  9: { queries: ['designer'], localities: ['ph'], pages: [1, 2] },
  10: { queries: ['designer'], localities: ['de'], pages: [1, 2] },
}

// YC job title filters
const YC_FILTERS = [
  'designer OR design',
  'UX OR UI OR creative',
  'product designer',
  'graphic OR visual',
]

// GET /api/admin/bulk-import?batch=1 (Indeed) or ?batch=yc1 (YCombinator)
async function handleYCBatch(request: NextRequest, supabase: any, batchParam: string) {
  const batchNum = parseInt(batchParam.replace('yc', '')) || 1
  const filter = YC_FILTERS[batchNum - 1]

  if (!filter) {
    return NextResponse.json({
      error: 'Invalid YC batch number',
      availableBatches: YC_FILTERS.map((_, i) => `yc${i + 1}`)
    }, { status: 400 })
  }

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'No RapidAPI key configured' }, { status: 500 })
  }

  try {
    console.log(`Starting YC batch ${batchNum}: ${filter}`)

    const jobs: Array<{
      external_id: string
      source: string
      title: string
      company: string
      company_logo?: string
      location: string
      salary_min?: number
      salary_max?: number
      salary_text?: string
      description: string
      job_type: string
      apply_url: string
      posted_at: string
      is_active: boolean
      is_featured: boolean
    }> = []

    const seenIds = new Set<string>()
    let totalFetched = 0

    // Fetch from YC Jobs API - up to 3 pages (offset 0, 10, 20)
    for (let offset = 0; offset <= 20; offset += 10) {
      try {
        const url = `https://ycombinator.p.rapidapi.com/active-jb-7d?title_filter=${encodeURIComponent(filter)}&remote=true&offset=${offset}`

        const response = await fetch(url, {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'ycombinator.p.rapidapi.com'
          }
        })

        if (!response.ok) {
          console.log(`YC API error: ${response.status}`)
          continue
        }

        const data = await response.json()
        const jobsList = Array.isArray(data) ? data : (data.jobs || [])
        totalFetched += jobsList.length

        for (const job of jobsList) {
          const jobId = job.id || `${job.organization}-${job.title}`.replace(/\s+/g, '-').toLowerCase()
          const externalId = `yc-${jobId}`
          if (seenIds.has(externalId)) continue
          seenIds.add(externalId)

          const title = job.title || ''
          if (!isDesignJob(title)) continue

          // Parse salary from salary_raw structure
          let salaryMin: number | undefined
          let salaryMax: number | undefined
          let salaryText: string | undefined

          if (job.salary_raw?.value) {
            const salaryValue = job.salary_raw.value
            // Convert to yearly if needed (values are in thousands for some)
            salaryMin = salaryValue.minValue ? salaryValue.minValue * (salaryValue.minValue < 1000 ? 1000 : 1) : undefined
            salaryMax = salaryValue.maxValue ? salaryValue.maxValue * (salaryValue.maxValue < 1000 ? 1000 : 1) : undefined
            if (salaryMin && salaryMax) {
              salaryText = `$${salaryMin.toLocaleString()}-$${salaryMax.toLocaleString()}/yr`
            }
          }

          const postedAt = job.date_posted || job.date_created || new Date().toISOString()

          // Derive location from locations_derived or location_type
          let location = 'Remote'
          if (job.locations_derived && job.locations_derived.length > 0) {
            location = job.locations_derived[0]
          } else if (job.location_type === 'TELECOMMUTE') {
            location = 'Remote'
          }

          // Parse employment type
          let jobType = 'full-time'
          if (job.employment_type && job.employment_type.length > 0) {
            const empType = job.employment_type[0].toLowerCase()
            if (empType.includes('contract')) jobType = 'contract'
            else if (empType.includes('part')) jobType = 'part-time'
          }

          jobs.push({
            external_id: externalId,
            source: 'ycombinator',
            title,
            company: job.organization || 'YC Startup',
            company_logo: job.organization_logo,
            location,
            salary_min: salaryMin,
            salary_max: salaryMax,
            salary_text: salaryText,
            description: `Apply to ${job.organization}: ${title}`,
            job_type: jobType,
            apply_url: job.url || `https://www.ycombinator.com/companies`,
            posted_at: postedAt,
            is_active: true,
            is_featured: false,
          })
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 200))
      } catch (err) {
        console.error(`YC Error offset ${offset}:`, err)
      }
    }

    console.log(`YC Batch ${batchNum}: Found ${jobs.length} design jobs from ${totalFetched} total`)

    // Upsert to database
    let inserted = 0
    let skipped = 0

    for (const job of jobs) {
      const { error } = await supabase
        .from('jobs')
        .upsert(job, { onConflict: 'external_id', ignoreDuplicates: true })

      if (error) {
        skipped++
      } else {
        inserted++
      }
    }

    // Get total job count
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    return NextResponse.json({
      success: true,
      batch: `yc${batchNum}`,
      nextBatch: batchNum < YC_FILTERS.length ? `yc${batchNum + 1}` : null,
      fetched: totalFetched,
      designJobs: jobs.length,
      inserted,
      skipped,
      totalJobsInDB: count
    })

  } catch (error) {
    console.error('YC bulk import error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const batchParam = request.nextUrl.searchParams.get('batch') || '1'
  const isYC = batchParam.startsWith('yc')
  const supabase = createServerSupabaseClient()

  // Handle YCombinator batches
  if (isYC) {
    return handleYCBatch(request, supabase, batchParam)
  }

  const batchNum = parseInt(batchParam)
  const batch = INDEED_BATCHES[batchNum]

  if (!batch) {
    return NextResponse.json({
      error: 'Invalid batch number',
      availableBatches: [...Object.keys(INDEED_BATCHES).map(Number), 'yc1', 'yc2', 'yc3', 'yc4']
    }, { status: 400 })
  }

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'No RapidAPI key configured' }, { status: 500 })
  }

  try {
    console.log(`Starting batch ${batchNum}: ${batch.queries.join(', ')} in ${batch.localities.join(', ')}`)

    const jobs: Array<{
      external_id: string
      source: string
      title: string
      company: string
      company_logo?: string
      location: string
      salary_min?: number
      salary_max?: number
      salary_text?: string
      description: string
      job_type: string
      apply_url: string
      posted_at: string
      is_active: boolean
      is_featured: boolean
    }> = []

    const seenIds = new Set<string>()
    let totalFetched = 0

    for (const query of batch.queries) {
      for (const locality of batch.localities) {
        for (const pageId of batch.pages) {
          try {
            const url = `https://indeed12.p.rapidapi.com/jobs/search?query=${encodeURIComponent(query + ' remote')}&location=remote&page_id=${pageId}&locality=${locality}&fromage=14&sort=date`

            const response = await fetch(url, {
              headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'indeed12.p.rapidapi.com'
              }
            })

            if (!response.ok) continue

            const data = await response.json()
            const hits = data.hits || []
            totalFetched += hits.length

            for (const job of hits) {
              const externalId = `indeed-${job.id}`
              if (seenIds.has(externalId)) continue
              seenIds.add(externalId)

              const title = job.title || ''
              if (!isDesignJob(title)) continue

              // Parse salary
              let salaryMin: number | undefined
              let salaryMax: number | undefined
              let salaryText: string | undefined

              if (job.salary) {
                if (job.salary.type === 'YEARLY') {
                  salaryMin = job.salary.min || undefined
                  salaryMax = job.salary.max || undefined
                } else if (job.salary.type === 'HOURLY') {
                  // Convert hourly to yearly (2080 hours/year)
                  salaryMin = job.salary.min ? job.salary.min * 2080 : undefined
                  salaryMax = job.salary.max ? job.salary.max * 2080 : undefined
                  salaryText = `$${job.salary.min}-$${job.salary.max}/hr`
                }
              }

              const postedAt = job.pub_date_ts_milli
                ? new Date(job.pub_date_ts_milli).toISOString()
                : new Date().toISOString()

              jobs.push({
                external_id: externalId,
                source: 'indeed',
                title,
                company: job.company_name || 'Unknown',
                location: job.location || 'Remote',
                salary_min: salaryMin,
                salary_max: salaryMax,
                salary_text: salaryText,
                description: job.description || '',
                job_type: 'full-time',
                apply_url: `https://indeed.com/viewjob?jk=${job.id}`,
                posted_at: postedAt,
                is_active: true,
                is_featured: false,
              })
            }

            // Rate limit
            await new Promise(r => setTimeout(r, 150))
          } catch (err) {
            console.error(`Error: ${query} ${locality} page ${pageId}`, err)
          }
        }
      }
    }

    console.log(`Batch ${batchNum}: Found ${jobs.length} design jobs from ${totalFetched} total`)

    // Upsert to database
    let inserted = 0
    let skipped = 0

    for (const job of jobs) {
      const { error } = await supabase
        .from('jobs')
        .upsert(job, { onConflict: 'external_id', ignoreDuplicates: true })

      if (error) {
        skipped++
      } else {
        inserted++
      }
    }

    // Get total job count
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    return NextResponse.json({
      success: true,
      batch: batchNum,
      nextBatch: batchNum < 10 ? batchNum + 1 : null,
      fetched: totalFetched,
      designJobs: jobs.length,
      inserted,
      skipped,
      totalJobsInDB: count
    })

  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
