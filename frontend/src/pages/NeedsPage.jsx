import React, { useState } from "react";
import NeedCard from "../components/NeedCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNeeds } from "../hooks/useNeeds";

const CATEGORIES = ["all", "food", "health", "education", "disaster", "other"];
const URGENCIES = ["all", "critical", "high", "medium", "low"];

export default function NeedsPage({ user, onNeedUpdate }) {
  const [catFilter, setCatFilter] = useState("all");
  const [urgFilter, setUrgFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { needs, loading, error, updateStatus } = useNeeds({
    category: catFilter !== "all" ? catFilter : undefined,
    urgency: urgFilter !== "all" ? urgFilter : undefined,
    search,
  });

  const handleStatusChange = async (id, status) => {
    if (onNeedUpdate) onNeedUpdate();
  };

  if (loading) return <LoadingSpinner message="Loading needs..." />;
  if (error) return <div style={{ color: "#dc2626", padding: "2rem" }}>Error: {error}</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search needs by title or description..."
            style={{ paddingLeft: 32 }}
          />
        </div>
      </div>
      <div className="filter-row">
        {CATEGORIES.map((c) => (
          <button key={c} className={`filter-chip ${catFilter === c ? "active" : ""}`} onClick={() => setCatFilter(c)}>
            {c === "all" ? "All categories" : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
        <div style={{ width: 1, background: "#e2e8f0", margin: "0 4px" }} />
        {URGENCIES.map((u) => (
          <button key={u} className={`filter-chip ${urgFilter === u ? "active" : ""}`} onClick={() => setUrgFilter(u)}>
            {u === "all" ? "All urgency" : u.charAt(0).toUpperCase() + u.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: "1rem", fontFamily: "monospace" }}>
        {needs.length} needs · sorted by priority score
      </div>
      {needs.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8", fontSize: 13 }}>
          No needs match the current filters.
        </div>
      )}
      {needs.map((need) => (
        <NeedCard key={need.id} need={need} user={user} onStatusChange={handleStatusChange} />
      ))}
    </div>
  );
}
