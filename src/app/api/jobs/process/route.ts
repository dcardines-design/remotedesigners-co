import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase'
import { processJobWithAI } from '@/lib/ai-job-processor'

// Process jobs with AI to clean titles, format descriptions, extract skills
export async function POST(request: NextRequest) {
  try {
    const { limit = 10, force = false } = await request.json().catch(() => ({}))

    console.log(`Starting AI job processing (limit: ${limit}, force: ${force})...`)

    const supabase = createServerSupabaseClient()
    const adminSupabase = createAdminSupabaseClient()

    // Get jobs that need processing (don't have markdown headers yet)
    const { data: allJobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, title, company, description, location, job_type, experience_level, skills')
      .order('posted_at', { ascending: false })

    // Filter to jobs that haven't been processed with emoji format
    const jobs = allJobs
      ?.filter(j => !j.description?.includes('📄'))
      .slice(0, limit)

    if (fetchError) {
      throw fetchError
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No jobs to process',
      })
    }

    console.log(`Found ${jobs.length} jobs to process`)

    let processed = 0
    let failed = 0

    for (const job of jobs) {
      try {
        console.log(`Processing: ${job.title.slice(0, 50)}...`)

        const result = await processJobWithAI({
          title: job.title,
          company: job.company,
          description: job.description || '',
          location: job.location,
          job_type: job.job_type,
          experience_level: job.experience_level,
        })

        // Update job with AI-processed data
        // Note: summary and ai_processed fields require database migration
        const updateData: Record<string, unknown> = {
          title: result.cleanTitle,
          description: result.formattedDescription,
          job_type: result.jobType,
          experience_level: result.experienceLevel,
          skills: result.skills,
        }

        const { error: updateError } = await adminSupabase
          .from('jobs')
          .update(updateData)
          .eq('id', job.id)

        if (updateError) {
          console.error(`Failed to update job ${job.id}:`, updateError.message)
          failed++
        } else {
          processed++
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error)
        failed++
      }
    }

    console.log(`AI processing complete. Processed: ${processed}, Failed: ${failed}`)

    return NextResponse.json({
      success: true,
      processed,
      failed,
      total: jobs.length,
    })
  } catch (error) {
    console.error('AI job processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process jobs', details: String(error) },
      { status: 500 }
    )
  }
}
