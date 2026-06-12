/**
 * Company-level API client — tenant reads that aren't workspace-scoped.
 */
import { request } from "./request"
import type { CompanyMember } from "./types"

/** The tenant's team members (assignable SME reviewers). */
export function getMembers(token?: string) {
  return request<{ members: CompanyMember[] }>("/api/company/members", {}, token)
}
