// Script to extract company names from job descriptions when URL extraction fails
// Usage: npx tsx scripts/backfill-company-from-description.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://urbmvgfxqygrxomcirub.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Extract company name from job title patterns
function extractCompanyFromTitle(title: string): string {
  if (!title) return ''

  // Pattern: "Job Title at Company Name"
  const atMatch = title.match(/\bat\s+([A-Z][A-Za-z0-9\s&.'-]+)$/i)
  if (atMatch) return atMatch[1].trim()

  // Pattern: "Job Title | Company Name"
  const pipeMatch = title.match(/\|\s*([A-Z][A-Za-z0-9\s&.'-]+)$/i)
  if (pipeMatch) return pipeMatch[1].trim()

  // Pattern: "Job Title - Company Name" (at end)
  const dashEndMatch = title.match(/-\s*([A-Z][A-Za-z0-9\s&.'-]+)$/i)
  if (dashEndMatch) return dashEndMatch[1].trim()

  // Pattern: "Company Name - Job Title" (at start)
  const dashStartMatch = title.match(/^([A-Z][A-Za-z0-9\s&.'-]+)\s*-/i)
  if (dashStartMatch && !dashStartMatch[1].toLowerCase().includes('senior') &&
      !dashStartMatch[1].toLowerCase().includes('junior') &&
      !dashStartMatch[1].toLowerCase().includes('lead')) {
    return dashStartMatch[1].trim()
  }

  // Pattern: "[Job-12345] Title at Company" or similar
  const bracketMatch = title.match(/\]\s*.*?\bat\s+([A-Z][A-Za-z0-9\s&.'-]+)$/i)
  if (bracketMatch) return bracketMatch[1].trim()

  return ''
}

// Extract company name from job description
function extractCompanyFromDescription(description: string): string {
  if (!description) return ''

  // Clean HTML tags
  const cleanDesc = description
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

  // Common patterns in job descriptions

  // Pattern: "About Company Name" or "About Us at Company"
  const aboutMatch = cleanDesc.match(/About\s+([A-Z][A-Za-z0-9\s&.'-]{2,30})(?:\s|:|$)/i)
  if (aboutMatch && !aboutMatch[1].toLowerCase().includes('the role') &&
      !aboutMatch[1].toLowerCase().includes('the job') &&
      !aboutMatch[1].toLowerCase().includes('this position') &&
      !aboutMatch[1].toLowerCase().includes('us')) {
    return aboutMatch[1].trim()
  }

  // Pattern: "Company Name is hiring" or "Company Name is looking"
  const hiringMatch = cleanDesc.match(/^([A-Z][A-Za-z0-9\s&.'-]{2,30})\s+is\s+(hiring|looking|seeking)/i)
  if (hiringMatch) return hiringMatch[1].trim()

  // Pattern: "Join Company Name" at the start
  const joinMatch = cleanDesc.match(/^Join\s+([A-Z][A-Za-z0-9\s&.'-]{2,30})(?:\s|,|!)/i)
  if (joinMatch) return joinMatch[1].trim()

  // Pattern: "at Company Name," or "at Company Name." in first 200 chars
  const first200 = cleanDesc.slice(0, 200)
  const atInDescMatch = first200.match(/\bat\s+([A-Z][A-Za-z0-9\s&.'-]{2,30})(?:\.|,|\s)/i)
  if (atInDescMatch) return atInDescMatch[1].trim()

  // Pattern: "Company: Company Name" or "Employer: Company Name"
  const labelMatch = cleanDesc.match(/(?:Company|Employer|Organization):\s*([A-Z][A-Za-z0-9\s&.'-]{2,30})/i)
  if (labelMatch) return labelMatch[1].trim()

  // Pattern: "Position: ... at Company Name"
  const positionMatch = cleanDesc.match(/Position:.*?\bat\s+([A-Z][A-Za-z0-9\s&.'-]{2,30})/i)
  if (positionMatch) return positionMatch[1].trim()

  return ''
}

// Validate and clean company name
function validateCompanyName(name: string): string {
  if (!name || name.length < 2 || name.length > 50) return ''

  // Junk words to filter out
  const junkWords = [
    'remote', 'hybrid', 'full time', 'part time', 'contract', 'freelance',
    'senior', 'junior', 'lead', 'staff', 'principal', 'manager', 'director',
    'designer', 'developer', 'engineer', 'the role', 'the job', 'this position',
    'description', 'requirements', 'responsibilities', 'qualifications',
    'apply', 'click', 'submit', 'www', 'http', 'unknown', 'n/a', 'tbd',
    'various', 'multiple', 'confidential', 'our team', 'our company',
    'we are', 'you will', 'join us', 'looking for', 'seeking'
  ]

  const lowerName = name.toLowerCase()
  for (const junk of junkWords) {
    if (lowerName === junk || lowerName.startsWith(junk + ' ')) {
      return ''
    }
  }

  // Must start with a letter or number
  if (!/^[A-Za-z0-9]/.test(name)) return ''

  // Title case
  return name
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

async function backfillFromDescription() {
  console.log('Fetching jobs with missing company names...\n')

  // Get jobs with empty company
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, company, description, apply_url, source')
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

  let updatedFromTitle = 0
  let updatedFromDesc = 0
  let skipped = 0

  for (const job of jobs) {
    // Try title first
    let company = extractCompanyFromTitle(job.title)
    let source = 'title'

    // If no luck, try description
    if (!company && job.description) {
      company = extractCompanyFromDescription(job.description)
      source = 'description'
    }

    // Validate
    company = validateCompanyName(company)

    if (!company) {
      console.log(`SKIP: ${job.title.slice(0, 50)}...`)
      console.log(`      Source: ${job.source} | URL: ${job.apply_url?.slice(0, 50)}...`)
      skipped++
      continue
    }

    const logoUrl = getClearbitLogoUrl(company)

    // Update the job
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ company, company_logo: logoUrl })
      .eq('id', job.id)

    if (updateError) {
      console.error(`ERROR updating ${job.title}:`, updateError.message)
      skipped++
    } else {
      console.log(`UPDATE (${source}): "${job.title.slice(0, 40)}..." -> "${company}"`)
      if (source === 'title') updatedFromTitle++
      else updatedFromDesc++
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Updated from title: ${updatedFromTitle}`)
  console.log(`Updated from description: ${updatedFromDesc}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Total processed: ${jobs.length}`)
}

async function main() {
  console.log('=== Backfill Company from Description Script ===\n')
  await backfillFromDescription()
  console.log('\n=== Done! ===')
}

main().catch(console.error)
