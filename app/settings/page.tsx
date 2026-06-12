import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Settings2 } from "lucide-react"
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
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Dashboard
      </Link>

      <div className="mb-8 flex items-center gap-2.5">
        <Settings2 className="size-5 text-primary" />
        <h1 className="font-display text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <div className="mb-4">
        <h2 className="font-display text-base font-semibold tracking-tight">Integrations</h2>
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
