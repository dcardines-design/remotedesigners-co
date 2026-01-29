// Upgrade all Clearbit logos to 256px for retina displays
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://urbmvgfxqygrxomcirub.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function upgradeLogos() {
  console.log('Upgrading Clearbit logos to 256px...')

  // Get count
  const { count } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .like('company_logo', '%logo.clearbit.com%')
    .not('company_logo', 'like', '%size=%')

  console.log(`Found ${count} logos to upgrade`)

  if (!count || count === 0) {
    console.log('Nothing to upgrade!')
    return
  }

  // Do in batches of 100
  let total = 0
  while (true) {
    const { data: batch, error } = await supabase
      .from('jobs')
      .select('id, company_logo')
      .like('company_logo', '%logo.clearbit.com%')
      .not('company_logo', 'like', '%size=%')
      .limit(100)

    if (error) {
      console.error('Fetch error:', error)
      break
    }

    if (!batch || batch.length === 0) break

    for (const job of batch) {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ company_logo: job.company_logo + '?size=256' })
        .eq('id', job.id)

      if (!updateError) total++
    }
    console.log(`Updated ${total} so far...`)
  }

  console.log(`\nDone! Total upgraded: ${total}`)
}

upgradeLogos().catch(console.error)
