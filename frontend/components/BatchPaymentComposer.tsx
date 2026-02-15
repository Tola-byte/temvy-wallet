"use client";

import { useMemo, useState } from "react";
import type { BatchSendPaymentInput, BatchSendResponse } from "../lib/backend-api";
import { toFriendlyError } from "../lib/error-format";
import { InlineNotice } from "./app/InlineNotice";

type DraftRow = {
  id: string;
  recipientHandle: string;
  amountUsd: string;
  stablecoin: string;
  memo: string;
};

type Props = {
  stablecoinOptions?: string[];
  onSendBatch?: (input: { items: BatchSendPaymentInput[]; stopOnFirstFailure: boolean }) => Promise<BatchSendResponse>;
  onCloseBatch?: () => void;
};

const defaultTokens = ["iUSD", "USDC", "USDT", "AlphaUSD"];

function newRow(defaultStablecoin: string): DraftRow {
  return {
    id: `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    recipientHandle: "",
    amountUsd: "",
    stablecoin: defaultStablecoin,
    memo: ""
  };
}

export function BatchPaymentComposer({ stablecoinOptions, onSendBatch, onCloseBatch }: Props) {
  const tokens = stablecoinOptions && stablecoinOptions.length > 0 ? stablecoinOptions : defaultTokens;
  const [rows, setRows] = useState<DraftRow[]>([newRow(tokens[0] ?? "iUSD")]);
  const [stopOnFirstFailure, setStopOnFirstFailure] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchSendResponse | null>(null);

  const totalAmount = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.amountUsd) > 0 ? Number(row.amountUsd) : 0), 0),
    [rows]
  );

  const updateRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    setRows((current) => [...current, newRow(tokens[0] ?? "iUSD")]);
  };

  const removeRow = (id: string) => {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.id !== id) : current));
  };

  const handleSubmit = async () => {
    if (!onSendBatch) {
      setError("Connect backend first to send a batch.");
      return;
    }

    const items: BatchSendPaymentInput[] = rows.map((row) => ({
      recipientHandle: row.recipientHandle.trim(),
      amountUsd: Number(row.amountUsd),
      stablecoin: row.stablecoin,
      memo: row.memo.trim() || undefined
    }));

    if (items.some((item) => !item.recipientHandle || !Number.isFinite(item.amountUsd) || item.amountUsd <= 0)) {
      setError("Complete all rows with valid recipient and amount.");
      return;
    }

    setSending(true);
    setError(null);
    setResult(null);
    try {
      const response = await onSendBatch({ items, stopOnFirstFailure });
      setResult(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Batch send failed";
      const friendly = toFriendlyError(message);
      setError(`${friendly.title}: ${friendly.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="panel composer-panel">
      <div className="section-title-row">
        <h2>Batch payout</h2>
        <span className="chip">No wallet address required</span>
      </div>
      <p className="meta-text">
        Queue multiple transfers in one request. {rows.length} transaction{rows.length === 1 ? "" : "s"} · $
        {totalAmount.toFixed(2)} total
      </p>
      <form
        className="composer-form"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        {rows.map((row, index) => (
          <article className="batch-row-card" key={row.id}>
            <p className="meta-text">Transaction #{index + 1}</p>
            <label>
              Send to (email / phone)
              <input
                type="text"
                placeholder="john@gmail.com"
                value={row.recipientHandle}
                onChange={(event) => updateRow(row.id, { recipientHandle: event.target.value })}
              />
            </label>
            <label>
              Amount (USD)
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="25.00"
                value={row.amountUsd}
                onChange={(event) => updateRow(row.id, { amountUsd: event.target.value })}
              />
            </label>
            <label>
              Stablecoin route
              <select value={row.stablecoin} onChange={(event) => updateRow(row.id, { stablecoin: event.target.value })}>
                {tokens.map((token) => (
                  <option value={token} key={token}>
                    {token}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Memo
              <input
                type="text"
                placeholder="Dinner split"
                value={row.memo}
                onChange={(event) => updateRow(row.id, { memo: event.target.value })}
              />
            </label>
            <div className="batch-row-actions">
              <button type="button" className="btn btn-secondary" onClick={() => removeRow(row.id)} disabled={rows.length <= 1}>
                Remove
              </button>
            </div>
          </article>
        ))}
        <label className="batch-checkbox batch-stop-checkbox">
          <input
            type="checkbox"
            checked={stopOnFirstFailure}
            onChange={(event) => setStopOnFirstFailure(event.target.checked)}
          />
          Stop on first failure
        </label>
        <div className="composer-actions">
          {onCloseBatch ? (
            <button type="button" className="btn btn-secondary" onClick={onCloseBatch}>
              Back to send money
            </button>
          ) : null}
          <button type="button" className="btn btn-secondary" onClick={addRow}>
            Add transaction
          </button>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? "Sending batch..." : `Send ${rows.length} transaction${rows.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </form>

      {error ? <InlineNotice title="Batch failed" message={error} variant="error" /> : null}

      {result ? (
        <>
          <InlineNotice
            title="Batch processed"
            message={`Processed ${result.processedCount}/${result.itemCount}. Succeeded: ${result.succeeded}, Failed: ${result.failed}.`}
            variant={result.failed > 0 ? "info" : "success"}
          />
          <div className="timeline-list">
            {result.results.map((item) => (
              <article key={`${result.batchId}_${item.index}`} className="timeline-item">
                <div>
                  <p className="timeline-name">#{item.index + 1}</p>
                  <p className="timeline-meta">{item.idempotencyKey}</p>
                </div>
                <div>
                  {item.ok ? (
                    <p className="amount-positive">{item.payment?.status ?? "ok"}</p>
                  ) : (
                    <p className="amount-negative">{item.error ?? "failed"}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
