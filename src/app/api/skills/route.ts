import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// Filter out generic terms that aren't actual skills
const EXCLUDED_TERMS = [
  'designer', 'design', 'digital nomad', 'lead', 'senior', 'junior',
  'entry', 'mid', 'technical', 'remote', 'hybrid', 'onsite', 'full-time',
  'part-time', 'contract', 'freelance', 'manager', 'director', 'intern'
]

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Fetch all skills arrays from active jobs
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('skills')
      .eq('is_active', true)
      .not('skills', 'is', null)

    if (error) {
      console.error('Supabase query error:', error)
      throw error
    }

    // Flatten and count skill occurrences
    const skillCounts: Record<string, number> = {}

    for (const job of jobs || []) {
      if (Array.isArray(job.skills)) {
        for (const skill of job.skills) {
          const normalized = skill.trim()
          // Skip excluded terms (case-insensitive)
          if (normalized && !EXCLUDED_TERMS.some(term => normalized.toLowerCase() === term.toLowerCase())) {
            skillCounts[normalized] = (skillCounts[normalized] || 0) + 1
          }
        }
      }
    }

    // Sort by frequency and return top skills
    const sortedSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30) // Top 30 most common skills
      .map(([skill, count]) => ({ skill, count }))

    return NextResponse.json({
      skills: sortedSkills,
    })
  } catch (error) {
    console.error('Skills API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}
