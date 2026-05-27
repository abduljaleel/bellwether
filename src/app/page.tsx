import Link from "next/link";
import { appConfig } from "@/lib/config";

export default function LandingPage() {
  const accent = "#40c8d0";
  const dark = "#050a0c";
  const surface = "#0a1416";
  const border = "#143038";
  const muted = "#5a7a82";
  const text = "#d4e8ec";

  // Murmuration field — many agents, three behavioral profiles
  const swarm = Array.from({ length: 220 }).map((_, i) => {
    // Deterministic pseudo-random distribution for SSR stability
    const seed = (i * 9301 + 49297) % 233280;
    const r1 = seed / 233280;
    const r2 = ((i * 7919) % 1031) / 1031;
    const r3 = ((i * 6151) % 997) / 997;

    // Roughly form a sweeping crescent shape
    const t = (i / 220) * Math.PI * 1.6;
    const baseX = 50 + Math.cos(t) * 28 + (r1 - 0.5) * 14;
    const baseY = 50 + Math.sin(t * 1.1) * 18 + (r2 - 0.5) * 14;
    const profile = r3 < 0.12 ? "arbitrageur" : r3 < 0.55 ? "buyer" : "seller";
    const color = profile === "arbitrageur" ? "#f0c050" : profile === "buyer" ? accent : "#8a6ad8";
    const size = 1.4 + r1 * 1.6;
    return { x: baseX, y: baseY, color, size, opacity: 0.35 + r2 * 0.55 };
  });

  // Policy comparison cards
  const policies = [
    {
      name: "Policy v1",
      sub: "baseline",
      outcome: "Stable",
      detail: "Price variance ±3% over 60 days",
      tone: text,
      bar: 62,
      barColor: accent,
    },
    {
      name: "Policy v2",
      sub: "tightened spread",
      outcome: "Optimal",
      detail: "Price variance ±2%, liquidity +14%",
      tone: "#7adfa0",
      bar: 88,
      barColor: "#7adfa0",
    },
    {
      name: "Policy v3",
      sub: "dynamic fee",
      outcome: "Collapse",
      detail: "Phase transition on day 44, -38% volume",
      tone: "#ef6b85",
      bar: 22,
      barColor: "#ef6b85",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: dark, color: text }}>
      {/* Nav */}
      <header style={{ borderBottom: `1px solid ${border}` }}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {/* Tiny bell icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8">
              <path d="M6 17h12a2 2 0 0 0 1.8-2.9C18.7 12 18 10 18 8a6 6 0 1 0-12 0c0 2-.7 4-1.8 6.1A2 2 0 0 0 6 17z" />
              <path d="M10 21a2 2 0 0 0 4 0" />
            </svg>
            <span className="font-semibold" style={{ color: text }}>{appConfig.name}</span>
            <span className="text-xs font-mono hidden sm:inline" style={{ color: muted }}>
              bellwether.ch &middot; Zurich
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm transition-colors" style={{ color: muted }}>
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors"
              style={{ border: `1px solid ${accent}`, color: accent }}
            >
              Request access
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl w-full px-6 pt-24 pb-12">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] items-center">
          <div>
            <p className="text-xs font-mono tracking-widest uppercase mb-6" style={{ color: accent }}>
              Frontier / Agent-based simulation
            </p>
            <h1
              className="text-7xl sm:text-8xl font-normal tracking-tight leading-[0.95]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: text }}
            >
              Bellwether
            </h1>
            <p className="mt-4 text-sm italic" style={{ color: muted, fontFamily: 'Georgia, serif' }}>
              <em>n.</em> The lead sheep that wears the bell. The signal the flock follows.
            </p>
            <p className="mt-8 text-2xl font-light leading-relaxed" style={{ color: text }}>
              Digital twin of complex systems using agent swarms.
            </p>
            <p className="mt-5 text-base leading-relaxed" style={{ color: muted }}>
              You can&apos;t unit-test a market or a city. Bellwether simulates ten thousand
              heterogeneous agents against your proposed policy, detects phase transitions
              hours before they would happen, and tells you what to change.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full px-7 py-3 text-base font-medium"
                style={{ backgroundColor: accent, color: dark }}
              >
                Run a simulation &rarr;
              </Link>
              <span className="text-xs font-mono" style={{ color: muted }}>
                From Zurich &mdash; ETH precision applied to emergent systems.
              </span>
            </div>
          </div>

          {/* Murmuration */}
          <div className="relative">
            <div
              className="relative rounded-xl aspect-square overflow-hidden"
              style={{ border: `1px solid ${border}`, backgroundColor: surface }}
            >
              <div className="absolute inset-0">
                {swarm.map((dot, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      left: `${dot.x}%`,
                      top: `${dot.y}%`,
                      width: `${dot.size}px`,
                      height: `${dot.size}px`,
                      backgroundColor: dot.color,
                      opacity: dot.opacity,
                      boxShadow: `0 0 4px ${dot.color}`,
                    }}
                  />
                ))}
              </div>

              {/* Overlay legend */}
              <div
                className="absolute bottom-3 left-3 right-3 rounded-md p-3 text-xs font-mono"
                style={{ backgroundColor: `${dark}d0`, border: `1px solid ${border}` }}
              >
                <div className="flex justify-between" style={{ color: muted }}>
                  <span>10,000 agents</span>
                  <span>3 behavioral profiles</span>
                </div>
                <div className="mt-2 flex gap-4">
                  <span className="flex items-center gap-1.5" style={{ color: accent }}>
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                    buyer
                  </span>
                  <span className="flex items-center gap-1.5" style={{ color: "#8a6ad8" }}>
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#8a6ad8" }} />
                    seller
                  </span>
                  <span className="flex items-center gap-1.5" style={{ color: "#f0c050" }}>
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#f0c050" }} />
                    arbitrageur
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regime shift panel */}
      <section className="mx-auto max-w-6xl w-full px-6 pb-16">
        <p className="text-xs font-mono tracking-widest uppercase mb-4" style={{ color: accent }}>
          Regime shift detection
        </p>
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${border}`, backgroundColor: surface }}
        >
          <div
            className="flex items-center justify-between px-5 py-3 text-xs font-mono"
            style={{ borderBottom: `1px solid ${border}`, color: muted, backgroundColor: dark }}
          >
            <span>simulation: marketplace_pricing_policy_v3</span>
            <span>tick 44 / 90</span>
          </div>
          <div className="p-6 font-mono text-sm leading-relaxed space-y-1.5">
            <p>
              <span style={{ color: muted }}>simulation:</span>{" "}
              <span style={{ color: text }}>Marketplace pricing policy v3</span>
            </p>
            <p>
              <span style={{ color: muted }}>agents:</span>{" "}
              <span style={{ color: text }}>10,000 (heterogeneous: buyers, sellers, arbitrageurs)</span>
            </p>

            <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${border}` }}>
              <p style={{ color: "#7adfa0" }}>
                days 1&ndash;43: Equilibrium stable. Price variance &plusmn;2%.
              </p>
              <p className="mt-3" style={{ color: "#f0b070" }}>
                <span className="font-bold">day 44 &mdash; BELLWETHER ALERT</span> &mdash; phase transition detected
              </p>
              <div className="mt-2 pl-5 space-y-1" style={{ color: text }}>
                <p>&#9492;&nbsp; 12% of agents shifted strategy</p>
                <p>&#9492;&nbsp; predicted: price collapse in <span style={{ color: "#ef6b85" }}>8 hours</span></p>
                <p>&#9492;&nbsp; recommendation: revert policy v3 &rarr; v2 before deployment</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Policy comparison cards */}
      <section className="mx-auto max-w-6xl w-full px-6 pb-16">
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-xs font-mono tracking-widest uppercase" style={{ color: accent }}>
            What-if comparison
          </p>
          <span className="text-xs font-mono" style={{ color: muted }}>
            3 candidate policies, 90-day horizon
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {policies.map((p) => (
            <div
              key={p.name}
              className="rounded-xl p-5"
              style={{ border: `1px solid ${border}`, backgroundColor: surface }}
            >
              <div className="flex items-baseline justify-between">
                <h3
                  className="text-2xl font-normal"
                  style={{ fontFamily: "Georgia, serif", color: text }}
                >
                  {p.name}
                </h3>
                <span className="text-xs font-mono" style={{ color: muted }}>{p.sub}</span>
              </div>

              <div className="mt-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-mono tracking-wider uppercase" style={{ color: muted }}>
                    Outcome
                  </span>
                  <span className="text-sm font-mono font-bold" style={{ color: p.tone }}>
                    {p.outcome}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: border }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${p.bar}%`, backgroundColor: p.barColor }}
                  />
                </div>
              </div>

              <p className="mt-5 text-sm" style={{ color: text }}>{p.detail}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            { label: "Agents per simulation", value: "10,000" },
            { label: "Phase transitions detected in advance", value: "6 hours" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg px-5 py-6 flex items-baseline justify-between"
              style={{ border: `1px solid ${border}`, backgroundColor: surface }}
            >
              <p className="text-xs font-mono tracking-wider uppercase" style={{ color: muted }}>
                {s.label}
              </p>
              <p
                className="text-3xl font-normal"
                style={{ fontFamily: "Georgia, serif", color: accent }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl w-full px-6 pb-24 text-center">
        <h2
          className="text-4xl sm:text-5xl font-normal leading-tight"
          style={{ fontFamily: "Georgia, serif", color: text }}
        >
          Stress-test the policy before the market does.
        </h2>
        <p className="mt-5 text-base" style={{ color: muted }}>
          Marketplaces, supply chains, cities, networks. If it has agents and feedback, Bellwether can simulate it.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center rounded-full px-8 py-3 text-base font-medium"
            style={{ backgroundColor: accent, color: dark }}
          >
            Run a simulation &rarr;
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${border}` }}>
        <div className="mx-auto flex flex-col sm:flex-row gap-3 max-w-6xl items-center justify-between px-6 py-6 text-xs font-mono">
          <span style={{ color: muted }}>
            {appConfig.name} &middot; Zurich &middot; &copy; {new Date().getFullYear()}
          </span>
          <a
            href="https://abduljaleel.xyz/aletheia/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors"
            style={{ border: `1px solid ${border}`, color: accent }}
          >
            PART OF THE ALETHEIA STACK &#8599;
          </a>
        </div>
      </footer>
    </div>
  );
}
