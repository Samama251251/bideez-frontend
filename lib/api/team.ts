/**
 * Backend API client for tenant team data (read-only). Same conventions as
 * lib/api/library.ts: every function takes an optional bearer `token`, and
 * `companyId` is never sent — the backend derives it from the token.
 */
import { request } from "./request"
import type { CompanyMember } from "./types"

export async function listMembers(token?: string): Promise<{ members: CompanyMember[] }> {
  return request<{ members: CompanyMember[] }>("/api/company/members", {}, token)
}
