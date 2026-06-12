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
    <div className="dark relative grid min-h-svh overflow-x-clip bg-[#08080a] text-foreground lg:grid-cols-[1.05fr_1fr]">
      {/* ambient gradient backdrop — same technique as landing hero card (no negative z-index, DOM order paints it first) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[10%] right-[2%] h-[44rem] w-[44rem] rounded-full bg-[radial-gradient(circle,rgba(214,247,224,0.60),rgba(180,200,190,0.18)_45%,transparent_70%)] opacity-80 blur-2xl" />
        <div className="absolute top-[35%] right-[20%] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.30),transparent_65%)] opacity-55 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_60%_25%,transparent_40%,rgba(0,0,0,0.60))]" />
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 0.5px, transparent 0.6px)",
            backgroundSize: "46px 46px",
          }}
        />
      </div>

      {/* ---------------- brand panel (static) ---------------- */}
      <aside className="grain relative hidden flex-col justify-between overflow-hidden border-r border-border px-12 py-12 lg:flex">
        {/* glow — same technique as hero card */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-[15%] -left-[10%] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(214,247,224,0.40),rgba(180,200,190,0.10)_45%,transparent_70%)] opacity-70 blur-2xl" />
          <div className="absolute top-[40%] left-[20%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_65%)] opacity-50 blur-3xl" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(80%_60%_at_30%_20%,black,transparent)] opacity-[0.20]"
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
