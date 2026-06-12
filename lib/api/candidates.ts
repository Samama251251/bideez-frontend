/**
 * API client for inbound RFP intake — candidate review queue + Gmail/forwarding integrations.
 * Backend contract: docs/frontend-inbound-intake.md (in bideez-backend repo).
 */
import type {
  ApproveCandidateResponse,
  GmailStatus,
  IntakeAddressResponse,
  RfpCandidate,
  RfpCandidateStatus,
} from "./types"
import { ApiError } from "./workspaces"

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
      // non-JSON error body
    }
    throw new ApiError(res.status, message)
  }

  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

/* ---- Candidates ---- */

export function listCandidates(status: RfpCandidateStatus = "pending", token?: string) {
  return request<{ candidates: RfpCandidate[] }>(
    `/api/candidates?status=${status}`,
    {},
    token
  )
}

export function approveCandidate(id: string, token?: string) {
  return request<ApproveCandidateResponse>(
    `/api/candidates/${id}/approve`,
    { method: "POST" },
    token
  )
}

export function rejectCandidate(id: string, token?: string) {
  return request<{ status: string }>(
    `/api/candidates/${id}/reject`,
    { method: "POST" },
    token
  )
}

/* ---- Integrations ---- */

export function getIntakeAddress(token?: string) {
  return request<IntakeAddressResponse>("/api/candidates/intake-address", {}, token)
}

export function getGmailStatus(token?: string) {
  return request<GmailStatus>("/api/integrations/gmail/status", {}, token)
}

export function getGmailConnectUrl(token?: string) {
  return request<{ url: string }>("/api/integrations/gmail/connect", {}, token)
}
