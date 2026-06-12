import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth")

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile?email=${encodeURIComponent(user.email!)}`,
    { cache: "no-store" }
  )

  if (!res.ok) redirect("/auth?onboarding=true")

  const profileData = await res.json()
  if (!profileData.onboardingComplete) redirect("/auth?onboarding=true")

  const dbUser = profileData.user
  const dbCompany = profileData.company

  const userName =
    dbUser?.name ||
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "User"
  const userRole = dbUser?.role || "employee"
  const companyName = dbCompany?.name || null

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar userName={userName} companyName={companyName} userRole={userRole} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
