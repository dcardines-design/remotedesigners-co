import { AutoApplySession } from '@/lib/auto-apply'

// In-memory session store
// In production, replace with Redis or database
const sessions = new Map<string, AutoApplySession>()

export function getSession(sessionId: string): AutoApplySession | undefined {
  return sessions.get(sessionId)
}

export function setSession(sessionId: string, session: AutoApplySession): void {
  sessions.set(sessionId, session)
}

export function deleteSession(sessionId: string): boolean {
  return sessions.delete(sessionId)
}

export function getAllSessions(): AutoApplySession[] {
  return Array.from(sessions.values())
}

// Clean up old sessions (older than 24 hours)
export function cleanupOldSessions(): number {
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours
  let cleaned = 0

  for (const [id, session] of Array.from(sessions.entries())) {
    const startTime = session.startedAt ? new Date(session.startedAt).getTime() : 0
    if (now - startTime > maxAge) {
      sessions.delete(id)
      cleaned++
    }
  }

  return cleaned
}

export default sessions
