import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Play,
  Sparkles,
  Check,
  RefreshCw,
  Brain,
  Trophy,
  Mic,
  ScanSearch,
  PenLine,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SiteNav } from "@/components/landing/site-nav"
import { SmoothScroll } from "@/components/landing/smooth-scroll"

export default function Page() {
  return (
    <div
      id="top"
      className="dark relative min-h-svh overflow-x-clip bg-[#08080a] text-foreground"
    >
      {/* hero-matched ambient: glows distributed down the whole page so every
          section below the hero gets the same gradient bloom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute top-[30%] right-[2%] h-[44rem] w-[44rem] rounded-full bg-[radial-gradient(circle,rgba(214,247,224,0.16),transparent_62%)] blur-3xl" />
        <div className="absolute top-[46%] -left-[8%] h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.07),transparent_64%)] blur-3xl" />
        <div className="absolute top-[64%] right-[6%] h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(214,247,224,0.14),transparent_62%)] blur-3xl" />
        <div className="absolute top-[82%] -left-[4%] h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle,rgba(214,247,224,0.11),transparent_64%)] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.5) 0.5px, transparent 0.6px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <SiteNav />
      <SmoothScroll />

      <Hero />
      <Thesis />
      <LoopSection />
      <DefendSection />
      <CTA />
      <Footer />
    </div>
  )
}

/* ------------------------------ HERO ------------------------------ */

const heroNodes = [
  {
    icon: ScanSearch,
    name: "Decide",
    phase: "01",
    pos: "top-[16%] left-[5%] sm:left-[7%]",
    align: "left" as const,
  },
  {
    icon: PenLine,
    name: "Create",
    phase: "02",
    pos: "top-[22%] right-[5%] sm:right-[7%]",
    align: "right" as const,
  },
  {
    icon: RefreshCw,
    name: "Verify",
    phase: "03",
    pos: "bottom-[24%] left-[5%] sm:left-[8%]",
    align: "left" as const,
  },
  {
    icon: ShieldCheck,
    name: "Defend",
    phase: "04",
    pos: "bottom-[20%] right-[5%] sm:right-[7%]",
    align: "right" as const,
  },
]

function Hero() {
  return (
    <section className="px-3 pt-20 sm:px-4 sm:pt-24">
      <div className="grain relative mx-auto flex min-h-[42rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#080809] sm:min-h-[46rem]">
        {/* radial light source bleeding in from the upper-right */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-[10%] right-[2%] h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(214,247,224,0.55),rgba(180,200,190,0.15)_45%,transparent_70%)] opacity-70 blur-2xl" />
          <div className="absolute top-[30%] right-[18%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.35),transparent_65%)] opacity-50 blur-3xl" />
          {/* vignette to deepen the corners */}
          <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_30%,transparent_40%,rgba(0,0,0,0.7))]" />
          {/* starfield speckle */}
          <div
            className="absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.6) 0.5px, transparent 0.6px)",
              backgroundSize: "46px 46px",
              maskImage:
                "radial-gradient(80% 80% at 50% 60%, black, transparent)",
            }}
          />
        </div>

        {/* faint connector rails between the orbital nodes */}
        <svg
          aria-hidden
          className="hero-connectors pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
        >
          <g
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="1"
          >
            <path d="M150 150 C 320 150, 360 250, 500 250" />
            <path d="M850 190 C 700 190, 660 280, 500 280" />
            <path d="M150 470 C 330 470, 380 360, 500 320" />
            <path d="M850 440 C 690 440, 640 350, 500 320" />
          </g>
        </svg>

        {/* orbital asset nodes — the four pipeline phases */}
        {heroNodes.map((n) => {
          const Icon = n.icon
          return (
            <div
              key={n.name}
              className={`hero-node absolute z-10 hidden items-center gap-3 md:flex ${n.pos} ${
                n.align === "right" ? "flex-row-reverse text-right" : ""
              }`}
            >
              <span className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/90 backdrop-blur-sm">
                <Icon className="size-4.5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="flex items-center gap-1.5 text-[15px] font-medium text-white">
                  <span className="size-1.5 rounded-full bg-white/60" />
                  {n.name}
                </p>
                <p className="font-mono text-xs text-white/45">
                  Phase {n.phase}
                </p>
              </div>
            </div>
          )
        })}

        {/* center stack */}
        <div className="relative z-20 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
          <a
            href="#pipeline"
            className="animate-rise flex size-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white backdrop-blur-sm transition-colors hover:bg-white/15"
            aria-label="Watch the pipeline"
          >
            <Play className="size-4 fill-current" />
          </a>

          <a
            href="#pipeline"
            className="animate-rise mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 font-mono text-[11px] tracking-wide text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10 [animation-delay:40ms]"
          >
            <Sparkles className="size-3.5" />
            See how the decision gate works
            <ArrowRight className="size-3.5" />
          </a>

          <h1 className="animate-rise mt-7 font-display text-5xl leading-[1.02] font-semibold tracking-tight text-balance text-white sm:text-6xl lg:text-[5rem] [animation-delay:60ms]">
            Stop bidding{" "}
            <span className="bg-gradient-to-r from-white via-white/75 to-white/25 bg-clip-text text-transparent">
              blind.
            </span>
          </h1>

          <p className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-balance text-white/65 [animation-delay:120ms]">
            Most bids are lost before they&apos;re written. bideez reads the
            RFP, scores your fit, and flags the gaps — so you only chase deals
            worth winning.
          </p>

          <div className="animate-rise mt-9 flex flex-wrap items-center justify-center gap-3 [animation-delay:180ms]">
            <a
              href="#pipeline"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 text-[15px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/12"
            >
              See the pipeline
              <ArrowUpRight className="size-4" />
            </a>
            <a
              href="#access"
              className="inline-flex h-11 items-center rounded-full bg-white px-6 text-[15px] font-semibold text-black transition-colors hover:bg-white/90"
            >
              Get started
            </a>
          </div>
        </div>

        {/* bottom-left scroll cue */}
        <a
          href="#thesis"
          className="absolute bottom-6 left-6 z-20 flex items-center gap-3 text-white/60 transition-colors hover:text-white"
        >
          <span className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-sm">
            <ArrowDown className="size-4" />
          </span>
          <span className="font-mono text-xs tracking-wide">
            01 / 04 · Scroll down
          </span>
        </a>

        {/* bottom-right horizon pager */}
        <div className="absolute right-6 bottom-7 z-20 hidden text-right sm:block">
          <p className="text-sm text-white/70">Bid horizons</p>
          <div className="mt-2 flex items-center justify-end gap-1.5">
            <span className="h-1 w-8 rounded-full bg-white/70" />
            <span className="h-1 w-5 rounded-full bg-white/25" />
            <span className="h-1 w-5 rounded-full bg-white/25" />
            <span className="h-1 w-5 rounded-full bg-white/25" />
          </div>
        </div>
      </div>

      {/* trust strip beneath the panel */}
      <div className="mx-auto mt-8 flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Check className="size-3.5 text-primary" /> Decision gate before
          drafting
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="size-3.5 text-primary" /> Human-in-the-loop GO/NO-GO
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="size-3.5 text-primary" /> Zero-hallucination drafts
        </span>
      </div>
    </section>
  )
}

/* ----------------------------- THESIS ----------------------------- */

function Thesis() {
  return (
    <section id="thesis" className="scroll-mt-24 px-4 py-12 sm:py-14">
      <div className="mx-auto max-w-6xl text-center" data-animate>
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
    <section id="loop" className="scroll-mt-24 px-6 py-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-none">
        <SectionHead
          kicker="The feedback loop"
          title="Every loss teaches the next bid."
          desc="A closed loop wired source → memory → downstream. Outcomes and edits feed a tenant-level memory that quietly reshapes how future bids are matched and drafted."
        />
        <div className="mt-12 grid items-stretch gap-4 md:grid-cols-3">
          {loopNodes.map((n, i) => {
            const Icon = n.icon
            return (
              <div key={n.tag} data-animate-card className="relative">
                <div className="grain relative h-full overflow-hidden rounded-3xl border border-white/10 bg-[#080809] p-6">
                  <div aria-hidden className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-[30%] right-0 h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(214,247,224,0.50),rgba(180,200,190,0.12)_45%,transparent_70%)] opacity-65 blur-2xl" />
                    <div className="absolute top-[25%] right-[15%] h-[14rem] w-[14rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.28),transparent_65%)] opacity-45 blur-3xl" />
                    <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_20%,transparent_40%,rgba(0,0,0,0.55))]" />
                  </div>
                  <span className="relative z-10 font-mono text-[10px] tracking-[0.16em] text-white/50 uppercase">
                    {n.tag}
                  </span>
                  <div className="relative z-10 mt-4 flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-white/90 backdrop-blur-sm">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="relative z-10 mt-4 font-display text-lg font-medium text-white">
                    {n.title}
                  </h3>
                  <p className="relative z-10 mt-2 text-sm leading-relaxed text-white/55">
                    {n.body}
                  </p>
                </div>
                {i < loopNodes.length - 1 && (
                  <span className="absolute top-1/2 -right-3.5 z-10 hidden -translate-y-1/2 text-white/40 md:block">
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
      <div className="mx-auto max-w-none">
        <div className="grain relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#080809] p-8 sm:p-12">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-[20%] right-[2%] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(214,247,224,0.50),rgba(180,200,190,0.12)_45%,transparent_70%)] opacity-65 blur-2xl" />
            <div className="absolute top-[30%] right-[18%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.28),transparent_65%)] opacity-45 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_20%,transparent_40%,rgba(0,0,0,0.55))]" />
          </div>
          <div data-animate className="relative z-10 grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="border-white/15 font-mono text-[10px] tracking-wide text-white/60"
                >
                  CAPSTONE ADD-ON
                </Badge>
                <span className="font-mono text-xs text-white/45">
                  Phase 04 · Defend
                </span>
              </div>
              <h2 className="mt-5 max-w-2xl font-display text-3xl leading-tight font-semibold tracking-tight text-balance text-white sm:text-4xl">
                Then it rehearses you for the call that actually closes the
                deal.
              </h2>
              <p className="mt-4 max-w-xl text-white/55">
                An optional voice agent role-plays a skeptical buyer — asking
                the hardest questions first, drawn from the exact gaps and
                heaviest-weighted criteria the engine already flagged. It scores
                your defense and coaches the weak answers.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 font-mono text-[11px] text-white/40">
                {[
                  "Ranked questions",
                  "Live follow-ups",
                  "Readiness score",
                  "Model answers",
                ].map((t) => (
                  <span key={t} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 backdrop-blur-sm">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 justify-center">
              <div className="relative flex size-36 items-center justify-center rounded-full border border-white/20 bg-white/[0.06]">
                <span className="absolute inline-flex size-36 animate-ping rounded-full bg-white/5" />
                <span className="absolute size-24 rounded-full border border-white/10" />
                <Mic className="size-9 text-white/80" strokeWidth={1.5} />
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
      <div className="grain relative mx-auto max-w-none overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#080809] px-6 py-16 text-center sm:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-[20%] right-[8%] h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle,rgba(214,247,224,0.50),rgba(180,200,190,0.12)_45%,transparent_70%)] opacity-65 blur-2xl" />
          <div className="absolute top-[20%] right-[22%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.28),transparent_65%)] opacity-45 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_10%,transparent_40%,rgba(0,0,0,0.65))]" />
          <div
            className="absolute inset-0 opacity-[0.06] [mask-image:radial-gradient(70%_70%_at_50%_0%,black,transparent)]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.8) 0.5px, transparent 0.6px)",
              backgroundSize: "46px 46px",
            }}
          />
        </div>
        <p data-animate className="relative z-10 font-mono text-xs tracking-[0.18em] text-white/50 uppercase">
          Built at a hackathon · in active development
        </p>
        <h2 data-animate className="relative z-10 mx-auto mt-5 max-w-2xl font-display text-4xl leading-tight font-semibold tracking-tight text-balance text-white sm:text-5xl">
          Win more of the bids you choose to write.
        </h2>
        <p data-animate className="relative z-10 mx-auto mt-5 max-w-xl text-white/55">
          We&apos;re onboarding a first cohort of bid &amp; proposal teams. Tell
          us about your pipeline and we&apos;ll set up your workspace.
        </p>
        <div data-animate className="relative z-10 mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="mailto:hello@bideez.ai?subject=Early%20access"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-black transition-colors hover:bg-white/90"
          >
            Get started
            <ArrowUpRight className="size-4" />
          </a>
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
    <div className="max-w-3xl" data-animate>
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

