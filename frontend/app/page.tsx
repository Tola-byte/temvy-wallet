"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const pillars = [
  "Identity as routing layer",
  "Backend-authorized settlement",
  "Social ledger reconciliation",
  "Unified stablecoin balance"
];

const protocolLog = [
  "auth/privy-upsert -> linked",
  "recipient/resolve -> found-or-claim",
  "payments/send -> signed-by-policy",
  "ledger/netting -> updated"
];

const stories = [
  {
    title: "Pay by handle",
    body: "Send to email or phone, not wallet addresses."
  },
  {
    title: "Pending claims",
    body: "Recipients without accounts get secure claim windows."
  },
  {
    title: "Live reconciliation",
    body: "Balances update per contact with memo-aware netting."
  }
];

const useCases = [
  "Team reimbursements",
  "Event split payments",
  "Freelancer payouts",
  "Creator community treasury"
];

const LANDING_CHART_WIDTH = 520;
const LANDING_CHART_HEIGHT = 180;
const LANDING_CHART_PAD = 14;

const landingChartLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const landingInflow = [180, 220, 150, 280, 330, 410, 360];
const landingOutflow = [74, 88, 122, 92, 160, 205, 181];

function buildLandingPoints(values: number[]) {
  const max = Math.max(1, ...values);
  const spanX = LANDING_CHART_WIDTH - LANDING_CHART_PAD * 2;
  const spanY = LANDING_CHART_HEIGHT - LANDING_CHART_PAD * 2;
  return values.map((value, idx) => ({
    x: LANDING_CHART_PAD + (idx * spanX) / Math.max(1, values.length - 1),
    y: LANDING_CHART_HEIGHT - LANDING_CHART_PAD - (value / max) * spanY
  }));
}

function buildLandingPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let idx = 1; idx < points.length; idx += 1) {
    const prev = points[idx - 1];
    const current = points[idx];
    const controlX = (prev.x + current.x) / 2;
    path += ` C ${controlX} ${prev.y}, ${controlX} ${current.y}, ${current.x} ${current.y}`;
  }
  return path;
}

export default function RootPage() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  useEffect(() => {
    if (ready && authenticated) {
      router.replace("/app/dashboard");
    }
  }, [authenticated, ready, router]);

  const enterApp = useCallback(() => {
    if (!ready) return;
    if (authenticated) {
      router.push("/app/dashboard");
      return;
    }
    login();
  }, [authenticated, login, ready, router]);

  const landingInflowPoints = useMemo(() => buildLandingPoints(landingInflow), []);
  const landingOutflowPoints = useMemo(() => buildLandingPoints(landingOutflow), []);
  const landingInflowPath = useMemo(() => buildLandingPath(landingInflowPoints), [landingInflowPoints]);
  const landingOutflowPath = useMemo(() => buildLandingPath(landingOutflowPoints), [landingOutflowPoints]);
  const landingInflowAreaPath = useMemo(() => {
    if (landingInflowPoints.length === 0) return "";
    const start = landingInflowPoints[0];
    const end = landingInflowPoints[landingInflowPoints.length - 1];
    return `${landingInflowPath} L ${end.x} ${LANDING_CHART_HEIGHT - LANDING_CHART_PAD} L ${start.x} ${
      LANDING_CHART_HEIGHT - LANDING_CHART_PAD
    } Z`;
  }, [landingInflowPath, landingInflowPoints]);
  const activePoint = hoveredPoint ?? landingInflowPoints.length - 1;
  const activeLabel = landingChartLabels[activePoint];
  const activeInflow = landingInflow[activePoint];
  const activeOutflow = landingOutflow[activePoint];
  const activeInCoords = landingInflowPoints[activePoint];
  const activeOutCoords = landingOutflowPoints[activePoint];

  return (
    <main className="nova-wrap">
      <header className="nova-nav">
        <p className="brand-mark">
          <span className="brand-script">Temvy</span>
          <span className="brand-sans">Wallet</span>
        </p>
        <nav className="nova-links">
          <a href="#about">About</a>
          <a href="#rail">Rail</a>
          <a href="#proof">Proof</a>
          <button type="button" className="nova-cta" onClick={enterApp} disabled={!ready}>
            Test App
          </button>
        </nav>
      </header>

      <section className="nova-hero" id="about">
        <div className="nova-copy">
          <p className="nova-kicker">tempo x privy</p>
          <h1>consumer payment UX with onchain finality.</h1>
          <p>
            Temvy hides addresses, keys, and gas logic. Users send to email or phone while backend policies control
            signing and Tempo handles settlement.
          </p>
          <div className="nova-actions">
            <button type="button" className="nova-cta" onClick={enterApp} disabled={!ready}>
              launch demo
            </button>
            <a href="#proof" className="nova-link-btn">
              view architecture
            </a>
          </div>
        </div>

        <div className="nova-orbit" aria-hidden="true">
          <div className="nova-core" />
          <div className="nova-ring ring-a" />
          <div className="nova-ring ring-b" />
          <div className="nova-ring ring-c" />
          <span className="nova-node node-a">privy</span>
          <span className="nova-node node-b">tempo</span>
          <span className="nova-node node-c">ledger</span>
          <span className="nova-node node-d">claims</span>
        </div>
      </section>

      <section className="nova-strip" id="proof">
        <div className="nova-strip-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        {pillars.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </section>

      <section className="nova-content" id="stories">
        <div>
          <p className="nova-kicker">product story</p>
          <h2>why this feels consumer-native</h2>
        </div>
        <div className="nova-story-grid">
          {stories.map((story) => (
            <article key={story.title} className="nova-story">
              <h3>{story.title}</h3>
              <p>{story.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="nova-content">
        <div className="section-title-row">
          <div>
            <p className="nova-kicker">analytics surface</p>
            <h2>inflow and outflow intelligence</h2>
          </div>
          <span className="chip">Day / Transaction graph</span>
        </div>
        <div className="nova-chart-wrap">
          <svg
            viewBox={`0 0 ${LANDING_CHART_WIDTH} ${LANDING_CHART_HEIGHT}`}
            role="img"
            aria-label="Inflow and outflow preview chart"
            onMouseLeave={() => setHoveredPoint(null)}
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - rect.left) / rect.width) * LANDING_CHART_WIDTH;
              const nearest = landingInflowPoints.reduce(
                (best, point, index) =>
                  Math.abs(point.x - x) < Math.abs(landingInflowPoints[best].x - x) ? index : best,
                0
              );
              setHoveredPoint(nearest);
            }}
          >
            <defs>
              <linearGradient id="nova-chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(99, 255, 190, 0.34)" />
                <stop offset="100%" stopColor="rgba(99, 255, 190, 0.02)" />
              </linearGradient>
            </defs>
            <path
              d={`M ${LANDING_CHART_PAD} ${LANDING_CHART_HEIGHT - LANDING_CHART_PAD} H ${
                LANDING_CHART_WIDTH - LANDING_CHART_PAD
              }`}
              className="nova-chart-axis"
            />
            <path d={landingInflowAreaPath} className="nova-chart-area" />
            <path d={landingInflowPath} className="nova-chart-line nova-chart-line-in" />
            <path d={landingOutflowPath} className="nova-chart-line nova-chart-line-out" />
            {activeInCoords ? <circle cx={activeInCoords.x} cy={activeInCoords.y} r="4.5" className="nova-chart-dot in" /> : null}
            {activeOutCoords ? <circle cx={activeOutCoords.x} cy={activeOutCoords.y} r="4.2" className="nova-chart-dot out" /> : null}
          </svg>
          <div className="nova-chart-meta">
            <p>{activeLabel}</p>
            <p className="in">Inflow ${activeInflow.toFixed(2)}</p>
            <p className="out">Outflow ${activeOutflow.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section className="nova-rail" id="rail">
        <div className="nova-rail-orbit" aria-hidden="true">
          <span />
          <span />
        </div>
        <div>
          <p className="nova-kicker">runtime log</p>
          <h2>execution flow</h2>
        </div>
        <div className="nova-log">
          {protocolLog.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <section className="nova-content">
        <div>
          <p className="nova-kicker">live scenarios</p>
          <h2>where teams use temvy</h2>
        </div>
        <div className="nova-case-grid">
          {useCases.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </section>

      <section className="nova-final">
        <div>
          <p className="nova-kicker">ready to run</p>
          <h2>ship contact-based payments without exposing crypto complexity</h2>
        </div>
        <button type="button" className="nova-cta" onClick={enterApp} disabled={!ready}>
          open dashboard
        </button>
      </section>
    </main>
  );
}
