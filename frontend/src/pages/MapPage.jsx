import React from "react";
import LiveMap from "../components/LiveMap";
import { capitalize } from "../utils/helpers";

export default function MapPage({ needs, volunteers, user, onMatchClick }) {
  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>Live Map</h2>
          <p style={{ color: "var(--text-secondary)" }}>Real-time community needs visualizer.</p>
        </div>
      </div>

      <LiveMap 
        needs={needs} 
        volunteers={volunteers} 
        user={user} 
        onMatchClick={onMatchClick} 
        height={500} 
      />

      <div className="grid-4" style={{ marginTop: 24 }}>
        {[["Critical", "critical"], ["High", "high"], ["Medium", "medium"], ["Low", "low"]].map(([label, u]) => (
          <div key={u} className="metric-card" style={{ padding: 16 }}>
            <div className="metric-label" style={{ color: `var(--urgency-${u})` }}>{label} Incidents</div>
            <div className="metric-value" style={{ fontSize: 24 }}>
              {needs.filter((n) => n.urgency === u).length}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
