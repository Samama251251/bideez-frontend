/**
 * Shared fetch helper for the bideez backend API.
 *
 * Framework-agnostic: every client function takes an optional bearer `token`
 * so it works from both Server Components (server session token) and Client
 * Components (browser session token via lib/api/browser.ts). `companyId` is
 * NEVER sent — the backend derives it from the token.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new ApiError(res.status, message)
  }

  // 202 / 204 responses may have an empty body.
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}
