import React from "react";

export default function MetricCard({ label, value, sub, icon }) {
  return (
    <div className="metric-card animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div className="metric-label">{label}</div>
        <div style={{ fontSize: 18 }}>{icon}</div>
      </div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}
