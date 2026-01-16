import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()

    // Deactivate jobs where expires_at has passed
    const { data, error } = await supabase
      .from('jobs')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true)
      .select('id, title, company')

    if (error) {
      console.error('Failed to expire jobs:', error)
      return NextResponse.json({ error: 'Failed to expire jobs' }, { status: 500 })
    }

    const expiredCount = data?.length || 0
    console.log(`[CRON] Expired ${expiredCount} jobs`)

    if (expiredCount > 0) {
      console.log('Expired jobs:', data.map(j => `${j.title} at ${j.company}`).join(', '))
    }

    return NextResponse.json({
      success: true,
      expired: expiredCount,
      jobs: data
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
