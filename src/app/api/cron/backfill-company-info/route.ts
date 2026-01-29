import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return false
  }
  return true
}

// Extract company name from job URL
function extractCompanyFromUrl(url: string): string {
  if (!url) return ''

  // Lever: jobs.lever.co/companyname/...
  const leverMatch = url.match(/jobs\.lever\.co\/([^\/]+)/)
  if (leverMatch) return leverMatch[1]

  // SmartRecruiters: jobs.smartrecruiters.com/CompanyName/...
  const smartMatch = url.match(/jobs\.smartrecruiters\.com\/([^\/]+)/)
  if (smartMatch && smartMatch[1].toLowerCase() !== 'smartrecruiters') {
    return smartMatch[1]
  }

  // Greenhouse: boards.greenhouse.io/companyname/...
  const greenhouseMatch = url.match(/boards\.greenhouse\.io\/([^\/]+)/)
  if (greenhouseMatch) return greenhouseMatch[1]

  // Greenhouse job-boards: job-boards.greenhouse.io/companyname/...
  const greenhouseJobBoardsMatch = url.match(/job-boards\.greenhouse\.io\/([^\/]+)/)
  if (greenhouseJobBoardsMatch) return greenhouseJobBoardsMatch[1]

  // Ashby: jobs.ashbyhq.com/companyname/...
  const ashbyMatch = url.match(/jobs\.ashbyhq\.com\/([^\/]+)/)
  if (ashbyMatch) return ashbyMatch[1]

  // Workday: companyname.wd5.myworkdayjobs.com/...
  const workdayMatch = url.match(/([^.\/]+)\.wd\d+\.myworkdayjobs\.com/)
  if (workdayMatch) return workdayMatch[1]

  // BambooHR: companyname.bamboohr.com/...
  const bambooMatch = url.match(/([^.\/]+)\.bamboohr\.com/)
  if (bambooMatch) return bambooMatch[1]

  // ApplyToJob: companyname.applytojob.com/...
  const applyToJobMatch = url.match(/([^.\/]+)\.applytojob\.com/)
  if (applyToJobMatch) return applyToJobMatch[1]

  // Recruitee: companyname.recruitee.com/...
  const recruiteeMatch = url.match(/([^.\/]+)\.recruitee\.com/)
  if (recruiteeMatch) return recruiteeMatch[1]

  // Workable: apply.workable.com/companyname/...
  const workableMatch = url.match(/apply\.workable\.com\/([^\/]+)/)
  if (workableMatch && workableMatch[1] !== 'j') return workableMatch[1]

  // Careers subdomain: careers.companyname.com/...
  const careersMatch = url.match(/careers\.([^.\/]+)\.(com|co|io)/)
  if (careersMatch) return careersMatch[1]

  // HubSpot style: www.companyname.com/careers/...
  const wwwCareersMatch = url.match(/www\.([^.\/]+)\.(com|co|io)\/careers/)
  if (wwwCareersMatch) return wwwCareersMatch[1]

  // Breezy: companyname.breezy.hr/...
  const breezyMatch = url.match(/([^.\/]+)\.breezy\.hr/)
  if (breezyMatch) return breezyMatch[1]

  // JazzHR: companyname.jazz.co/...
  const jazzMatch = url.match(/([^.\/]+)\.jazz\.co/)
  if (jazzMatch) return jazzMatch[1]

  // Generic subdomain extraction (fallback)
  const subdomainMatch = url.match(/https?:\/\/([^.\/]+)\./)
  if (subdomainMatch) {
    const subdomain = subdomainMatch[1].toLowerCase()
    if (!['jobs', 'careers', 'boards', 'apply', 'www', 'hire', 'recruiting'].includes(subdomain)) {
      return subdomain
    }
  }

  return ''
}

// Clean and format company name
function formatCompanyName(name: string): string {
  if (!name) return ''

  // Normalize name first (replace hyphens with spaces)
  const normalizedName = name.replace(/-/g, ' ').trim().toLowerCase()

  // Filter out generic/junk names
  const junkNames = [
    'apply', 'www', 'unknown', 'careers', 'jobs', 'hire', 'recruiting', 'boards',
    'smartrecruiters', 'page', 'authenticjobs', 'glints', 'j', 'careers page',
    'linkedin', 'indeed', 'glassdoor', 'ziprecruiter', 'monster', 'careerbuilder',
    'remote', 'remotive', 'weworkremotely', 'flexjobs', 'wellfound', 'angel',
    'career', 'jobsite', 'talent', 'workable', 'careers page', 'career page'
  ]

  if (junkNames.includes(normalizedName) || normalizedName.includes('careers page') || name.length <= 2) {
    return ''
  }

  // Title case the normalized name
  return normalizedName
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()
}

// Generate Clearbit logo URL (256px for retina displays)
function getClearbitLogoUrl(companyName: string): string {
  if (!companyName) return ''

  const cleanName = companyName.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')

  return `https://logo.clearbit.com/${cleanName}.com?size=256`
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  if (process.env.CRON_SECRET && !verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabaseClient()
  const results = {
    junkCleaned: 0,
    companyNamesUpdated: 0,
    logosAdded: 0,
    skipped: 0,
    errors: [] as string[]
  }

  try {
    // Step 1: Clean up junk company names (set to empty so they can be re-extracted)
    const junkNames = [
      'Apply', 'Www', 'Unknown', 'Careers', 'Jobs', 'Hire', 'Recruiting', 'Boards', 'Page',
      'Authenticjobs', 'Glints', 'J', 'Careers Page', 'Smartrecruiters',
      'LinkedIn', 'Indeed', 'Glassdoor', 'Ziprecruiter', 'Monster', 'Careerbuilder',
      'Remote', 'Remotive', 'Weworkremotely', 'Flexjobs', 'Wellfound', 'Angel'
    ]

    for (const junkName of junkNames) {
      const { data, error } = await supabase
        .from('jobs')
        .update({ company: '', company_logo: '' })
        .eq('company', junkName)
        .select('id')

      if (!error && data && data.length > 0) {
        results.junkCleaned += data.length
      }
    }

    // Step 2: Backfill company names from URLs
    const { data: jobsNeedingCompany, error: fetchError } = await supabase
      .from('jobs')
      .select('id, title, company, company_logo, apply_url')
      .or('company.is.null,company.eq.')
      .order('posted_at', { ascending: false })
      .limit(200) // Process in chunks to avoid timeout

    if (fetchError) {
      results.errors.push(`Fetch error: ${fetchError.message}`)
    } else if (jobsNeedingCompany && jobsNeedingCompany.length > 0) {
      for (const job of jobsNeedingCompany) {
        const extractedCompany = extractCompanyFromUrl(job.apply_url)
        const formattedCompany = formatCompanyName(extractedCompany)

        if (!formattedCompany) {
          results.skipped++
          continue
        }

        // Only update company name, not logo (Clearbit logos are unreliable)
        const updateData: { company: string } = {
          company: formattedCompany
        }

        const { error: updateError } = await supabase
          .from('jobs')
          .update(updateData)
          .eq('id', job.id)

        if (updateError) {
          results.errors.push(`Update error for ${job.id}: ${updateError.message}`)
        } else {
          results.companyNamesUpdated++
        }
      }
    }

    // Note: We no longer auto-generate Clearbit logos as they're unreliable
    // Jobs without logos will show company initials in the UI

    console.log('Backfill company info complete:', results)

    return NextResponse.json({
      success: true,
      message: 'Backfill complete',
      results
    })
  } catch (error) {
    console.error('Backfill error:', error)
    return NextResponse.json({
      error: 'Backfill failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
