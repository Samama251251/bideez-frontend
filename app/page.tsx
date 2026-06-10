import {
  ArrowUpRight,
  Check,
  X,
  TriangleAlert,
  Upload,
  Mail,
  Radar,
  RefreshCw,
  Brain,
  Trophy,
  Mic,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteNav } from "@/components/landing/site-nav"
import { Pipeline } from "@/components/landing/pipeline"

export default function Page() {
  return (
    <div id="top" className="relative min-h-svh overflow-x-clip">
      {/* ambient gradient backdrop gives the glass something to refract */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -top-40 left-[8%] size-[44rem] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--primary) 14%, transparent), transparent 70%)",
          }}
        />
        <div
          className="absolute top-[30%] right-[2%] size-[38rem] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--foreground) 8%, transparent), transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-10%] left-[30%] size-[40rem] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--primary) 10%, transparent), transparent 70%)",
          }}
        />
      </div>

      <SiteNav />

      <Hero />
      <Thesis />
      <Intake />
      <PipelineSection />
      <GateSection />
      <CreateSection />
      <LoopSection />
      <DefendSection />
      <CTA />
      <Footer />
    </div>
  )
}

/* ------------------------------ HERO ------------------------------ */

function Hero() {
  return (
    <section className="grain relative px-4 pt-36 pb-24 sm:pt-44">
      {/* faint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(70%_55%_at_50%_0%,black,transparent)] opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="animate-rise">
          <Badge
            variant="outline"
            className="gap-1.5 border-border bg-card py-1 font-mono text-[11px] tracking-wide"
          >
            <span className="size-1.5 rounded-full bg-primary" />
            AI BID &amp; PROPOSAL RESPONSE ENGINE
          </Badge>
        </div>

        <h1 className="mt-7 animate-rise text-5xl leading-[0.98] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
          Win the bids worth winning. Walk away from the rest.
        </h1>

        <p className="mt-7 max-w-xl animate-rise text-lg leading-relaxed text-balance text-muted-foreground [animation-delay:60ms]">
          bideez reads every tender, scores your real chance of winning, and
          flags the gaps that lose deals. Your team stops pouring weeks into
          bids it was never going to win, and starts writing the ones it can.
        </p>

        <div className="mt-9 flex animate-rise flex-wrap items-center justify-center gap-3 [animation-delay:120ms]">
          <Button size="lg" className="h-11 px-5 text-[15px]" asChild>
            <a href="#access">
              Get started
              <ArrowUpRight className="size-4" />
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 px-5 text-[15px]"
            asChild
          >
            <a href="#pipeline">See the pipeline</a>
          </Button>
        </div>

        <div className="mt-10 flex animate-rise flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs text-muted-foreground [animation-delay:180ms]">
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5" /> Decision gate before drafting
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5" /> Human-in-the-loop GO/NO-GO
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5" /> Zero-hallucination drafts
          </span>
        </div>
      </div>
    </section>
  )
}

/* ----------------------------- THESIS ----------------------------- */

function Thesis() {
  return (
    <section className="border-y border-border/60 bg-card/30 px-4 py-20">
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">
          Why teams switch
        </p>
        <p className="mt-5 font-display text-3xl leading-tight font-medium tracking-tight text-balance sm:text-4xl lg:text-5xl">
          Most tools stop at{" "}
          <span className="text-muted-foreground line-through decoration-gap/60">
            submit
          </span>
          . bideez decides{" "}
          <span className="text-primary">before you draft</span> and prepares
          you <span className="text-primary">for the call after</span>.
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
          The gaps the engine catches during analysis are the exact questions a
          buyer will press on later. It is one connected workflow, from
          &ldquo;should we even bid on this?&rdquo; to &ldquo;we are ready to
          defend it.&rdquo;
        </p>
      </div>
    </section>
  )
}

/* ----------------------------- INTAKE ----------------------------- */

const intakeMethods = [
  {
    icon: Upload,
    tag: "Auto-approved",
    title: "Manual upload",
    body: "Drop in a PDF or DOCX. bideez opens a dedicated workspace and starts working through it immediately.",
  },
  {
    icon: Mail,
    tag: "Approval required",
    title: "Connected inbox",
    body: "New tenders that land in your inbox are detected automatically and queued for review. Nothing starts until you approve it.",
  },
  {
    icon: Radar,
    tag: "Coming soon",
    title: "Opportunity discovery",
    body: "bideez surfaces open tenders that fit your capabilities and brings them to you as ranked leads.",
  },
]

function Intake() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          kicker="Intake"
          title="Three ways in. One clean workspace out."
          desc="However a tender reaches you, every approved RFP gets its own isolated workspace. It draws on your shared company knowledge without ever altering it."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {intakeMethods.map((m) => {
            const Icon = m.icon
            return (
              <div
                key={m.title}
                className="group glass relative overflow-hidden rounded-3xl p-6 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-border/60 bg-background text-primary">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </div>
                  <span className="rounded-full border border-border/60 px-2 py-0.5 font-mono text-[10px] tracking-wide text-muted-foreground">
                    {m.tag}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-medium">
                  {m.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {m.body}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------- PIPELINE ---------------------------- */

function PipelineSection() {
  return (
    <section id="pipeline" className="scroll-mt-24 px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          kicker="The pipeline"
          title="DECIDE. CREATE. VERIFY. DEFEND."
          desc="Four phases in every workspace, each building on the last. The compliance matrix you create up front carries all the way through to the call you prepare for at the end."
        />
        <div className="mt-12">
          <Pipeline />
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ GATE ------------------------------ */

const gateRequirements = [
  { label: "ISO 27001 certification", status: "pass" },
  { label: "5+ years public-sector delivery", status: "pass" },
  { label: "Dedicated account manager", status: "pass" },
  { label: "On-site SLA under 4 hours", status: "gap" },
  { label: "Local data residency (EU)", status: "scored" },
  { label: "Reference: 3 comparable projects", status: "pass" },
] as const

const severity = [
  {
    label: "Critical",
    color: "text-gap",
    dot: "bg-gap",
    body: "A gap on a mandatory requirement. This can disqualify the bid outright, so it goes straight to the GO/NO-GO decision.",
  },
  {
    label: "Scored",
    color: "text-scored",
    dot: "bg-scored",
    body: "Costs you points but keeps you in the running. Worth strengthening when the result is likely to be close.",
  },
  {
    label: "Minor",
    color: "text-muted-foreground",
    dot: "bg-muted-foreground",
    body: "Little to no impact on the evaluation. Recorded for reference, not escalated.",
  },
]

function GateSection() {
  return (
    <section
      id="gate"
      className="scroll-mt-24 border-y border-border/60 bg-card/30 px-4 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHead
          kicker="Phase 01 · The decision gate"
          title="See your compliance gaps and win probability before you write a word."
          desc="Analysis produces two things every bid team needs: a clear pass or fail on each requirement, and an honest read on your odds. Together they answer one question. Is this bid worth your team's week?"
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {/* compliance checklist */}
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-medium">
                Compliance checklist
              </h3>
              <span className="font-mono text-[11px] text-muted-foreground">
                4 PASS · 1 SCORED · 1 GAP
              </span>
            </div>
            <ul className="mt-5 grid gap-2">
              {gateRequirements.map((r) => (
                <li
                  key={r.label}
                  className="glass-subtle flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm"
                >
                  <ChecklistIcon status={r.status} />
                  <span
                    className={
                      r.status === "gap"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {r.label}
                  </span>
                  <span className="ml-auto">
                    {r.status === "pass" && (
                      <span className="font-mono text-[10px] text-go">
                        MATCHED
                      </span>
                    )}
                    {r.status === "gap" && (
                      <span className="rounded-full bg-gap/15 px-2 py-0.5 font-mono text-[10px] text-gap">
                        CRITICAL
                      </span>
                    )}
                    {r.status === "scored" && (
                      <span className="rounded-full bg-scored/15 px-2 py-0.5 font-mono text-[10px] text-scored">
                        SCORED
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* win dashboard */}
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-medium">
                Win-probability dashboard
              </h3>
              <Badge className="bg-primary/15 font-mono text-[11px] text-primary">
                71% overall
              </Badge>
            </div>

            <div className="mt-6 grid gap-5">
              <Gauge
                label="Budget alignment"
                value={78}
                note="Your cost band fits the stated envelope."
              />
              <Gauge
                label="Win-rate in this domain"
                value={64}
                note="From your historical bid outcomes."
              />
              <Gauge
                label="Competitor presence"
                value={41}
                note="Two known incumbents are likely bidding."
                inverse
              />
            </div>

            <p className="glass-subtle mt-6 rounded-xl px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
              A breakdown across the factors that matter, never a single mystery
              number. Every score traces back to your company knowledge and your
              own track record.
            </p>
          </div>
        </div>

        {/* severity legend */}
        <div className="glass mt-5 grid gap-4 rounded-3xl p-6 sm:grid-cols-3">
          {severity.map((s) => (
            <div key={s.label} className="flex gap-3">
              <span
                className={`mt-1.5 size-2 shrink-0 rounded-full ${s.dot}`}
              />
              <div>
                <p className={`font-mono text-xs tracking-wide ${s.color}`}>
                  {s.label.toUpperCase()}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* GO/NO-GO callout */}
        <div className="mt-5 flex flex-col items-center justify-between gap-5 rounded-3xl border border-primary/30 bg-primary/[0.07] p-6 sm:flex-row sm:p-8">
          <div>
            <p className="font-mono text-xs tracking-[0.16em] text-primary uppercase">
              The gate
            </p>
            <p className="mt-2 max-w-xl font-display text-2xl font-medium tracking-tight text-balance">
              The engine recommends. A human decides. NO-GO stops the line — and
              protects the week.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <span className="flex items-center gap-2 rounded-full border border-go/40 bg-go/10 px-4 py-2 font-mono text-sm text-go">
              <Check className="size-4" strokeWidth={2.5} /> GO
            </span>
            <span className="flex items-center gap-2 rounded-full border border-gap/40 bg-gap/10 px-4 py-2 font-mono text-sm text-gap">
              <X className="size-4" strokeWidth={2.5} /> NO-GO
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ----------------------------- CREATE ----------------------------- */

function CreateSection() {
  return (
    <section id="create" className="scroll-mt-24 px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          kicker="Phase 02 · Create"
          title="It drafts what it can prove. It flags what it can't."
          desc="The draft agent maps retrieved evidence to every question. Where there's no evidence, it leaves a flagged placeholder — and routes that gap to the expert who can close it."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          {/* draft preview */}
          <div className="glass overflow-hidden rounded-3xl">
            <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-5 py-3 font-mono text-[11px] text-muted-foreground">
              <PenLineDot /> draft / section-4.2-service-levels.md
            </div>
            <div className="space-y-4 p-6 text-sm leading-relaxed">
              <div>
                <p className="font-mono text-[10px] tracking-wide text-go">
                  ✓ EVIDENCE MATCHED · conf. 0.92
                </p>
                <p className="mt-1.5 text-foreground/90">
                  Our 24/7 NOC has maintained{" "}
                  <span className="rounded bg-go/15 px-1 text-go">
                    99.95% uptime across 11 public-sector contracts
                  </span>
                  , evidenced in the Westfield and County Rail case studies.
                </p>
              </div>
              <div className="rounded-xl border border-gap/30 bg-gap/[0.07] p-4">
                <p className="font-mono text-[10px] tracking-wide text-gap">
                  ⚠ NO SUPPORTING EVIDENCE — INPUT REQUIRED
                </p>
                <p className="mt-1.5 text-muted-foreground">
                  On-site response SLA under 4 hours. No matching record in the
                  capability library. Routed to{" "}
                  <span className="text-foreground">Field Ops</span> for input —
                  no answer will be invented.
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] tracking-wide text-scored">
                  ~ LOW CONFIDENCE · conf. 0.48
                </p>
                <p className="mt-1.5 text-muted-foreground">
                  EU data-residency posture drafted from a partial match —{" "}
                  <span className="text-foreground">flagged for review</span> by
                  Legal before it ships.
                </p>
              </div>
            </div>
          </div>

          {/* routing loop */}
          <div className="glass flex flex-col gap-4 rounded-3xl p-6">
            <h3 className="font-display text-lg font-medium">
              SME routing loop
            </h3>
            <p className="text-sm text-muted-foreground">
              Gaps and low-confidence sections — not just section ownership —
              decide who gets pinged.
            </p>
            <ol className="mt-2 grid gap-2.5">
              {[
                "Draft agent flags the gap",
                "Section emailed to the right expert",
                "Expert's input loops back in",
                "Draft revised → Final",
              ].map((step, i) => (
                <li
                  key={step}
                  className="glass-subtle flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[11px] text-primary">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ LOOP ------------------------------ */

const loopNodes = [
  {
    icon: Trophy,
    tag: "Source",
    title: "Bid outcome + human edits",
    body: "Won or lost, with reasons. Plus every change a human made to an AI draft.",
  },
  {
    icon: Brain,
    tag: "Store",
    title: "Tenant knowledge base",
    body: "A 'mistakes not to make' memory accumulates across every workspace.",
  },
  {
    icon: RefreshCw,
    tag: "Destination",
    title: "Smarter matcher & draft",
    body: "“Logistics bids lose on delivery timelines” → that section gets strengthened next time, automatically.",
  },
]

function LoopSection() {
  return (
    <section
      id="loop"
      className="scroll-mt-24 border-y border-border/60 bg-card/30 px-4 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHead
          kicker="The feedback loop"
          title="Every loss teaches the next bid."
          desc="A closed loop wired source → memory → downstream. Outcomes and edits feed a tenant-level memory that quietly reshapes how future bids are matched and drafted."
        />
        <div className="mt-12 grid items-stretch gap-4 md:grid-cols-3">
          {loopNodes.map((n, i) => {
            const Icon = n.icon
            return (
              <div key={n.tag} className="relative">
                <div className="glass h-full rounded-3xl p-6">
                  <span className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">
                    {n.tag}
                  </span>
                  <div className="mt-4 flex size-11 items-center justify-center rounded-2xl border border-border/60 bg-background text-primary">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-medium">
                    {n.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {n.body}
                  </p>
                </div>
                {i < loopNodes.length - 1 && (
                  <span className="absolute top-1/2 -right-3.5 z-10 hidden -translate-y-1/2 text-primary md:block">
                    →
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ----------------------------- DEFEND ----------------------------- */

function DefendSection() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="glass relative overflow-hidden rounded-[2rem] p-8 sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="border-border/70 font-mono text-[10px] tracking-wide"
                >
                  CAPSTONE ADD-ON
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  Phase 04 · Defend
                </span>
              </div>
              <h2 className="mt-5 max-w-2xl font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
                Then it rehearses you for the call that actually closes the
                deal.
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                An optional voice agent role-plays a skeptical buyer — asking
                the hardest questions first, drawn from the exact gaps and
                heaviest-weighted criteria the engine already flagged. It scores
                your defense and coaches the weak answers.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 font-mono text-[11px] text-muted-foreground">
                {[
                  "Ranked questions",
                  "Live follow-ups",
                  "Readiness score",
                  "Model answers",
                ].map((t) => (
                  <span key={t} className="glass-subtle rounded-full px-3 py-1">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 justify-center">
              <div className="relative flex size-36 items-center justify-center rounded-full border border-primary/30 bg-primary/[0.06]">
                <span className="absolute inline-flex size-36 animate-ping rounded-full bg-primary/10" />
                <span className="absolute size-24 rounded-full border border-primary/20" />
                <Mic className="size-9 text-primary" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ CTA ------------------------------- */

function CTA() {
  return (
    <section id="access" className="scroll-mt-24 px-4 pb-28">
      <div className="glass relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] px-6 py-16 text-center sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_120%,black,transparent)] opacity-[0.4]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">
          Built at a hackathon · in active development
        </p>
        <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
          Win more of the bids you choose to write.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          We&apos;re onboarding a first cohort of bid &amp; proposal teams. Tell
          us about your pipeline and we&apos;ll set up your workspace.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="h-11 px-6 text-[15px]" asChild>
            <a href="mailto:hello@bideez.ai?subject=Early%20access">
              Get started
              <ArrowUpRight className="size-4" />
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 px-6 text-[15px]"
            asChild
          >
            <a href="#pipeline">Walk the pipeline</a>
          </Button>
        </div>
      </div>
    </section>
  )
}

/* ----------------------------- FOOTER ----------------------------- */

function Footer() {
  return (
    <footer className="border-t border-border/60 px-4 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
          <span className="font-display text-base font-semibold">bideez</span>
          <span className="ml-2 text-sm text-muted-foreground">
            Decide. Create. Verify. Defend.
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a
            href="#pipeline"
            className="transition-colors hover:text-foreground"
          >
            Pipeline
          </a>
          <a href="#gate" className="transition-colors hover:text-foreground">
            The gate
          </a>
          <a href="#loop" className="transition-colors hover:text-foreground">
            The loop
          </a>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          © {new Date().getFullYear()} bideez
        </p>
      </div>
    </footer>
  )
}

/* --------------------------- PRIMITIVES --------------------------- */

function SectionHead({
  kicker,
  title,
  desc,
}: {
  kicker: string
  title: string
  desc: string
}) {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">
        {kicker}
      </p>
      <h2 className="mt-4 font-display text-3xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        {desc}
      </p>
    </div>
  )
}

function ChecklistIcon({ status }: { status: "pass" | "gap" | "scored" }) {
  if (status === "pass")
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-go/15 text-go">
        <Check className="size-3" strokeWidth={3} />
      </span>
    )
  if (status === "gap")
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gap/15 text-gap">
        <X className="size-3" strokeWidth={3} />
      </span>
    )
  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-scored/15 text-scored">
      <TriangleAlert className="size-3" strokeWidth={2.5} />
    </span>
  )
}

function Gauge({
  label,
  value,
  note,
  inverse,
}: {
  label: string
  value: number
  note: string
  inverse?: boolean
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-foreground">{label}</span>
        <span className="font-mono text-sm text-muted-foreground tabular-nums">
          {value}
          <span className="text-muted-foreground/60">/100</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={
            inverse
              ? "h-full rounded-full bg-gradient-to-r from-scored/70 to-scored"
              : "h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
          }
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

function PenLineDot() {
  return <span className="size-2 rounded-full bg-primary/70" />
}
