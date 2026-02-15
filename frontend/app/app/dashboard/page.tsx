"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BalanceOverview } from "../../../components/BalanceOverview";
import { TransactionTimeline } from "../../../components/TransactionTimeline";
import { InlineNotice } from "../../../components/app/InlineNotice";
import { fetchDashboard } from "../../../lib/backend-api";
import { toFriendlyError } from "../../../lib/error-format";
import { buildNetFlow, getTotalBalance } from "../../../lib/finance";
import { mapBalances, mapContacts, mapTransfers } from "../../../lib/ui-adapters";
import { useSession } from "../../../components/app/session-context";
import type { Contact, TokenBalance, Transfer } from "../../../lib/types";

const CHART_WIDTH = 360;
const CHART_HEIGHT = 148;
const CHART_PADDING = 12;
const FLOW_SAMPLE_SIZE = 8;

type ChartPoint = {
  x: number;
  y: number;
};

type FlowSeries = {
  labels: string[];
  inflow: number[];
  outflow: number[];
};

function buildTransactionSeries(transfers: Transfer[], size: number): FlowSeries {
  const recent = [...transfers]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-size);

  const padded = [...recent];
  while (padded.length < size) {
    padded.unshift({
      id: `pad-${padded.length}`,
      contactId: "",
      direction: "received",
      amountUsd: 0,
      stablecoin: "pathUSD",
      memo: "",
      chainLabel: "",
      createdAt: new Date(0).toISOString()
    });
  }

  return {
    labels: padded.map((item, index) =>
      item.id.startsWith("pad-")
        ? `T-${size - index}`
        : new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    ),
    inflow: padded.map((item) => (item.direction === "received" ? item.amountUsd : 0)),
    outflow: padded.map((item) => (item.direction === "sent" ? item.amountUsd : 0))
  };
}

function buildDaySeries(transfers: Transfer[], days: number): FlowSeries {
  const byDay = new Map<string, { in: number; out: number }>();
  const now = new Date();
  const labels: string[] = [];

  for (let idx = days - 1; idx >= 0; idx -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - idx);
    const key = day.toISOString().slice(0, 10);
    byDay.set(key, { in: 0, out: 0 });
    labels.push(day.toLocaleDateString([], { month: "short", day: "numeric" }));
  }

  transfers.forEach((transfer) => {
    const key = new Date(transfer.createdAt).toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (!bucket) return;
    if (transfer.direction === "received") bucket.in += transfer.amountUsd;
    else bucket.out += transfer.amountUsd;
  });

  const values = [...byDay.values()];
  return {
    labels,
    inflow: values.map((item) => item.in),
    outflow: values.map((item) => item.out)
  };
}

function buildPoints(values: number[], width: number, height: number, padding: number): ChartPoint[] {
  const max = Math.max(1, ...values);
  const spanX = width - padding * 2;
  const spanY = height - padding * 2;
  return values.map((value, idx) => ({
    x: padding + (idx * spanX) / Math.max(1, values.length - 1),
    y: height - padding - (value / max) * spanY
  }));
}

function buildSmoothPath(points: ChartPoint[]) {
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

export default function DashboardPage() {
  const { backendSession, appUserId, backendError, bootstrapping } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [graphMode, setGraphMode] = useState<"day" | "transaction">("day");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!backendSession || !appUserId) {
        return;
      }
      setLoading(true);
      setError(null);

      try {
        const data = await fetchDashboard(backendSession, appUserId);
        const mappedTransfers = mapTransfers(data.transfers.data);
        const mappedContacts = mapContacts(data.ledger, data.transfers.data);
        const mappedBalances = mapBalances(data.balances);

        if (!cancelled) {
          setTransfers(mappedTransfers);
          setContacts(mappedContacts);
          setBalances(mappedBalances);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [appUserId, backendSession]);

  const total = useMemo(() => getTotalBalance(balances), [balances]);
  const flow = useMemo(() => buildNetFlow(transfers), [transfers]);
  const settles = useMemo(() => transfers.filter((item) => item.direction === "received").length, [transfers]);
  const expenses = useMemo(() => transfers.filter((item) => item.direction === "sent").length, [transfers]);
  const flowSeries = useMemo(
    () => (graphMode === "day" ? buildDaySeries(transfers, 7) : buildTransactionSeries(transfers, FLOW_SAMPLE_SIZE)),
    [graphMode, transfers]
  );
  const inflowSeries = flowSeries.inflow;
  const outflowSeries = flowSeries.outflow;
  const inflowPoints = useMemo(
    () => buildPoints(inflowSeries, CHART_WIDTH, CHART_HEIGHT, CHART_PADDING),
    [inflowSeries]
  );
  const outflowPoints = useMemo(
    () => buildPoints(outflowSeries, CHART_WIDTH, CHART_HEIGHT, CHART_PADDING),
    [outflowSeries]
  );
  const inflowPath = useMemo(() => buildSmoothPath(inflowPoints), [inflowPoints]);
  const outflowPath = useMemo(() => buildSmoothPath(outflowPoints), [outflowPoints]);
  const inflowAreaPath = useMemo(() => {
    if (inflowPoints.length === 0) return "";
    const end = inflowPoints[inflowPoints.length - 1];
    const start = inflowPoints[0];
    return `${inflowPath} L ${end.x} ${CHART_HEIGHT - CHART_PADDING} L ${start.x} ${CHART_HEIGHT - CHART_PADDING} Z`;
  }, [inflowPath, inflowPoints]);
  const activeIndex = hoveredIndex ?? Math.max(0, inflowPoints.length - 1);
  const activeInPoint = inflowPoints[activeIndex];
  const activeOutPoint = outflowPoints[activeIndex];
  const activeLabel = flowSeries.labels[activeIndex] ?? "";
  const activeInValue = inflowSeries[activeIndex] ?? 0;
  const activeOutValue = outflowSeries[activeIndex] ?? 0;

  if (bootstrapping || loading) {
    return <InlineNotice title="Loading dashboard" message="Fetching ledger, balances, and transfers..." variant="info" />;
  }

  if (backendError || error) {
    const friendly = toFriendlyError(backendError ?? error ?? "Unknown error");
    return <InlineNotice title={friendly.title} message={friendly.message} variant="error" />;
  }

  return (
    <section className="dashboard-wrap">
      <section className="panel dashboard-hero">
        <div>
          <p className="panel-kicker">Temvy command center</p>
          <h1>Financial clarity, realtime settlement.</h1>
          <p className="meta-text">
            Privy-authenticated account synced with live Tempo-backed balances, social ledger, and spend intelligence.
          </p>
        </div>
        <div className="dashboard-kpis">
          <article className="kpi-card">
            <p className="kpi-label">Total balance</p>
            <p className="kpi-value">${total.toFixed(2)}</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-label">Incoming flow</p>
            <p className="kpi-value amount-positive">${flow.incoming.toFixed(2)}</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-label">Outgoing flow</p>
            <p className="kpi-value amount-negative">${flow.outgoing.toFixed(2)}</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-label">Activity volume</p>
            <p className="kpi-value">{settles + expenses}</p>
          </article>
        </div>
      </section>

      <section className="page-grid">
      <div className="stack">
        <BalanceOverview totalBalance={total} balances={balances} />
        {/* <section className="panel flow-panel">
          <p className="meta-text">Flow overview</p>
          <p className="amount-positive">Incoming ${flow.incoming.toFixed(2)}</p>
          <p className="amount-negative">Outgoing ${flow.outgoing.toFixed(2)}</p>
          <p className="meta-text">{settles} inbound settlements · {expenses} outgoing payments</p>
        </section> */}
        {/* <ContactBalances rows={ledgerRows} /> */}
        <TransactionTimeline history={transfers} contacts={contacts} limit={4} showMoreHref="/app/activity" />
      </div>
      <div className="stack">
        <section className="panel">
          <div className="section-title-row">
            <h2>Smart Split</h2>
            <span className="chip chip-success">Live demo ready</span>
          </div>
          <p className="meta-text">
            Use Smart Split to enter one bill and auto-generate equal payouts to your contacts with one batch send.
          </p>
          <div className="composer-actions" style={{ marginTop: "0.75rem" }}>
            <Link href="/app/send" className="btn btn-primary">
              Open Smart Split
            </Link>
          </div>
        </section>
        <section className="panel flow-curve-panel">
          <div className="section-title-row">
            <h2>Inflow / Outflow</h2>
            <div className="flow-mode-switch" role="group" aria-label="Graph mode">
              <button
                type="button"
                className={graphMode === "day" ? "flow-mode-btn active" : "flow-mode-btn"}
                onClick={() => setGraphMode("day")}
              >
                Day
              </button>
              <button
                type="button"
                className={graphMode === "transaction" ? "flow-mode-btn active" : "flow-mode-btn"}
                onClick={() => setGraphMode("transaction")}
              >
                Transaction
              </button>
            </div>
          </div>
          <div className="flow-curve-wrap" aria-label="Inflow and outflow graph">
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              role="img"
              aria-label="Flow graph"
              onMouseLeave={() => setHoveredIndex(null)}
              onMouseMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH;
                const nearest = inflowPoints.reduce(
                  (best, point, index) =>
                    Math.abs(point.x - x) < Math.abs(inflowPoints[best].x - x) ? index : best,
                  0
                );
                setHoveredIndex(nearest);
              }}
            >
              <defs>
                <linearGradient id="inflow-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(99, 255, 190, 0.36)" />
                  <stop offset="100%" stopColor="rgba(99, 255, 190, 0.02)" />
                </linearGradient>
              </defs>
              <path d={`M ${CHART_PADDING} ${CHART_HEIGHT - CHART_PADDING} H ${CHART_WIDTH - CHART_PADDING}`} className="flow-axis" />
              <path d={inflowAreaPath} className="flow-area" />
              <path d={inflowPath} className="flow-line flow-line-in" />
              <path d={outflowPath} className="flow-line flow-line-out" />
              {activeInPoint ? <circle cx={activeInPoint.x} cy={activeInPoint.y} r="4.5" className="flow-dot flow-dot-in" /> : null}
              {activeOutPoint ? <circle cx={activeOutPoint.x} cy={activeOutPoint.y} r="4.2" className="flow-dot flow-dot-out" /> : null}
            </svg>
            <div className="flow-tooltip">
              <p className="flow-tooltip-label">{activeLabel}</p>
              <p className="flow-tooltip-in">Inflow ${activeInValue.toFixed(2)}</p>
              <p className="flow-tooltip-out">Outflow ${activeOutValue.toFixed(2)}</p>
            </div>
          </div>
          <div className="flow-legend">
            <p>
              <span className="legend-dot legend-dot-in" />
              Inflow ${flow.incoming.toFixed(2)}
            </p>
            <p>
              <span className="legend-dot legend-dot-out" />
              Outflow ${flow.outgoing.toFixed(2)}
            </p>
          </div>
        </section>
      </div>
      </section>
    </section>
  );
}
