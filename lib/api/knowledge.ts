/**
 * Backend API client for the Company Knowledge Base (`/api/knowledge`).
 *
 * Uploaded PDF/DOCX evidence (policies, certs, past proposals) parsed to
 * markdown and used by the matcher. Same 3-step signed-URL upload flow as
 * workspaces: create row → get signed URL → upload to Supabase → confirm.
 * Parsing is async — poll the list/get for `ready`.
 *
 * Conventions match lib/api/workspaces.ts: optional bearer `token`, and
 * `companyId` is never sent (the backend derives it from the token).
 */
import { ApiError } from "./workspaces"
import type { KnowledgeDocument, UploadUrlResponse } from "./types"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
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

  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export function listKnowledge(token?: string) {
  return request<{ documents: KnowledgeDocument[] }>("/api/knowledge", {}, token)
}

/** Step 1 — create the document row. */
export function createKnowledge(title: string, token?: string) {
  return request<{ id: string; title: string }>(
    "/api/knowledge",
    { method: "POST", body: JSON.stringify({ title }) },
    token
  )
}

/** Step 2 — get a signed upload URL for the raw file. */
export function getKnowledgeUploadUrl(id: string, filename: string, token?: string) {
  return request<UploadUrlResponse>(
    `/api/knowledge/${id}/upload-url`,
    { method: "POST", body: JSON.stringify({ filename }) },
    token
  )
}

/** Step 3 — confirm the upload; kicks off async parsing. */
export function confirmKnowledgeUploaded(id: string, storagePath: string, token?: string) {
  return request<{ status: string }>(
    `/api/knowledge/${id}/uploaded`,
    { method: "POST", body: JSON.stringify({ storagePath }) },
    token
  )
}

/** Re-run a failed/stuck parse. */
export function retryKnowledge(id: string, token?: string) {
  return request<{ status: string }>(
    `/api/knowledge/${id}/retry`,
    { method: "POST" },
    token
  )
}

export function deleteKnowledge(id: string, token?: string) {
  return request<void>(`/api/knowledge/${id}`, { method: "DELETE" }, token)
}
