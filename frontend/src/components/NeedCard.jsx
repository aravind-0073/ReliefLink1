import React, { useState } from "react";
import { UrgencyBadge, CategoryBadge, StatusBadge } from "./Badges";
import { fetchMatches, createAssignment, acceptTask, updateNeedStatus } from "../utils/api";
import { getInitials, formatDate } from "../utils/helpers";
import { toast } from "react-toastify";

export default function NeedCard({ need, user, onStatusChange, showMatchButton = true, index = 0 }) {
  const [matches, setMatches] = useState(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const isAdmin = user?.role === "admin";
  const isVolunteer = user?.role === "volunteer";
  const isMyTask = isVolunteer && need.volunteerId === user?.id;
  const isAvailable = !need.volunteerId && need.status === "open";

  const handleFindMatch = async (e) => {
    e.stopPropagation();
    if (showMatches) { setShowMatches(false); return; }
    try {
      setLoadingMatches(true);
      const res = await fetchMatches(need.id);
      setMatches(res.data.data);
      setShowMatches(true);
    } catch {
      toast.error("Failed to load matches");
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleAssign = async (volunteerId) => {
    try {
      await createAssignment({ volunteerId, needId: need.id });
      toast.success("Volunteer assigned successfully!");
      setShowMatches(false);
      if (onStatusChange) onStatusChange(need.id, "in-progress");
    } catch {
      toast.error("Failed to assign volunteer");
    }
  };

  const handleAcceptTask = async (e) => {
    e.stopPropagation();
    try {
      setAccepting(true);
      await acceptTask(need.id);
      toast.success("Task accepted! You're now responsible for this need.");
      if (onStatusChange) onStatusChange(need.id, "in-progress");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept task");
    } finally {
      setAccepting(false);
    }
  };

  const handleMarkDone = async (e) => {
    e.stopPropagation();
    try {
      // Find the active assignment for this need, then mark it completed
      // This triggers the backend to also set volunteer availability = true
      const { fetchAssignments, updateAssignmentStatus } = await import("../utils/api");
      const res = await fetchAssignments({ needId: need.id, status: "in-progress" });
      const assignment = res.data.data?.[0];
      if (!assignment) {
        // Fallback: just update the need status directly
        await updateNeedStatus(need.id, "completed");
      } else {
        await updateAssignmentStatus(assignment.id, "completed");
      }
      toast.success("Task marked as completed! Volunteer is now available again.");
      if (onStatusChange) onStatusChange(need.id, "completed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const urgencyColor = `var(--urgency-${need.urgency})`;
  const barWidth = Math.min((need.priorityScore / 20) * 100, 100);

  return (
    <div 
      className="card animate-fade-in" 
      style={{ 
        marginBottom: 16, 
        animationDelay: `${index * 0.05}s`,
        cursor: "default"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ minWidth: 60, textAlign: "center" }}>
          {need.status !== "rejected" ? (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, color: urgencyColor, lineHeight: 1 }}>
                {need.priorityScore}
              </div>
              <div style={{ height: 4, background: "var(--bg-input)", borderRadius: 2, margin: "8px 0", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${barWidth}%`, background: urgencyColor }} />
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Priority</div>
            </>
          ) : (
            <div style={{ fontSize: 24, color: "var(--text-muted)", opacity: 0.5 }}>✕</div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>{need.title}</span>
            <UrgencyBadge urgency={need.urgency} />
            <CategoryBadge category={need.category} />
            <StatusBadge status={need.status} />
          </div>
          
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
            {need.description}
          </p>

          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>👥 {need.peopleAffected} affected</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📍 {need.address || "Location pending"}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📅 {formatDate(need.createdAt)}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          {/* Admin actions */}
          {isAdmin && (need.status === "pending" || need.status === "open") && showMatchButton && (
            <button className="btn btn-primary btn-sm" onClick={handleFindMatch} disabled={loadingMatches}>
              {loadingMatches ? "..." : showMatches ? "Hide" : "⚡ Find Match"}
            </button>
          )}
          {isAdmin && need.status === "in-progress" && (
            <button className="btn btn-sm" style={{ borderColor: "var(--accent-green)", color: "var(--accent-green)" }} onClick={handleMarkDone}>✓ Complete</button>
          )}

          {/* Volunteer actions */}
          {isVolunteer && isAvailable && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleAcceptTask}
              disabled={accepting}
            >
              {accepting ? "..." : "🤝 Accept Task"}
            </button>
          )}
          {isVolunteer && isMyTask && need.status === "in-progress" && (
            <button className="btn btn-sm" style={{ borderColor: "var(--accent-green)", color: "var(--accent-green)" }} onClick={handleMarkDone}>✓ Mark Done</button>
          )}
          
          {need.status === "rejected" && (
            <span style={{ color: "var(--urgency-critical)", fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>Rejected</span>
          )}
        </div>
      </div>

      {showMatches && matches && (
        <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
            Recommended Responders ({matches.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {matches.slice(0, 4).map((v) => (
              <div key={v.id} className="dropdown-item" style={{ 
                borderRadius: 10, 
                border: "1px solid var(--border)",
                background: "var(--bg-input)",
                padding: "12px"
              }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: "50%", 
                  background: "var(--accent-blue-dim)", color: "var(--accent-blue)",
                  display: "flex", alignItems: "center", justifyCenter: "center",
                  fontSize: 12, fontWeight: 800, marginRight: 12
                }}>
                  {getInitials(v.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{v.matchScore}% Match • {v.distance}km away</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleAssign(v.id)}>Assign</button>
              </div>
            ))}
            {matches.length === 0 && <div className="search-no-results">No immediate matches found.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
