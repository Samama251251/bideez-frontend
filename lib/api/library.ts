/**
 * Backend API client for the Company Library (capability docs + historical
 * bid data). Same conventions as lib/api/workspaces.ts: every function takes
 * an optional bearer `token`, and `companyId` is never sent — the backend
 * derives it from the token.
 */
import { ApiError } from "./workspaces"
import type { AddBidInput, AddCapabilityInput, Capability, HistoricalBid, ImportResult } from "./types"

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

/** Like `request`, but for multipart/form-data — never set Content-Type
 * ourselves so the browser can attach the multipart boundary. */
async function requestForm<T>(path: string, formData: FormData, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    body: formData,
    cache: "no-store",
    headers: {
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

/* ----------------------------------------------------------------------------
 * Capabilities
 * ------------------------------------------------------------------------- */

export function listCapabilities(token?: string) {
  return request<{ capabilities: Capability[] }>("/api/library/capabilities", {}, token)
}

export function addCapability(body: AddCapabilityInput, token?: string) {
  return request<{ capability: Capability }>(
    "/api/library/capabilities",
    { method: "POST", body: JSON.stringify(body) },
    token
  )
}

export function importCapabilities(file: File, token?: string) {
  const formData = new FormData()
  formData.append("file", file)
  return requestForm<ImportResult>("/api/library/capabilities/import", formData, token)
}

export function deleteCapability(id: string, token?: string) {
  return request<void>(`/api/library/capabilities/${id}`, { method: "DELETE" }, token)
}

/* ----------------------------------------------------------------------------
 * Historical bids
 * ------------------------------------------------------------------------- */

export function listBids(token?: string) {
  return request<{ bids: HistoricalBid[] }>("/api/library/bids", {}, token)
}

export function addBid(body: AddBidInput, token?: string) {
  return request<{ bid: HistoricalBid }>(
    "/api/library/bids",
    { method: "POST", body: JSON.stringify(body) },
    token
  )
}

export function importBids(file: File, token?: string) {
  const formData = new FormData()
  formData.append("file", file)
  return requestForm<ImportResult>("/api/library/bids/import", formData, token)
}

export function deleteBid(id: string, token?: string) {
  return request<void>(`/api/library/bids/${id}`, { method: "DELETE" }, token)
}
