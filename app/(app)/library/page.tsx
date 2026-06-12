import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import * as libraryApi from "@/lib/api/library"
import type { Capability, HistoricalBid } from "@/lib/api/types"
import { LibraryTabs } from "@/components/library/library-tabs"

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  let capabilities: Capability[] = []
  let bids: HistoricalBid[] = []
  try {
    const [capRes, bidRes] = await Promise.all([
      libraryApi.listCapabilities(token),
      libraryApi.listBids(token),
    ])
    capabilities = capRes.capabilities
    bids = bidRes.bids
  } catch {}

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold tracking-tight">Company library</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Capability docs and past bid history feed the matcher and win-probability dashboard.
          Upload a CSV/XLSX or add rows manually.
        </p>
      </div>

      <LibraryTabs initialCapabilities={capabilities} initialBids={bids} />
    </div>
  )
}
