import React, { useState, useEffect } from "react";
import { fetchNeeds, acceptTask, updateNeedStatus } from "../utils/api";
import { UrgencyBadge, CategoryBadge, StatusBadge } from "../components/Badges";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-toastify";
import { formatDate } from "../utils/helpers";

export default function TaskDetail({ user, taskId, setPage }) {
  const id = taskId;
  const [need, setNeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);

  const isVolunteer = user?.role === "volunteer";
  const isMyTask = isVolunteer && need?.volunteerId === user?.id;
  const isAvailable = need && !need.volunteerId && need.status === "open";

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch all needs and find by ID (since getNeedById route works too)
        const res = await fetchNeeds();
        const found = res.data.data.find((n) => n.id === id);
        setNeed(found || null);
      } catch {
        toast.error("Failed to load task");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAccept = async () => {
    try {
      setActioning(true);
      await acceptTask(id);
      toast.success("Task accepted! You're now assigned to this need.");
      setNeed((prev) => ({ ...prev, volunteerId: user.id, status: "in-progress" }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept task");
    } finally {
      setActioning(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setActioning(true);
      await updateNeedStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}!`);
      setNeed((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setActioning(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading task details..." />;
  if (!need) return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h2 style={{ color: "#1e293b" }}>Task not found</h2>
      <button className="btn btn-primary" onClick={() => setPage("needs")} style={{ marginTop: 16 }}>Back to Tasks</button>
    </div>
  );

  const urgencyColor = need.urgency === "critical" ? "#991b1b" : need.urgency === "high" ? "#dc2626" : need.urgency === "medium" ? "#d97706" : "#16a34a";
  const urgencyBg = need.urgency === "critical" ? "#fef2f2" : need.urgency === "high" ? "#fee2e2" : need.urgency === "medium" ? "#fffbeb" : "#dcfce7";

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <button
        className="btn btn-sm"
        onClick={() => setPage("needs")}
        style={{ marginBottom: 20, color: "#64748b" }}
      >
        ← Back
      </button>

      {/* Urgency Banner */}
      <div style={{ background: urgencyBg, border: `1px solid ${urgencyColor}30`, borderRadius: 12, padding: "12px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: urgencyColor, flexShrink: 0 }} />
        <span style={{ color: urgencyColor, fontWeight: 700, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {need.urgency} Priority
        </span>
        <StatusBadge status={need.status} />
      </div>

      {/* Main Card */}
      <div className="card" style={{ padding: 32, marginBottom: 16 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>{need.title}</h1>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <UrgencyBadge urgency={need.urgency} />
          <CategoryBadge category={need.category} />
        </div>
        <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.7, marginBottom: 24 }}>{need.description}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <InfoBlock label="📍 Location" value={need.address || `${need.location?.lat?.toFixed(4)}, ${need.location?.lng?.toFixed(4)}`} />
          <InfoBlock label="👥 People Affected" value={`${need.peopleAffected} people`} />
          <InfoBlock label="📅 Reported On" value={formatDate(need.createdAt)} />
          <InfoBlock label="🔢 Priority Score" value={need.priorityScore} highlight={urgencyColor} />
        </div>
      </div>

      {/* Volunteer Action Panel */}
      {isVolunteer && (
        <div className="card" style={{ padding: 24, background: isMyTask ? "#f0fdf4" : "#ffffff", border: isMyTask ? "1.5px solid #86efac" : "1px solid #e2e8f0" }}>
          {isAvailable && (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Ready to Help?</h3>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>By accepting this task, you commit to addressing this need in your area.</p>
              <button
                className="btn btn-primary"
                onClick={handleAccept}
                disabled={actioning}
                style={{ width: "100%", height: 48, fontSize: 15, fontWeight: 600, background: "#166534" }}
              >
                {actioning ? "Accepting..." : "⚡ Accept This Task"}
              </button>
            </>
          )}

          {isMyTask && (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#166534", marginBottom: 8 }}>✅ Your Active Task</h3>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Update the status as you progress through this task.</p>
              <div style={{ display: "flex", gap: 10 }}>
                {need.status === "in-progress" && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusUpdate("completed")}
                    disabled={actioning}
                    style={{ flex: 1, height: 44 }}
                  >
                    {actioning ? "Updating..." : "✓ Mark as Completed"}
                  </button>
                )}
                {need.status === "pending" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleStatusUpdate("in-progress")}
                    disabled={actioning}
                    style={{ flex: 1, height: 44 }}
                  >
                    {actioning ? "Updating..." : "▶ Start Task"}
                  </button>
                )}
              </div>
            </>
          )}

          {!isAvailable && !isMyTask && need.status !== "rejected" && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
              <p style={{ color: "#64748b", fontSize: 13 }}>This task has already been accepted by another volunteer.</p>
            </div>
          )}

          {need.status === "rejected" && (
            <div style={{ textAlign: "center", padding: "24px 0", background: "#fef2f2", borderRadius: 8, border: "1px solid #fee2e2" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✕</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#991b1b", marginBottom: 4 }}>Suggestion Rejected</h3>
              <p style={{ color: "#b91c1c", fontSize: 13 }}>This suggested need was not approved by the administrative team.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value, highlight }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 16px" }}>
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: highlight || "#1e293b" }}>{value}</div>
    </div>
  );
}
