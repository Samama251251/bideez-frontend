const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface RehearsalSessionSummary {
  sessionId: string
  overallReadiness: string
  callDurationSecs: number
  questionCount: number
  createdAt: string
}

export async function getRehearsalSessions(
  workspaceId: string
): Promise<RehearsalSessionSummary[]> {
  const res = await fetch(`${API_BASE}/api/rehearsal/${workspaceId}/sessions`)
  if (!res.ok) return []
  const data = await res.json()
  return data.sessions ?? []
}

export async function getLatestRehearsalScore(
  workspaceId: string
): Promise<number | null> {
  const sessions = await getRehearsalSessions(workspaceId)
  if (sessions.length === 0) return null
  return Number(sessions[0].overallReadiness) || null
}
