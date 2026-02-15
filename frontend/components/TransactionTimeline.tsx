import Link from "next/link";
import type { Contact, Transfer } from "../lib/types";
import { formatDateLabel, formatUsd } from "../lib/finance";

type Props = {
  history: Transfer[];
  contacts: Contact[];
  limit?: number;
  showMoreHref?: string;
};

const byNewest = (a: Transfer, b: Transfer) => {
  return new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf();
};

export function TransactionTimeline({ history, contacts, limit, showMoreHref }: Props) {
  const sorted = [...history].sort(byNewest);
  const visible = typeof limit === "number" ? sorted.slice(0, limit) : sorted;
  const shouldShowMore = typeof limit === "number" && sorted.length > limit && Boolean(showMoreHref);

  const lookup = new Map(contacts.map((c) => [c.id, c]));

  return (
    <section className="panel">
      <div className="section-title-row">
        <h2>Activity feed</h2>
        <span className="chip">Chat-like timeline</span>
      </div>
      <div className="timeline-list">
        {visible.map((item) => {
          const contact = lookup.get(item.contactId);
          const isIncoming = item.direction === "received";
          return (
            <article key={item.id} className="timeline-item">
              <div className="timeline-main">
                <p className="timeline-name">{contact?.name ?? "Unknown contact"}</p>
                <p className="timeline-memo">{item.memo}</p>
                <p className="timeline-meta">
                  {item.stablecoin} on {item.chainLabel} · {formatDateLabel(item.createdAt)}
                </p>
              </div>
              <p className={isIncoming ? "amount-positive" : "amount-negative"}>
                {isIncoming ? "+" : "-"}
                {formatUsd(item.amountUsd)}
              </p>
            </article>
          );
        })}
      </div>
      {shouldShowMore && showMoreHref ? (
        <div className="composer-actions" style={{ marginTop: "0.65rem", justifyContent: "flex-end" }}>
          <Link href={showMoreHref} className="btn btn-secondary">
            More
          </Link>
        </div>
      ) : null}
    </section>
  );
}
