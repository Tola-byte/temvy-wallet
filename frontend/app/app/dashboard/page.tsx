"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BalanceOverview } from "../../../components/BalanceOverview";
import { ContactBalances } from "../../../components/ContactBalances";
import { TransactionTimeline } from "../../../components/TransactionTimeline";
import { InlineNotice } from "../../../components/app/InlineNotice";
import { fetchDashboard } from "../../../lib/backend-api";
import { toFriendlyError } from "../../../lib/error-format";
import { buildNetFlow, getTotalBalance } from "../../../lib/finance";
import { mapBalances, mapContacts, mapLedgerForUI, mapTransfers } from "../../../lib/ui-adapters";
import { useSession } from "../../../components/app/session-context";
import type { Contact, TokenBalance, Transfer } from "../../../lib/types";

export default function DashboardPage() {
  const { backendSession, appUserId, backendError, bootstrapping } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [ledgerRows, setLedgerRows] = useState<ReturnType<typeof mapLedgerForUI>>([]);

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
          setLedgerRows(mapLedgerForUI(data.ledger, mappedContacts));
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
        <section className="panel flow-panel">
          <p className="meta-text">Flow overview</p>
          <p className="amount-positive">Incoming ${flow.incoming.toFixed(2)}</p>
          <p className="amount-negative">Outgoing ${flow.outgoing.toFixed(2)}</p>
          <p className="meta-text">{settles} inbound settlements · {expenses} outgoing payments</p>
        </section>
        <ContactBalances rows={ledgerRows} />
        <TransactionTimeline history={transfers} contacts={contacts} />
      </div>
      <div className="stack">
        <section className="panel">
          <div className="section-title-row">
            <h2>Hackathon Edge</h2>
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
      </div>
      </section>
    </section>
  );
}
