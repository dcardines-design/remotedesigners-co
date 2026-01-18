import { NextRequest, NextResponse } from 'next/server'
import { createAuthSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createAuthSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch saved jobs
    const { data: savedJobs, error: savedError } = await supabase
      .from('saved_jobs')
      .select('id, job_id, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (savedError) {
      console.error('Error fetching saved jobs:', savedError)
      throw savedError
    }

    if (!savedJobs || savedJobs.length === 0) {
      return NextResponse.json({ jobs: [] })
    }

    // Get job IDs
    const jobIds = savedJobs.map(sj => sj.job_id)

    // Fetch job details
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, company, company_logo, location, salary_min, salary_max, salary_text, job_type, experience_level, skills, apply_url, posted_at, is_featured')
      .in('id', jobIds)

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      throw jobsError
    }

    // Create a map of jobs by ID
    const jobsMap = new Map((jobsData || []).map(job => [job.id, job]))

    // Transform the data - merge saved job info with job details
    const jobs = savedJobs
      .map(savedJob => {
        const job = jobsMap.get(savedJob.job_id)
        if (!job) return null
        return {
          savedJobId: savedJob.id,
          status: savedJob.status || 'saved',
          savedAt: savedJob.created_at,
          ...job,
        }
      })
      .filter(Boolean)

    // Check if user has an active paid subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const isMember = !!subscription

    return NextResponse.json({ jobs, isMember })
  } catch (error) {
    console.error('Saved jobs API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved jobs' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createAuthSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { savedJobId, status } = await request.json()

    if (!savedJobId || !status) {
      return NextResponse.json(
        { error: 'savedJobId and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['saved', 'applied', 'interviewing', 'offered', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update the status
    const { error } = await supabase
      .from('saved_jobs')
      .update({ status })
      .eq('id', savedJobId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating saved job status:', error)
      throw error
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('Saved jobs PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update saved job' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createAuthSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { savedJobId } = await request.json()

    if (!savedJobId) {
      return NextResponse.json(
        { error: 'savedJobId is required' },
        { status: 400 }
      )
    }

    // Delete the saved job
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', savedJobId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting saved job:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Saved jobs DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete saved job' },
      { status: 500 }
    )
  }
}
