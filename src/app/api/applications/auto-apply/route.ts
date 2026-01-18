import { NextRequest, NextResponse } from 'next/server'
import { runAutoApply, AutoApplyInput, AutoApplySession } from '@/lib/auto-apply'
import { ResumeData } from '@/lib/pdf-generator'
import { UserProfile } from '@/lib/auto-apply/ai-responder'
import sessions, { setSession, getSession, getAllSessions } from './[sessionId]/session-store'

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['jobUrl', 'jobTitle', 'companyName', 'jobDescription', 'userProfile', 'resumeData', 'coverLetterContent']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate user profile
    const userProfile: UserProfile = body.userProfile
    if (!userProfile.fullName || !userProfile.email) {
      return NextResponse.json(
        { error: 'User profile must include fullName and email' },
        { status: 400 }
      )
    }

    // Validate resume data
    const resumeData: ResumeData = body.resumeData
    if (!resumeData.fullName || !resumeData.email) {
      return NextResponse.json(
        { error: 'Resume data must include fullName and email' },
        { status: 400 }
      )
    }

    // Generate session ID
    const sessionId = generateSessionId()

    // Create initial session
    const initialSession: AutoApplySession = {
      id: sessionId,
      status: 'pending',
      progress: 0,
      currentStep: 'Queued',
      fieldsTotal: 0,
      fieldsFilled: 0,
      customQuestions: [],
      screenshots: [],
      actionLog: []
    }
    setSession(sessionId, initialSession)

    // Prepare input
    const input: AutoApplyInput = {
      jobUrl: body.jobUrl,
      jobTitle: body.jobTitle,
      companyName: body.companyName,
      jobDescription: body.jobDescription,
      userProfile,
      resumeData,
      coverLetterContent: body.coverLetterContent
    }

    // Start auto-apply process in background
    runAutoApply(sessionId, input, (updatedSession) => {
      setSession(sessionId, updatedSession)
    }).then((finalSession) => {
      setSession(sessionId, finalSession)
    }).catch((error) => {
      const errorSession = getSession(sessionId)
      if (errorSession) {
        errorSession.status = 'failed'
        errorSession.error = error.message
        setSession(sessionId, errorSession)
      }
    })

    // Return session ID immediately
    return NextResponse.json({
      sessionId,
      status: 'pending',
      message: 'Auto-apply started. Use the session ID to check status.'
    })

  } catch (error) {
    console.error('Auto-apply error:', error)
    return NextResponse.json(
      { error: 'Failed to start auto-apply' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // List recent sessions (for debugging/admin)
  const allSessions = getAllSessions()
  const recentSessions = allSessions
    .sort((a, b) => {
      const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0
      const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0
      return bTime - aTime
    })
    .slice(0, 10)
    .map(session => ({
      id: session.id,
      status: session.status,
      progress: session.progress,
      currentStep: session.currentStep,
      atsDetected: session.atsDetected,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      error: session.error
    }))

  return NextResponse.json({
    sessions: recentSessions,
    total: allSessions.length
  })
}
