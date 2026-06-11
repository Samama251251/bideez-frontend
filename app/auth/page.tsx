import Link from "next/link"
import { Check, Gauge } from "lucide-react"

import { AuthForm } from "@/components/auth/auth-form"

const valueProps = [
  "Score every opportunity before you commit",
  "Draft and route responses in one place",
  "Catch gaps before the buyer does",
]

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; onboarding?: string }>
}) {
  const { mode, onboarding } = await searchParams
  const initialMode = onboarding === "true" ? "onboarding" : mode === "signup" ? "signup" : "signin"

  return (
    <div className="relative grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      {/* ambient gradient backdrop */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -top-40 left-[6%] size-[44rem] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--primary) 14%, transparent), transparent 70%)",
          }}
        />
        <div
          className="absolute right-[8%] bottom-[-12%] size-[40rem] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--foreground) 8%, transparent), transparent 70%)",
          }}
        />
      </div>

      {/* ---------------- brand panel (static) ---------------- */}
      <aside className="grain relative hidden flex-col justify-between overflow-hidden border-r border-border px-12 py-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(80%_60%_at_30%_20%,black,transparent)] opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            bideez
          </span>
        </Link>

        <div className="max-w-md">
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
            AI BID &amp; PROPOSAL RESPONSE ENGINE
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-balance">
            Decide before you draft. Rehearse before you defend.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            A GO/NO-GO gate up front and a rehearsal stage at the end — wrapped
            around a pipeline that turns RFPs into winning responses.
          </p>

          <ul className="mt-8 space-y-3">
            {valueProps.map((line) => (
              <li
                key={line}
                className="flex items-center gap-2.5 text-sm text-foreground/80"
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3" />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] tracking-wide text-muted-foreground">
          <Gauge className="size-3.5" />
          DECIDE → CREATE → VERIFY → DEFEND
        </div>
      </aside>

      {/* ---------------- form panel (interactive) ---------------- */}
      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <AuthForm initialMode={initialMode} />
      </main>
    </div>
  )
}
