"use client";

import { useEffect, useMemo, useState } from "react";
import { BatchPaymentComposer } from "../../../components/BatchPaymentComposer";
import { PaymentComposer } from "../../../components/PaymentComposer";
import { SplitBillComposer } from "../../../components/SplitBillComposer";
import { InlineNotice } from "../../../components/app/InlineNotice";
import { fetchDashboard, sendPayment, sendPaymentsBatch } from "../../../lib/backend-api";
import { toFriendlyError } from "../../../lib/error-format";
import { useSession } from "../../../components/app/session-context";

export default function SendPage() {
  const { backendSession, appUserId, backendError, bootstrapping } = useSession();
  const [stablecoins, setStablecoins] = useState<string[]>(["pathUSD"]);
  const [message, setMessage] = useState<{ title: string; body: string } | null>(null);
  const [mode, setMode] = useState<"single" | "batch" | "split">("single");
  const backendFriendly = backendError ? toFriendlyError(backendError) : null;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!backendSession || !appUserId) return;

      try {
        const data = await fetchDashboard(backendSession, appUserId);
        const assets = data.balances.balances.map((entry) => entry.asset);
        if (!cancelled) {
          setStablecoins(assets.length > 0 ? assets : ["pathUSD"]);
        }
      } catch {
        if (!cancelled) {
          setStablecoins(["pathUSD"]);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [appUserId, backendSession]);

  const canSend = useMemo(() => Boolean(backendSession && appUserId && !backendError), [appUserId, backendError, backendSession]);

  const applyPaymentResultMessage = (result: {
    status: "initiated" | "pending_claim" | "submitted" | "settled" | "failed" | "expired";
    txHash?: string;
    recipientHandle: string;
    expiresAt?: string;
    failureMessage?: string;
  }) => {
    const txHash = result.txHash;
    if (result.status === "pending_claim") {
      const expiry = result.expiresAt ? new Date(result.expiresAt).toLocaleString() : "the claim window";
      const body = `Invite created for ${result.recipientHandle}. Funds release automatically after signup before ${expiry}.`;
      setMessage({ title: "Pending claim created", body });
      return { successMessage: body };
    }
    if (result.status === "settled") {
      const body = txHash ? `Payment settled onchain: ${txHash}` : "Payment settled successfully.";
      setMessage({ title: "Payment settled", body });
      return { successMessage: body };
    }
    if (result.status === "submitted" || result.status === "initiated") {
      const body = txHash ? `Payment submitted: ${txHash}` : "Payment submitted for settlement.";
      setMessage({ title: "Payment submitted", body });
      return { successMessage: body };
    }
    if (result.status === "expired") {
      const body = "Claim window expired before recipient signup. Please resend.";
      setMessage({ title: "Claim expired", body });
      return { successMessage: body };
    }
    const failure = result.failureMessage ?? "Payment failed.";
    throw new Error(failure);
  };

  return (
    <section className="page-grid single-col">
      <div className="stack">
        <section className="panel">
          <h2>Send payment</h2>
          <p className="meta-text">Backend signs and submits directly via `/v1/payments/send`.</p>
        </section>
        {bootstrapping ? (
          <InlineNotice title="Preparing session" message="Verifying your Privy identity and backend account..." variant="info" />
        ) : null}
        {backendFriendly ? <InlineNotice title={backendFriendly.title} message={backendFriendly.message} variant="error" /> : null}
        {mode === "single" ? (
          <PaymentComposer
            stablecoinOptions={stablecoins}
            onOpenBatch={() => setMode("batch")}
            onOpenSplit={() => setMode("split")}
            onSend={
              canSend
                ? async (input) => {
                    if (!backendSession) throw new Error("Backend session missing");
                    const result = await sendPayment(backendSession, input);
                    return applyPaymentResultMessage(result);
                  }
                : undefined
            }
          />
        ) : mode === "batch" ? (
          <BatchPaymentComposer
            stablecoinOptions={stablecoins}
            onCloseBatch={() => setMode("single")}
            onSendBatch={
              canSend
                ? async ({ items, stopOnFirstFailure }) => {
                    if (!backendSession) throw new Error("Backend session missing");
                    return sendPaymentsBatch(backendSession, {
                      stopOnFirstFailure,
                      items
                    });
                  }
                : undefined
            }
          />
        ) : (
          <SplitBillComposer
            stablecoinOptions={stablecoins}
            onCloseSplit={() => setMode("single")}
            onSendBatch={
              canSend
                ? async ({ items, stopOnFirstFailure }) => {
                    if (!backendSession) throw new Error("Backend session missing");
                    return sendPaymentsBatch(backendSession, {
                      stopOnFirstFailure,
                      items
                    });
                  }
                : undefined
            }
          />
        )}
        {message ? <InlineNotice title={message.title} message={message.body} variant="success" /> : null}
      </div>
    </section>
  );
}
