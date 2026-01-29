// Script to backfill missing company names and logos from job URLs
// Usage: npx tsx scripts/backfill-company-info.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://urbmvgfxqygrxomcirub.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Extract company name from job URL
function extractCompanyFromUrl(url: string): string {
  if (!url) return ''

  // Lever: jobs.lever.co/companyname/...
  const leverMatch = url.match(/jobs\.lever\.co\/([^\/]+)/)
  if (leverMatch) return leverMatch[1]

  // SmartRecruiters: jobs.smartrecruiters.com/CompanyName/...
  // Skip if company name is "smartrecruiters" (generic)
  const smartMatch = url.match(/jobs\.smartrecruiters\.com\/([^\/]+)/)
  if (smartMatch && smartMatch[1].toLowerCase() !== 'smartrecruiters') {
    return smartMatch[1]
  }

  // Greenhouse: boards.greenhouse.io/companyname/...
  const greenhouseMatch = url.match(/boards\.greenhouse\.io\/([^\/]+)/)
  if (greenhouseMatch) return greenhouseMatch[1]

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

  // Workable: apply.workable.com/companyname/... (skip /j/ job IDs)
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

  // JazzHR: companyname.applytojob.com or jobs.jazzhr.com
  const jazzMatch = url.match(/([^.\/]+)\.jazz\.co/)
  if (jazzMatch) return jazzMatch[1]

  // Generic subdomain extraction (fallback)
  const subdomainMatch = url.match(/https?:\/\/([^.\/]+)\./)
  if (subdomainMatch) {
    const subdomain = subdomainMatch[1].toLowerCase()
    // Filter out generic subdomains
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

  // Filter out generic/junk names (job boards, generic words, single letters)
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

// Generate Clearbit logo URL
function getClearbitLogoUrl(companyName: string): string {
  if (!companyName) return ''

  const cleanName = companyName.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '')

  return `https://logo.clearbit.com/${cleanName}.com`
}

async function backfillCompanyInfo() {
  console.log('Fetching jobs with missing company info...\n')

  // Get jobs with empty company OR empty company_logo
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, company, company_logo, apply_url, source')
    .or('company.is.null,company.eq.')
    .order('posted_at', { ascending: false })
    .limit(500)

  if (error) {
    console.error('Error fetching jobs:', error)
    return
  }

  console.log(`Found ${jobs?.length || 0} jobs with missing company names\n`)

  if (!jobs || jobs.length === 0) {
    console.log('No jobs to update!')
    return
  }

  let updated = 0
  let skipped = 0
  let logoOnly = 0

  for (const job of jobs) {
    const extractedCompany = extractCompanyFromUrl(job.apply_url)
    const formattedCompany = formatCompanyName(extractedCompany)

    if (!formattedCompany) {
      console.log(`SKIP: ${job.title} - could not extract company from URL`)
      console.log(`      URL: ${job.apply_url?.slice(0, 60)}...`)
      skipped++
      continue
    }

    const logoUrl = getClearbitLogoUrl(formattedCompany)

    // Update the job
    const updateData: { company?: string; company_logo?: string } = {}

    if (!job.company) {
      updateData.company = formattedCompany
    }

    if (!job.company_logo) {
      updateData.company_logo = logoUrl
    }

    if (Object.keys(updateData).length === 0) {
      skipped++
      continue
    }

    const { error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', job.id)

    if (updateError) {
      console.error(`ERROR updating ${job.title}:`, updateError.message)
      skipped++
    } else {
      if (updateData.company) {
        console.log(`UPDATE: "${job.title}" -> Company: "${formattedCompany}"`)
        updated++
      } else {
        console.log(`LOGO: "${job.title}" -> Added logo for existing company`)
        logoOnly++
      }
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Updated company name: ${updated}`)
  console.log(`Added logo only: ${logoOnly}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Total processed: ${jobs.length}`)
}

// Also check for jobs with company but no logo
async function backfillLogosOnly() {
  console.log('\n\nChecking jobs with company but no logo...\n')

  // Junk company names to skip
  const junkNames = ['apply', 'www', 'unknown', 'careers', 'jobs', 'hire', 'recruiting', 'boards', 'smartrecruiters', 'page']

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, company, company_logo')
    .not('company', 'is', null)
    .neq('company', '')
    .or('company_logo.is.null,company_logo.eq.')
    .order('posted_at', { ascending: false })
    .limit(500)

  if (error) {
    console.error('Error fetching jobs:', error)
    return
  }

  console.log(`Found ${jobs?.length || 0} jobs with company but no logo\n`)

  if (!jobs || jobs.length === 0) {
    console.log('No jobs need logo updates!')
    return
  }

  let updated = 0
  let skipped = 0

  for (const job of jobs) {
    // Skip junk company names
    if (junkNames.includes(job.company.toLowerCase())) {
      skipped++
      continue
    }

    const logoUrl = getClearbitLogoUrl(job.company)

    const { error: updateError } = await supabase
      .from('jobs')
      .update({ company_logo: logoUrl })
      .eq('id', job.id)

    if (!updateError) {
      console.log(`LOGO: "${job.company}" -> ${logoUrl.slice(0, 50)}...`)
      updated++
    }
  }

  console.log(`\nAdded logos to ${updated} jobs (skipped ${skipped} junk names)`)
}

// Clean up junk company names (set to empty so they can be re-extracted)
async function cleanupJunkNames() {
  console.log('\n\nCleaning up junk company names...\n')

  const junkNames = [
    'Apply', 'Www', 'Unknown', 'Careers', 'Jobs', 'Hire', 'Recruiting', 'Boards', 'Page',
    'Authenticjobs', 'Glints', 'J', 'Careers Page', 'Smartrecruiters',
    'LinkedIn', 'Indeed', 'Glassdoor', 'Ziprecruiter', 'Monster', 'Careerbuilder',
    'Remote', 'Remotive', 'Weworkremotely', 'Flexjobs', 'Wellfound', 'Angel'
  ]

  let totalCleaned = 0

  for (const junkName of junkNames) {
    const { data, error } = await supabase
      .from('jobs')
      .update({ company: '', company_logo: '' })
      .eq('company', junkName)
      .select('id')

    if (!error && data && data.length > 0) {
      console.log(`Cleaned ${data.length} jobs with company "${junkName}"`)
      totalCleaned += data.length
    }
  }

  console.log(`Total cleaned: ${totalCleaned} jobs`)
}

async function main() {
  console.log('=== Backfill Company Info Script ===\n')

  // First clean up junk names
  await cleanupJunkNames()

  // Then backfill company names from URLs
  await backfillCompanyInfo()

  // Finally add logos for companies without them
  await backfillLogosOnly()

  console.log('\n=== Done! ===')
}

main().catch(console.error)
