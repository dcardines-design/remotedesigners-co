import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ycJobs = [
  {
    id: "1946066027",
    title: "AI Video Designer",
    organization: "Ello",
    organization_logo: "https://bookface-images.s3.amazonaws.com/small_logos/928879516f7652875f17aa5c190183b7d41f2982.png",
    location: "United States",
    salary_min: 30000,
    salary_max: 50000,
    employment_type: "contractor",
    url: "https://www.ycombinator.com/companies/ello/jobs/03wq5oN-ai-video-designer",
    date_posted: "2026-01-14T22:38:10"
  },
  {
    id: "1945596422",
    title: "Design Engineer Full-Time / Contractor",
    organization: "Streamable",
    organization_logo: "https://bookface-images.s3.amazonaws.com/small_logos/d318f4dc19468a1650202defffac7c3b9d4b5b40.png",
    location: "San Francisco, California, United States",
    salary_min: 1000,
    salary_max: 100000,
    employment_type: "contractor",
    url: "https://www.ycombinator.com/companies/streamable/jobs/c4WqzqS-design-engineer-full-time-contractor",
    date_posted: "2026-01-14T22:24:28"
  },
  {
    id: "1944033714",
    title: "Founding Designer",
    organization: "kapa.ai",
    organization_logo: "https://bookface-images.s3.amazonaws.com/small_logos/274c05ef6658ba8b2d341c95ee4d90f16444919c.png",
    location: "Denmark",
    salary_min: 75000,
    salary_max: 125000,
    employment_type: "full-time",
    url: "https://www.ycombinator.com/companies/kapa-ai/jobs/lPYIksu-founding-designer",
    date_posted: "2026-01-14T11:14:34"
  },
  {
    id: "1942912598",
    title: "Marketing Designer for Paid Social ads",
    organization: "Wanderlog",
    organization_logo: "https://bookface-images.s3.amazonaws.com/small_logos/9904ae948c8e0e97d71028dcbca777328465de82.png",
    location: "San Francisco, California, United States",
    salary_min: 65000,
    salary_max: 85000,
    employment_type: "full-time",
    url: "https://www.ycombinator.com/companies/wanderlog/jobs/PyU1iOc-marketing-designer-for-paid-social-ads-videographer-editor-united-states",
    date_posted: "2026-01-13T06:08:13"
  },
  {
    id: "1942979666",
    title: "Marketing Designer for Paid Social ads (Canada)",
    organization: "Wanderlog",
    organization_logo: "https://bookface-images.s3.amazonaws.com/small_logos/9904ae948c8e0e97d71028dcbca777328465de82.png",
    location: "Canada",
    salary_min: 75000,
    salary_max: 95000,
    employment_type: "full-time",
    url: "https://www.ycombinator.com/companies/wanderlog/jobs/ZFDEl20-marketing-designer-for-paid-social-ads-videographer-editor-canada",
    date_posted: "2026-01-13T06:04:14"
  },
  {
    id: "1939934324",
    title: "Designer",
    organization: "VectorShift",
    organization_logo: "https://bookface-images.s3.amazonaws.com/small_logos/5a28987b3e1b3effc2a33ce770fc25f4424fc775.png",
    location: "Remote",
    salary_min: 15000,
    salary_max: 35000,
    employment_type: "full-time",
    url: "https://www.ycombinator.com/companies/vectorshift/jobs/29f3JJH-designer",
    date_posted: "2026-01-11T22:56:12"
  }
]

async function importJobs() {
  let inserted = 0
  for (const job of ycJobs) {
    const externalId = `yc-${job.id}`

    // Check if job already exists
    const { data: existing } = await supabase
      .from('jobs')
      .select('id')
      .eq('external_id', externalId)
      .single()

    if (existing) {
      console.log(`Already exists: ${job.title} at ${job.organization}`)
      continue
    }

    const { error } = await supabase
      .from('jobs')
      .insert({
        external_id: externalId,
        source: 'ycombinator',
        title: job.title,
        company: job.organization,
        company_logo: job.organization_logo,
        location: job.location,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        description: `Apply to ${job.organization}: ${job.title}`,
        job_type: job.employment_type,
        apply_url: job.url,
        posted_at: job.date_posted,
        is_active: true,
        is_featured: false
      })

    if (!error) {
      inserted++
      console.log(`Inserted: ${job.title} at ${job.organization}`)
    } else {
      console.log(`Error: ${job.title} - ${error.message}`)
    }
  }
  
  const { count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  
  console.log(`\nTotal jobs in DB: ${count}`)
}

importJobs()
