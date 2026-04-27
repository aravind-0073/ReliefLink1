import React from "react";
import { useVolunteers } from "../hooks/useVolunteers";
import { useNeeds } from "../hooks/useNeeds";
import { getInitials, getAvatarStyle, formatDate } from "../utils/helpers";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-toastify";

export default function VolunteersPage({ assignments }) {
  const { volunteers, loading, remove, update } = useVolunteers();
  const { needs } = useNeeds();

  if (loading) return <LoadingSpinner message="Loading volunteers..." />;

  const handleToggleAvailability = async (vol) => {
    try {
      await update(vol.id, { availability: !vol.availability });
      toast.success(`${vol.name} marked as ${!vol.availability ? "available" : "unavailable"}`);
    } catch {
      toast.error("Failed to update volunteer");
    }
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: "1rem", fontFamily: "monospace" }}>
        {volunteers.length} volunteers · {volunteers.filter((v) => v.availability).length} available
      </div>
      <div className="grid-2">
        {volunteers.map((v, i) => {
          const style = getAvatarStyle(i);
          const activeAssignments = assignments.filter((a) => a.volunteerId === v.id && a.status === "in-progress");
          const isBusy = activeAssignments.length > 0;
          const statusColor = isBusy ? "#ef4444" : v.availability ? "#22c55e" : "#94a3b8";
          const statusText = isBusy ? "Busy" : v.availability ? "Available" : "Unavailable";

          return (
            <div key={v.id} className="card vol-card">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div className="vol-avatar" style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, background: style.bg, color: style.color }}>
                  {getInitials(v.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{v.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor }} />
                    <span style={{ fontSize: 12, color: isBusy ? "#ef4444" : "#64748b", fontWeight: isBusy ? 600 : 400 }}>{statusText}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <button className="btn btn-sm" onClick={() => handleToggleAvailability(v)} style={{ fontSize: 11 }}>
                    {v.availability ? "Set Unavailable" : "Set Available"}
                  </button>
                  <button className="btn btn-sm" style={{ fontSize: 11, color: "#dc2626", borderColor: "#fca5a5" }} onClick={async () => {
                    if (window.confirm("Delete this volunteer?")) {
                      await remove(v.id);
                      toast.success("Volunteer removed");
                    }
                  }}>Delete</button>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                {v.skills.map((s) => <span key={s} className="skill-tag">{s}</span>)}
              </div>
              {activeAssignments.length > 0 && (
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
                  <div style={{ color: "#94a3b8", marginBottom: 4, fontWeight: 500 }}>Active tasks:</div>
                  {activeAssignments.map((a) => {
                    const n = needs.find((n) => n.id === a.needId);
                    return n ? (
                      <div key={a.id} style={{ color: "#475569", marginBottom: 2 }}>→ {n.title}</div>
                    ) : null;
                  })}
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
                📍 {v.address || "Location not set"} · Joined {formatDate(v.createdAt)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
