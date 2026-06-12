import { notFound, redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getStatus, listWorkspaces } from "@/lib/api/workspaces"
import { ExtractionView } from "@/components/workspaces/extraction-view"
import type { ProposalVendor } from "@/lib/api/types"

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  let status
  try {
    status = await getStatus(id, token)
  } catch {
    notFound()
  }

  let title = "Workspace"
  try {
    const { workspaces } = await listWorkspaces(token)
    title = workspaces.find((w) => w.id === id)?.title ?? title
  } catch {}

  let userId = ""
  let userRole: "owner" | "employee" = "employee"
  let companyId = ""
  // The responding company's real details for the exported PDF's Contractor block.
  // Email falls back to the signed-in user; the rest come from the enriched company profile.
  const vendor: ProposalVendor = {
    name: null,
    address: null,
    website: null,
    email: user.email ?? null,
  }
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile?email=${encodeURIComponent(user.email!)}`,
      { cache: "no-store" }
    )
    if (res.ok) {
      const profile = await res.json()
      userId = profile.user?.id ?? ""
      userRole = profile.user?.role === "owner" ? "owner" : "employee"
      companyId = profile.user?.companyId ?? ""
      const company = profile.company
      if (company) {
        vendor.name = company.name ?? null
        vendor.address = company.location ?? null
        vendor.website = company.domain ?? null
      }
    }
  } catch {}

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <ExtractionView
        workspaceId={id}
        title={title}
        initialStatus={status.status}
        initialError={status.error}
        initialGoDecision={status.goDecision}
        userId={userId}
        userRole={userRole}
        companyId={companyId}
        vendor={vendor}
      />
    </div>
  )
}
