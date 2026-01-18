import { NextRequest, NextResponse } from 'next/server'

// Import the sessions map from the parent route
// In production, this would be Redis/database lookup
const sessions = new Map<string, any>()

// We need to share sessions between routes - in production use Redis
// For now, we'll use a module-level import
import { getSession } from './session-store'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    )
  }

  const session = getSession(sessionId)

  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    )
  }

  // Return full session data
  return NextResponse.json({
    id: session.id,
    status: session.status,
    progress: session.progress,
    currentStep: session.currentStep,
    atsDetected: session.atsDetected,
    atsConfidence: session.atsConfidence,
    fieldsTotal: session.fieldsTotal,
    fieldsFilled: session.fieldsFilled,
    customQuestions: session.customQuestions,
    screenshots: session.screenshots,
    actionLog: session.actionLog,
    error: session.error,
    result: session.result,
    startedAt: session.startedAt,
    completedAt: session.completedAt
  })
}
