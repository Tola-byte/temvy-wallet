"use client";

import { useMemo, useState } from "react";
import type { BatchSendPaymentInput, BatchSendResponse } from "../lib/backend-api";
import { toFriendlyError } from "../lib/error-format";
import { InlineNotice } from "./app/InlineNotice";

type PersonRow = {
  id: string;
  handle: string;
};

type Props = {
  stablecoinOptions?: string[];
  onCloseSplit?: () => void;
  onSendBatch?: (input: { items: BatchSendPaymentInput[]; stopOnFirstFailure: boolean }) => Promise<BatchSendResponse>;
};

const defaultTokens = ["iUSD", "USDC", "USDT", "AlphaUSD"];

function newPerson(): PersonRow {
  return {
    id: `person_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    handle: ""
  };
}

export function SplitBillComposer({ stablecoinOptions, onCloseSplit, onSendBatch }: Props) {
  const tokens = stablecoinOptions && stablecoinOptions.length > 0 ? stablecoinOptions : defaultTokens;
  const [totalAmount, setTotalAmount] = useState("");
  const [stablecoin, setStablecoin] = useState(tokens[0] ?? "iUSD");
  const [memo, setMemo] = useState("Split bill");
  const [includeSelf, setIncludeSelf] = useState(true);
  const [people, setPeople] = useState<PersonRow[]>([newPerson(), newPerson()]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchSendResponse | null>(null);

  const total = Number(totalAmount);
  const recipients = people.filter((row) => row.handle.trim().length > 0);
  const divisor = includeSelf ? recipients.length + 1 : recipients.length;
  const share = divisor > 0 && Number.isFinite(total) && total > 0 ? total / divisor : 0;

  const previewItems = useMemo(
    () =>
      recipients.map((row, index) => ({
        recipientHandle: row.handle.trim(),
        amountUsd: Number(share.toFixed(2)),
        stablecoin,
        memo: memo.trim() ? `${memo.trim()} (#${index + 1})` : undefined
      })),
    [memo, recipients, share, stablecoin]
  );

  const updatePerson = (id: string, handle: string) => {
    setPeople((current) => current.map((row) => (row.id === id ? { ...row, handle } : row)));
  };

  const addPerson = () => {
    setPeople((current) => [...current, newPerson()]);
  };

  const removePerson = (id: string) => {
    setPeople((current) => (current.length > 1 ? current.filter((row) => row.id !== id) : current));
  };

  const handleCreateSplit = async () => {
    if (!onSendBatch) {
      setError("Connect backend first to send split payments.");
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      setError("Enter a valid total amount.");
      return;
    }
    if (recipients.length === 0) {
      setError("Add at least one recipient.");
      return;
    }
    if (share < 0.01) {
      setError("Per-person share is too small. Increase total or reduce participants.");
      return;
    }

    setSending(true);
    setError(null);
    setResult(null);
    try {
      const response = await onSendBatch({
        stopOnFirstFailure: false,
        items: previewItems
      });
      setResult(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Split payout failed";
      const friendly = toFriendlyError(message);
      setError(`${friendly.title}: ${friendly.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="panel composer-panel">
      <div className="section-title-row">
        <h2>Smart split</h2>
        <span className="chip">Hackathon mode</span>
      </div>
      <p className="meta-text">Set total once, auto-generate equal payouts, and submit as batch.</p>
      <form
        className="composer-form"
        onSubmit={(event) => {
          event.preventDefault();
          void handleCreateSplit();
        }}
      >
        <label>
          Total bill amount (USD)
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="120.00"
            value={totalAmount}
            onChange={(event) => setTotalAmount(event.target.value)}
          />
        </label>
        <label>
          Stablecoin route
          <select value={stablecoin} onChange={(event) => setStablecoin(event.target.value)}>
            {tokens.map((token) => (
              <option value={token} key={token}>
                {token}
              </option>
            ))}
          </select>
        </label>
        <label>
          Memo
          <input type="text" placeholder="Dinner split" value={memo} onChange={(event) => setMemo(event.target.value)} />
        </label>
        <label className="batch-checkbox">
          <input type="checkbox" checked={includeSelf} onChange={(event) => setIncludeSelf(event.target.checked)} />
          Include me in the split
        </label>

        {people.map((person, index) => (
          <article className="batch-row-card" key={person.id}>
            <p className="meta-text">Participant #{index + 1}</p>
            <label>
              Recipient (email / phone)
              <input
                type="text"
                placeholder="john@gmail.com"
                value={person.handle}
                onChange={(event) => updatePerson(person.id, event.target.value)}
              />
            </label>
            <p className="meta-text">Auto share: ${share.toFixed(2)}</p>
            <div className="batch-row-actions">
              <button type="button" className="btn btn-secondary" onClick={() => removePerson(person.id)} disabled={people.length <= 1}>
                Remove
              </button>
            </div>
          </article>
        ))}

        <div className="composer-actions">
          {onCloseSplit ? (
            <button type="button" className="btn btn-secondary" onClick={onCloseSplit}>
              Back to send money
            </button>
          ) : null}
          <button type="button" className="btn btn-secondary" onClick={addPerson}>
            Add participant
          </button>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? "Sending split..." : `Send split (${previewItems.length})`}
          </button>
        </div>
      </form>

      {error ? <InlineNotice title="Split failed" message={error} variant="error" /> : null}
      {result ? (
        <InlineNotice
          title="Split sent"
          message={`Processed ${result.processedCount}/${result.itemCount}. Succeeded: ${result.succeeded}, Failed: ${result.failed}.`}
          variant={result.failed > 0 ? "info" : "success"}
        />
      ) : null}
    </section>
  );
}
