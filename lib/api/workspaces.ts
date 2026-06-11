/**
 * Backend API client for workspace / extraction endpoints.
 *
 * Framework-agnostic: every function takes an optional bearer `token` so it
 * works from both Server Components (server session token) and Client
 * Components (browser session token via lib/api/browser.ts). `companyId` is
 * NEVER sent — the backend derives it from the token.
 */
import type {
  CreateWorkspaceResponse,
  DocumentType,
  RequirementsResponse,
  StatusResponse,
  UploadUrlResponse,
  WorkspaceStatus,
  WorkspaceSummary,
} from "./types"

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

async function request<T>(
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

export function listWorkspaces(token?: string) {
  return request<{ workspaces: WorkspaceSummary[] }>("/api/workspaces", {}, token)
}

export function createWorkspace(
  body: { title: string; documentType?: DocumentType },
  token?: string
) {
  return request<CreateWorkspaceResponse>(
    "/api/workspaces",
    { method: "POST", body: JSON.stringify(body) },
    token
  )
}

export function getUploadUrl(workspaceId: string, filename: string, token?: string) {
  return request<UploadUrlResponse>(
    `/api/workspaces/${workspaceId}/upload-url`,
    { method: "POST", body: JSON.stringify({ filename }) },
    token
  )
}

export function confirmUploaded(workspaceId: string, storagePath: string, token?: string) {
  return request<{ status: WorkspaceStatus }>(
    `/api/workspaces/${workspaceId}/uploaded`,
    { method: "POST", body: JSON.stringify({ storagePath }) },
    token
  )
}

export function getStatus(workspaceId: string, token?: string) {
  return request<StatusResponse>(`/api/workspaces/${workspaceId}/status`, {}, token)
}

export function getRequirements(workspaceId: string, token?: string) {
  return request<RequirementsResponse>(
    `/api/workspaces/${workspaceId}/requirements`,
    {},
    token
  )
}

export function retryWorkspace(workspaceId: string, token?: string) {
  return request<{ status: WorkspaceStatus }>(
    `/api/workspaces/${workspaceId}/retry`,
    { method: "POST" },
    token
  )
}
