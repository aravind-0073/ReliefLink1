import React from "react";
import { capitalize } from "../utils/helpers";

export function UrgencyBadge({ urgency }) {
  return <span className={`urgency-badge urgency-${urgency}`}>{capitalize(urgency)}</span>;
}

export function CategoryBadge({ category }) {
  return <span className="urgency-badge urgency-medium" style={{ background: "var(--accent-blue-dim)", color: "var(--accent-blue)", borderColor: "var(--accent-blue-dim)" }}>{capitalize(category)}</span>;
}

export function StatusBadge({ status }) {
  const isRejected = status === "rejected";
  const isCompleted = status === "completed";
  const isInProgress = status === "in-progress";

  let cls = "urgency-low";
  if (isRejected) cls = "urgency-critical";
  if (isInProgress) cls = "urgency-high";
  if (isCompleted) cls = "urgency-low";

  return (
    <span className={`urgency-badge ${cls}`} style={{ opacity: isCompleted ? 0.7 : 1 }}>
      {capitalize(status)}
    </span>
  );
}
