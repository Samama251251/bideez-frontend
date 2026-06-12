import { redirect } from "next/navigation"
import { Suspense } from "react"

import { createClient } from "@/lib/supabase/server"
import { IntegrationsPanel } from "@/components/settings/integrations-panel"
import { CompanyEnrichment } from "@/components/dashboard/company-enrichment"
import { CompanyMembersTable } from "@/components/settings/company-members-table"
import * as teamApi from "@/lib/api/team"
import type { CompanyMember } from "@/lib/api/types"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  let dbUser: Record<string, unknown> = {}
  let dbCompany: Record<string, unknown> | null = null
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile?email=${encodeURIComponent(user.email!)}`,
      { cache: "no-store" }
    )
    if (res.ok) {
      const d = await res.json()
      dbUser = d.user ?? {}
      dbCompany = d.company ?? null
    }
  } catch {}

  const userRole = (dbUser?.role as string) || "employee"

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  let members: CompanyMember[] = []
  try {
    const res = await teamApi.listMembers(token)
    members = res.members
  } catch {}

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="mb-8">
        <h1 className="font-display text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Configure integrations and account preferences.
        </p>
      </div>

      {/* Company profile — owner only */}
      {dbCompany && userRole === "owner" && (
        <section className="mb-10">
          <div className="mb-3">
            <h2 className="font-display text-sm font-semibold tracking-tight">
              Company profile
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              AI-researched profile used to score domain fit and generate win-probability
              estimates.
            </p>
          </div>
          <CompanyEnrichment email={user.email!} initialCompany={dbCompany as any} />
        </section>
      )}

      {/* Company members */}
      <section className="mb-10">
        <div className="mb-3">
          <h2 className="font-display text-sm font-semibold tracking-tight">Company members</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Everyone on your team, their speciality, and their role.
          </p>
        </div>
        <CompanyMembersTable members={members} />
      </section>

      {/* Integrations */}
      <section>
        <div className="mb-3">
          <h2 className="font-display text-sm font-semibold tracking-tight">Integrations</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Connect email sources so inbound RFPs land in your opportunities queue
            automatically.
          </p>
        </div>

        {/* Suspense required because IntegrationsPanel uses useSearchParams */}
        <Suspense fallback={null}>
          <IntegrationsPanel />
        </Suspense>
      </section>
    </div>
  )
}
