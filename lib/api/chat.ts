/**
 * Client for the Copilot chat endpoint. The backend streams newline-delimited
 * JSON events (one ChatEvent per line) — mostly `token` text chunks, plus an
 * occasional `decision_request` when the agent wants the user to confirm a
 * GO/NO-GO call.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

export type ChatMessage = { role: "user" | "assistant"; content: string }

export interface DecisionChecklistItem {
  requirementId: string
  text: string
  status: string
  gapSeverity: string | null
}

export interface DecisionRequestPayload {
  workspaceId: string
  status: string
  recommendedDecision: string | null
  decisionRationale: string | null
  winProbability: number | null
  checklist: {
    passCount: number
    failCount: number
    items: DecisionChecklistItem[]
  }
}

export type ChatEvent =
  | { type: "token"; text: string }
  | { type: "decision_request"; payload: DecisionRequestPayload }
  | { type: "error"; message: string }

/**
 * Send the conversation so far and stream the agent's events.
 * `onEvent` is called for each parsed ChatEvent as it arrives.
 */
export async function streamChat(
  messages: ChatMessage[],
  token: string | undefined,
  onEvent: (event: ChatEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages }),
    signal,
  })

  if (!res.ok || !res.body) {
    let message = res.statusText
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new Error(message || "chat request failed")
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let newlineIndex: number
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim()
      buffer = buffer.slice(newlineIndex + 1)
      if (!line) continue
      onEvent(JSON.parse(line) as ChatEvent)
    }
  }

  const trailing = buffer.trim()
  if (trailing) onEvent(JSON.parse(trailing) as ChatEvent)
}
