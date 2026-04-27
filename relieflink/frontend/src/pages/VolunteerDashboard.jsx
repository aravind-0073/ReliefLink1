import React from "react";
import MetricCard from "../components/MetricCard";
import NeedCard from "../components/NeedCard";
import { StatusBadge, UrgencyBadge, CategoryBadge } from "../components/Badges";
import { URGENCY_COLORS } from "../utils/helpers";

export default function VolunteerDashboard({ user, needs, assignments, setPage, onNeedUpdate }) {

  const myNeeds = needs.filter((n) => n.volunteerId === user?.id);
  const activeNeeds = myNeeds.filter((n) => n.status === "in-progress");
  const completedNeeds = myNeeds.filter((n) => n.status === "completed");
  const availableNeeds = needs.filter((n) => !n.volunteerId && (n.status === "pending" || n.status === "open")).slice(0, 5);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>Welcome, {user?.name || "Volunteer"}! 👋</h2>
        <p style={{ color: "#64748b" }}>Here's your current task overview</p>
      </div>

      <div className="grid-4" style={{ marginBottom: "1.5rem" }}>
        <MetricCard label="Active Tasks" value={activeNeeds.length} sub="in progress" color="#2563eb" />
        <MetricCard label="Completed" value={completedNeeds.length} sub="tasks finished" color="#16a34a" />
        <MetricCard label="Available" value={availableNeeds.length} sub="needs open for you" color="#d97706" />
        <MetricCard label="Impact" value={myNeeds.reduce((s, n) => s + (n.peopleAffected || 0), 0)} sub="people helped" color="#7c3aed" />
      </div>

      <div className="grid-2">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="section-title" style={{ marginBottom: 16, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>My Active Tasks</div>
          {activeNeeds.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>No active tasks right now.</p>
              <button className="btn btn-primary" onClick={() => setPage("needs")}>Browse Available Needs</button>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {activeNeeds.map((n, i) => (
              <NeedCard key={n.id} need={n} user={user} index={i} onStatusChange={onNeedUpdate} />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="section-title" style={{ marginBottom: 16, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Available Needs Near You</div>
          {availableNeeds.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No open needs at the moment.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {availableNeeds.map((n, i) => (
              <NeedCard key={n.id} need={n} user={user} index={i} onStatusChange={onNeedUpdate} />
            ))}
          </div>
          <button
            className="btn"
            style={{ width: "100%", marginTop: 8, fontSize: 13, background: "var(--bg-input)", color: "var(--text-primary)" }}
            onClick={() => setPage("needs")}
          >
            See all available needs →
          </button>
        </div>
      </div>
    </div>
  );
}



