import Link from "next/link";
import { appConfig } from "@/lib/config";

/**
 * BELLWETHER — THE SIMULATION
 * Archetype: a live multi-agent simulation. Deep space-dark, cyan accents,
 * fields of hundreds of small dots (agents) forming murmuration crescents.
 * ALL dot positions/opacities derived deterministically from loop indices
 * (no Math.random, no new Date at module/render scope).
 */

type Dot = { x: number; y: number; r: number; o: number; c: string };

// Deterministic murmuration: place N dots, deriving x/y from index math so the
// flock reads as a flowing crescent/cluster. Opacity & size vary by sine of i.
function murmuration(
  count: number,
  opts: {
    cx: number;
    cy: number;
    spread: number;
    arc: number; // radians swept
    twist: number; // how tightly the crescent curls
    palette: string[];
    accentEvery?: number; // every Nth dot uses palette[1] (the "shifted" agents)
  }
): Dot[] {
  const { cx, cy, spread, arc, twist, palette, accentEvery = 0 } = opts;
  const out: Dot[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * arc; // angle along the crescent
    // radius pulses along the arc → a banded, layered flock rather than a ring
    const band = 0.55 + 0.45 * Math.abs(Math.sin(i * 0.37));
    const rad = spread * band;
    // a second sine adds a curl/twist so the crescent sweeps
    const cur = Math.sin(t * twist);
    const x = cx + Math.cos(t) * rad + cur * spread * 0.5;
    const y = cy + Math.sin(t) * rad * 0.62 + Math.cos(i * 0.21) * spread * 0.18;
    const r = 0.9 + 1.6 * (0.5 + 0.5 * Math.sin(i * 0.91));
    // density falls off toward the trailing edge of the flock
    const o = 0.22 + 0.6 * (0.5 + 0.5 * Math.sin(i * 0.5 + 1.1));
    const shifted = accentEvery > 0 && i % accentEvery === 0;
    const c = shifted ? palette[1] : palette[0];
    out.push({ x, y, r, o, c });
  }
  return out;
}

const CYAN = "#40c8d0";
const VIOLET = "#8a6ad8";
const AMBER = "#f0c050";
const ROSE = "#ef6b85";
const MINT = "#7adfa0";

export default function LandingPage() {
  const dark = "#070a10";
  const panel = "#0b1018";
  const border = "#16222c";
  const muted = "#5d7782";
  const text = "#cfe3e8";

  // Hero flock — a few hundred agents forming a wide sweeping crescent.
  const hero = murmuration(420, {
    cx: 560,
    cy: 250,
    spread: 210,
    arc: Math.PI * 1.55,
    twist: 1.35,
    palette: [CYAN, AMBER],
    accentEvery: 11, // ~9% of agents "shifted strategy" → amber
  });

  // Three what-if thumbnails, each a distinct emergent shape.
  const thumbA = murmuration(140, {
    cx: 80,
    cy: 80,
    spread: 52,
    arc: Math.PI * 2,
    twist: 0.4,
    palette: [MINT, MINT],
  }); // tight ring → stable
  const thumbB = murmuration(140, {
    cx: 80,
    cy: 80,
    spread: 60,
    arc: Math.PI * 1.2,
    twist: 2.4,
    palette: [ROSE, ROSE],
  }); // torn crescent → collapse
  const thumbC = murmuration(160, {
    cx: 80,
    cy: 80,
    spread: 64,
    arc: Math.PI * 2.6,
    twist: 3.2,
    palette: [AMBER, AMBER],
  }); // unspooling spiral → runaway

  const whatif = [
    { id: "A", label: "Policy A", dots: thumbA, outcome: "stable", color: MINT, note: "equilibrium holds · ±2%" },
    { id: "B", label: "Policy B", dots: thumbB, outcome: "collapse", color: ROSE, note: "price collapse · day 44" },
    { id: "C", label: "Policy C", dots: thumbC, outcome: "runaway", color: AMBER, note: "feedback spiral · unbounded" },
  ];

  return (
    <div
      className="min-h-screen w-full overflow-hidden"
      style={{
        backgroundColor: dark,
        color: text,
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* ───────── HERO: the swarm field dominates ───────── */}
      <section className="relative" style={{ height: "min(86vh, 760px)" }}>
        {/* full-bleed simulation field */}
        <svg
          viewBox="0 0 1120 520"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <radialGradient id="bwGlow" cx="50%" cy="46%" r="55%">
              <stop offset="0%" stopColor={CYAN} stopOpacity="0.10" />
              <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="1120" height="520" fill="url(#bwGlow)" />
          {hero.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} opacity={d.o} />
          ))}
        </svg>
        {/* dark vignette so overlaid text stays legible */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 18% 30%, rgba(7,10,16,0.92) 0%, rgba(7,10,16,0.55) 38%, rgba(7,10,16,0.18) 70%)",
          }}
        />

        {/* corner brand + tiny access links (NOT centered) */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-5 sm:px-10">
          <div className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8">
              <path d="M6 17h12a2 2 0 0 0 1.8-2.9C18.7 12 18 10 18 8a6 6 0 1 0-12 0c0 2-.7 4-1.8 6.1A2 2 0 0 0 6 17z" />
              <path d="M10 21a2 2 0 0 0 4 0" />
            </svg>
            <span className="text-sm font-semibold tracking-wide">{appConfig.name}</span>
            <span className="font-mono text-[11px]" style={{ color: muted }}>
              Zürich
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <Link
              href="/login"
              className="rounded-sm px-2.5 py-1 transition-colors"
              style={{ color: muted, border: `1px solid ${border}` }}
            >
              sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-sm px-2.5 py-1 transition-colors"
              style={{ color: CYAN, border: `1px solid ${CYAN}66` }}
            >
              get started ↗
            </Link>
          </div>
        </div>

        {/* overlaid statement, lower-left — not a giant centered headline */}
        <div className="absolute bottom-10 left-6 max-w-xl sm:left-10">
          <p className="font-mono text-[11px] tracking-[0.28em]" style={{ color: CYAN }}>
            LIVE · 10,000 AGENTS · TICK 44
          </p>
          <h1
            className="mt-3 text-3xl font-medium leading-[1.05] sm:text-5xl"
            style={{ color: text }}
          >
            Ten thousand agents.
            <br />
            <span style={{ color: CYAN }}>One emerging answer.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed" style={{ color: muted }}>
            {appConfig.description} You can&apos;t unit-test a market or a city — so Bellwether grows one
            and watches it move.
          </p>
        </div>

        {/* floating regime-shift annotation pinned into the flock */}
        <div
          className="absolute right-6 top-24 hidden font-mono text-[11px] sm:block"
          style={{ color: AMBER }}
        >
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: AMBER }} />
            12% shifted strategy
          </div>
        </div>
      </section>

      {/* ───────── REGIME SHIFT console ───────── */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-14 sm:px-10">
        <div className="grid items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* console */}
          <div
            className="overflow-hidden rounded-lg"
            style={{ backgroundColor: panel, border: `1px solid ${border}` }}
          >
            <div
              className="flex items-center justify-between px-4 py-2 font-mono text-[11px]"
              style={{ borderBottom: `1px solid ${border}`, color: muted }}
            >
              <span>regime-shift detector</span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CYAN }} />
                streaming
              </span>
            </div>
            <pre
              className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-[1.7]"
              style={{ color: text }}
            >
              <span style={{ color: muted }}>SIM:</span> marketplace pricing policy v3{"\n"}
              <span style={{ color: muted }}>agents:</span> 10,000{" "}
              <span style={{ color: muted }}>(buyers · sellers · arbitrageurs)</span>
              {"\n"}
              {"\n"}
              <span style={{ color: MINT }}>day 1–43</span> equilibrium stable{"  "}
              <span style={{ color: muted }}>±2%</span>
              {"\n"}
              <span
                className="inline-block rounded px-1.5"
                style={{
                  color: dark,
                  backgroundColor: CYAN,
                  animation: "bwPulse 1.3s ease-in-out infinite",
                }}
              >
                day 44   ⚠ PHASE TRANSITION DETECTED
              </span>
              {"\n"}
              {"  "}
              <span style={{ color: muted }}>└</span> 12% of agents shifted strategy{"\n"}
              {"  "}
              <span style={{ color: muted }}>└</span> predicted:{" "}
              <span style={{ color: ROSE }}>price collapse in 8h</span>
              {"\n"}
              {"  "}
              <span style={{ color: muted }}>└</span> recommend:{" "}
              <span style={{ color: CYAN }}>revert v3 → v2</span>
            </pre>
          </div>

          {/* explainer beside console */}
          <div className="flex flex-col justify-center gap-4">
            <p className="font-mono text-[11px] tracking-[0.24em]" style={{ color: CYAN }}>
              THE MAGIC
            </p>
            <p className="text-lg leading-relaxed" style={{ color: text }}>
              A bellwether is the lead sheep whose bell signals the flock&apos;s move. Bellwether reads the
              swarm and catches the <span style={{ color: CYAN }}>phase transition</span> before the system tips.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: muted }}>
              When a critical mass of agents quietly changes strategy, the equilibrium is already gone —
              the price just hasn&apos;t caught up yet. We surface that moment while you can still act.
            </p>
          </div>
        </div>
      </section>

      {/* ───────── WHAT-IF: three emergent shapes ───────── */}
      <section className="mx-auto max-w-6xl px-6 pb-16 sm:px-10">
        <div className="mb-5 flex items-baseline justify-between">
          <p className="font-mono text-[11px] tracking-[0.24em]" style={{ color: CYAN }}>
            WHAT-IF · 3 CANDIDATE POLICIES
          </p>
          <span className="font-mono text-[11px]" style={{ color: muted }}>
            same seed · divergent futures
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {whatif.map((w) => (
            <div
              key={w.id}
              className="overflow-hidden rounded-lg"
              style={{ backgroundColor: panel, border: `1px solid ${border}` }}
            >
              {/* mini swarm thumbnail */}
              <div className="relative" style={{ backgroundColor: "#080c12" }}>
                <svg viewBox="0 0 160 160" className="block w-full">
                  {w.dots.map((d, i) => (
                    <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} opacity={d.o} />
                  ))}
                </svg>
                <span
                  className="absolute right-2 top-2 rounded px-1.5 py-0.5 font-mono text-[10px]"
                  style={{ color: w.color, backgroundColor: `${w.color}1f` }}
                >
                  {w.outcome}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${border}` }}>
                <span className="text-sm font-medium" style={{ color: text }}>
                  {w.label}
                </span>
                <span className="font-mono text-[11px]" style={{ color: muted }}>
                  {w.note}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── quiet stats line ───────── */}
      <section className="mx-auto max-w-6xl px-6 pb-20 sm:px-10">
        <div
          className="flex flex-col items-center justify-between gap-4 rounded-lg px-6 py-5 font-mono text-[12px] sm:flex-row"
          style={{ border: `1px solid ${border}`, color: muted }}
        >
          <span>
            <span style={{ color: CYAN }}>10,000</span> agents / sim
          </span>
          <span className="hidden sm:inline" style={{ color: border }}>
            ·
          </span>
          <span>
            phase shifts caught <span style={{ color: CYAN }}>6h</span> early
          </span>
          <span className="hidden sm:inline" style={{ color: border }}>
            ·
          </span>
          <span>
            <span style={{ color: CYAN }}>220</span> scenarios / run
          </span>
          <Link
            href="/signup"
            className="rounded-sm px-3 py-1.5 transition-colors"
            style={{ color: dark, backgroundColor: CYAN }}
          >
            run a simulation ↗
          </Link>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer style={{ borderTop: `1px solid ${border}` }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 font-mono text-[11px] sm:flex-row sm:px-10">
          <span style={{ color: muted }}>{appConfig.name} · Zürich</span>
          <a
            href="https://abduljaleel.xyz/aletheia/"
            target="_blank"
            rel="noreferrer"
            className="rounded-sm px-3 py-1.5 transition-colors"
            style={{ color: muted, border: `1px solid ${border}` }}
          >
            Part of the Aletheia stack ↗
          </a>
        </div>
      </footer>

      <style>{`
        @keyframes bwPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.55); }
        }
      `}</style>
    </div>
  );
}
