import React, { useState, useEffect } from "react";
import { fetchMatches, createAssignment } from "../utils/api";
import { UrgencyBadge, StatusBadge } from "../components/Badges";
import { getInitials } from "../utils/helpers";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-toastify";

export default function MatchingPage({ needs, onAssign, initialNeedId }) {
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const activeNeeds = [...needs]
    .filter((n) => n.status !== "completed" && n.status !== "rejected")
    .sort((a, b) => b.priorityScore - a.priorityScore);

  useEffect(() => {
    if (initialNeedId) {
      const found = activeNeeds.find((n) => n.id === initialNeedId);
      if (found) setSelectedNeed(found);
    } else if (activeNeeds.length > 0 && !selectedNeed) {
      setSelectedNeed(activeNeeds[0]);
    }
  }, [activeNeeds, initialNeedId, selectedNeed]);

  useEffect(() => {
    if (!selectedNeed) return;
    setLoading(true);
    fetchMatches(selectedNeed.id)
      .then((res) => setMatches(res.data.data || []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [selectedNeed]);

  const handleAssign = async (volunteerId) => {
    if (selectedNeed?.volunteerId || selectedNeed?.status === "in-progress") {
      if (!window.confirm("Replace current assignment with this volunteer?")) return;
    }
    try {
      await createAssignment({ volunteerId, needId: selectedNeed.id });
      toast.success("Assignment live!");
      if (onAssign) onAssign();
      const res = await fetchMatches(selectedNeed.id);
      setMatches(res.data.data || []);
    } catch {
      toast.error("Failed to assign volunteer");
    }
  };

  return (
    <div className="grid-2 animate-fade-in">
      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Select Incident ({activeNeeds.length})</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {activeNeeds.length === 0 && <div className="search-no-results">No active needs to match.</div>}
          {activeNeeds.map((n) => (
            <div
              key={n.id}
              className={`dropdown-item ${selectedNeed?.id === n.id ? "active" : ""}`}
              style={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: selectedNeed?.id === n.id ? "var(--accent-green-dim)" : "var(--bg-input)",
                padding: "12px",
                borderColor: selectedNeed?.id === n.id ? "var(--accent-green)" : "var(--border)"
              }}
              onClick={() => setSelectedNeed(n)}
            >
              <div style={{ minWidth: 40, textAlign: "center", fontSize: 18, fontWeight: 800, color: `var(--urgency-${n.urgency})` }}>
                {n.priorityScore}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{n.title}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <UrgencyBadge urgency={n.urgency} />
                  {(n.volunteerId || n.status === "in-progress") && (
                    <span style={{ fontSize: 10, color: "var(--accent-green)", fontWeight: 800, padding: "0 6px", borderRadius: 4, background: "var(--accent-green-dim)" }}>
                      ASSIGNED
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
          Smart Match {selectedNeed && `— ${selectedNeed.title}`}
        </h3>
        {loading && <LoadingSpinner message="Calculating optimal matches..." />}
        {!loading && !selectedNeed && <div className="search-no-results">Select an incident to begin matching.</div>}
        {!loading && selectedNeed && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {matches.length === 0 && <div className="search-no-results">No responders found with matching skills in this area.</div>}
            {matches.map((v) => (
              <div key={v.id} className="dropdown-item" style={{ 
                borderRadius: 12, border: "1px solid var(--border)", background: "var(--bg-input)", padding: "16px"
              }}>
                <div style={{ 
                  width: 54, height: 54, borderRadius: "50%", 
                  background: v.matchScore > 70 
                    ? "rgba(34, 197, 94, 0.15)" 
                    : v.matchScore > 40 
                    ? "rgba(234, 179, 8, 0.15)" 
                    : "rgba(239, 68, 68, 0.15)",
                  color: v.matchScore > 70 
                    ? "#22c55e" 
                    : v.matchScore > 40 
                    ? "#eab308" 
                    : "#ef4444",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, marginRight: 16,
                  border: `2px solid ${
                    v.matchScore > 70 ? "#22c55e" : v.matchScore > 40 ? "#eab308" : "#ef4444"
                  }`
                }}>
                  {v.matchScore}%
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{v.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{v.distance}km away • {v.skills.join(", ")}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(v.matchedSkills || []).map(s => (
                      <span key={s} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "var(--accent-green-dim)", color: "var(--accent-green)", fontWeight: 700 }}>{s.toUpperCase()}</span>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => handleAssign(v.id)}>Assign</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
