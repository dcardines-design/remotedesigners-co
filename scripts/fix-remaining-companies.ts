// Fix remaining jobs with missing company names
// Usage: npx tsx scripts/fix-remaining-companies.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://urbmvgfxqygrxomcirub.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixRemaining() {
  console.log('Fetching jobs with missing company...\n')

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, source, apply_url')
    .or('company.is.null,company.eq.')

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log(`Found ${jobs?.length || 0} jobs\n`)

  let fixed = 0
  let deleted = 0
  let skipped = 0

  for (const job of jobs || []) {
    let company = ''
    let logoUrl = ''

    // SmartRecruiters self-hiring
    if (job.apply_url?.includes('jobs.smartrecruiters.com/smartrecruiters/')) {
      company = 'SmartRecruiters'
      logoUrl = 'https://logo.clearbit.com/smartrecruiters.com'
    }

    // AuthenticJobs: /job/ID/company-name-title
    const authMatch = job.apply_url?.match(/authenticjobs\.com\/job\/\d+\/([^-]+)-/)
    if (authMatch) {
      const companyName = authMatch[1]
      company = companyName.charAt(0).toUpperCase() + companyName.slice(1)
      logoUrl = `https://logo.clearbit.com/${companyName.toLowerCase()}.com`
    }

    // careers-page.com jobs - delete them (junk source)
    if (job.apply_url?.includes('careers-page.com')) {
      const { error: delErr } = await supabase.from('jobs').delete().eq('id', job.id)
      if (!delErr) {
        console.log(`DELETED (careers-page): ${job.title.slice(0, 50)}`)
        deleted++
      }
      continue
    }

    // Workable /j/ URLs without company - delete (junk data, no company extractable)
    if (job.apply_url?.includes('apply.workable.com/j/') && !company) {
      const { error: delErr } = await supabase.from('jobs').delete().eq('id', job.id)
      if (!delErr) {
        console.log(`DELETED (workable/j): ${job.title.slice(0, 50)}`)
        deleted++
      }
      continue
    }

    if (company) {
      const { error: updErr } = await supabase
        .from('jobs')
        .update({ company, company_logo: logoUrl })
        .eq('id', job.id)

      if (!updErr) {
        console.log(`FIXED: ${job.title.slice(0, 40)}... -> "${company}"`)
        fixed++
      }
    } else {
      console.log(`SKIP: ${job.title.slice(0, 50)}`)
      console.log(`      URL: ${job.apply_url?.slice(0, 60)}`)
      skipped++
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Fixed: ${fixed}`)
  console.log(`Deleted: ${deleted}`)
  console.log(`Skipped: ${skipped}`)
}

fixRemaining().catch(console.error)
