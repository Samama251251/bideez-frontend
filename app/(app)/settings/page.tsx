import { redirect } from "next/navigation"
import { Suspense } from "react"

import { createClient } from "@/lib/supabase/server"
import { IntegrationsPanel } from "@/components/settings/integrations-panel"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Configure integrations and account preferences.
        </p>
      </div>

      <div className="mb-4">
        <h2 className="font-display text-sm font-semibold tracking-tight">Integrations</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Connect email sources so inbound RFPs land in your review queue automatically.
        </p>
      </div>

      {/* Suspense required because IntegrationsPanel uses useSearchParams */}
      <Suspense fallback={null}>
        <IntegrationsPanel />
      </Suspense>
    </div>
  )
}
