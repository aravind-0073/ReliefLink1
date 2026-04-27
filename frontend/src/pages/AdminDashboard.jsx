import React, { useRef, useEffect, useState, useCallback } from "react";
import { Chart, ArcElement, DoughnutController, Tooltip, Legend, BarElement, BarController, CategoryScale, LinearScale } from "chart.js";
import MetricCard from "../components/MetricCard";
import { StatusBadge, UrgencyBadge, CategoryBadge } from "../components/Badges";
import { useAnalytics } from "../hooks/useAnalytics";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDate, getInitials, getAvatarStyle } from "../utils/helpers";
import { getPendingTasks, approveTask, rejectTask } from "../utils/api";
import { toast } from "react-toastify";
import LiveMap from "../components/LiveMap";

Chart.register(ArcElement, DoughnutController, Tooltip, Legend, BarElement, BarController, CategoryScale, LinearScale);

export default function AdminDashboard({ needs, volunteers, assignments, setPage, addNotification }) {
  const { analytics, loading } = useAnalytics();
  const doughnutRef = useRef(null);
  const barRef = useRef(null);
  const doughnutInst = useRef(null);
  const barInst = useRef(null);

  const [pendingTasks, setPendingTasks] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [actioning, setActioning] = useState(null);

  const loadPending = useCallback(async () => {
    try {
      setPendingLoading(true);
      const res = await getPendingTasks();
      setPendingTasks(res.data.data || []);
    } catch {
      // silent
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  const handleApprove = async (id) => {
    try {
      const task = pendingTasks.find(t => t.id === id);
      setActioning(id);
      await approveTask(id);
      toast.success("Task approved! Now live 🚀");
      addNotification("Need Approved", `"${task?.title}" has been approved and is now live.`, "success");
      setPendingTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      toast.error("Failed to approve task");
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this suggestion?")) return;
    try {
      const task = pendingTasks.find(t => t.id === id);
      setActioning(id);
      await rejectTask(id);
      toast.info("Task rejected.");
      addNotification("Need Rejected", `"${task?.title}" suggestion was rejected.`, "error");
      setPendingTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      toast.error("Failed to reject task");
    } finally {
      setActioning(null);
    }
  };

  useEffect(() => {
    if (!doughnutRef.current || !analytics) return;
    if (doughnutInst.current) doughnutInst.current.destroy();
    doughnutInst.current = new Chart(doughnutRef.current, {
      type: "doughnut",
      data: {
        labels: ["Food", "Health", "Education", "Disaster"],
        datasets: [{
          data: [
            analytics.byCategory?.food || 0,
            analytics.byCategory?.health || 0,
            analytics.byCategory?.education || 0,
            analytics.byCategory?.disaster || 0,
          ],
          backgroundColor: ["#22c55e", "#ef4444", "#3b82f6", "#f97316"],
          borderWidth: 0,
          borderRadius: 4,
          spacing: 4,
        }],
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        cutout: "75%",
        plugins: { legend: { display: false } } 
      },
    });
    return () => { if (doughnutInst.current) doughnutInst.current.destroy(); };
  }, [analytics]);

  useEffect(() => {
    if (!barRef.current || !analytics) return;
    if (barInst.current) barInst.current.destroy();
    barInst.current = new Chart(barRef.current, {
      type: "bar",
      data: {
        labels: ["Pending", "In Progress", "Done"],
        datasets: [{
          data: [analytics.pendingNeeds, analytics.inProgressNeeds, analytics.completedNeeds],
          backgroundColor: ["#6b7280", "#3b82f6", "#22c55e"],
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { 
          y: { display: false },
          x: { grid: { display: false }, ticks: { color: "#6b7280", font: { size: 10 } } }
        },
      },
    });
    return () => { if (barInst.current) barInst.current.destroy(); };
  }, [analytics]);

  if (loading) return <LoadingSpinner message="Calculating analytics..." />;

  const topNeeds = [...needs].filter((n) => n.status !== "completed").slice(0, 5);

  const feedEvents = (() => {
    const events = [];

    needs.forEach((n) => {
      // Volunteer self-accepted
      if (n.acceptedAt) {
        events.push({
          id: `accept-${n.id}`,
          icon: "🤝",
          color: "var(--accent-blue)",
          bg: "var(--accent-blue-dim)",
          text: `${n.volunteerEmail || "A volunteer"} accepted "${n.title}"`,
          time: n.acceptedAt,
        });
      }
      // Task completed
      if (n.status === "completed" && n.updatedAt) {
        events.push({
          id: `done-${n.id}`,
          icon: "✅",
          color: "var(--accent-green)",
          bg: "var(--accent-green-dim)",
          text: `"${n.title}" marked complete`,
          time: n.updatedAt,
        });
      }
      // New critical / high needs
      if ((n.urgency === "critical" || n.urgency === "high") && n.status !== "completed" && n.createdAt) {
        events.push({
          id: `new-${n.id}`,
          icon: n.urgency === "critical" ? "🚨" : "⚠️",
          color: n.urgency === "critical" ? "var(--urgency-critical)" : "var(--urgency-high)",
          bg: n.urgency === "critical" ? "var(--urgency-critical-bg)" : "var(--urgency-high-bg)",
          text: `New ${n.urgency} need reported: "${n.title}"`,
          time: n.createdAt,
        });
      }
    });

    // Admin-dispatched assignments
    assignments.forEach((a) => {
      const vol = volunteers.find((v) => v.id === a.volunteerId);
      const need = needs.find((n) => n.id === a.needId);
      if (vol && need && a.createdAt) {
        events.push({
          id: `assign-${a.id}`,
          icon: "👥",
          color: "var(--accent-blue)",
          bg: "var(--accent-blue-dim)",
          text: `${vol.name} dispatched to "${need.title}"`,
          time: a.createdAt,
        });
      }
    });

    return events
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 8)
      // deduplicate by id
      .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i);
  })();

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1px", color: "var(--text-primary)" }}>Ops Overview</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>Real-time coordination & resource triage</p>
      </header>

      <div className="grid-4" style={{ marginBottom: 32 }}>
        <MetricCard label="Total Impact" value={analytics?.totalPeopleHelped || 0} sub="lives touched" icon="✨" />
        <MetricCard label="Critical" value={analytics?.urgentNeeds || 0} sub="needs attention" icon="🚨" />
        <MetricCard label="Responders" value={volunteers.length} sub={`${analytics?.availableVolunteers || 0} active`} icon="🤝" />
        <MetricCard label="Efficiency" value={`${Math.round((analytics?.completedNeeds / analytics?.totalNeeds) * 100) || 0}%`} sub="completion rate" icon="📈" />
      </div>

      <div className="card" style={{ marginBottom: 32, padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Live Incident View</h3>
          <button className="btn btn-sm" onClick={() => setPage("map")}>Open Full Map ↗</button>
        </div>
        <LiveMap 
          needs={needs} 
          volunteers={volunteers} 
          user={{ role: "admin" }} 
          onMatchClick={(id) => {
            // Since we're in Dashboard, we might want to handle match click differently 
            // but let's just use the prop if passed or a local navigation.
            setPage("matching");
          }} 
          height={320}
          showFilters={true}
        />
      </div>

      <div className="grid-2" style={{ marginBottom: 32 }}>
        {/* Pending Approval Panel */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Volunteer Suggestions</h3>
            <span className="urgency-badge urgency-medium">{pendingTasks.length} Awaiting</span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {pendingTasks.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "20px 0", textAlign: "center" }}>🌱 All suggestions reviewed</div>}
            {pendingTasks.map((task) => (
              <div key={task.id} style={{ padding: "16px", background: "var(--bg-input)", borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{task.title}</span>
                  <UrgencyBadge urgency={task.urgency} />
                </div>
                {/* Origin tag */}
                <div style={{ marginBottom: 8 }}>
                  {task.createdByRole === "user" ? (
                    <span style={{ display: "inline-block", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                      🙋 Requested by User
                    </span>
                  ) : (
                    <span style={{ display: "inline-block", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: "var(--accent-blue-dim)", color: "var(--accent-blue)", border: "1px solid rgba(59,130,246,0.3)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                      🤝 Suggested by Volunteer
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>{task.description}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleApprove(task.id)} disabled={actioning === task.id}>Approve</button>
                  <button className="btn btn-sm" style={{ flex: 1, color: "var(--urgency-critical)" }} onClick={() => handleReject(task.id)} disabled={actioning === task.id}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Queue */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Priority Queue</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {topNeeds.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No urgent needs</div>}
            {topNeeds.map((n) => (
              <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: `var(--urgency-${n.urgency})` }}>
                  {n.priorityScore}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{n.category} • {n.peopleAffected} affected</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setPage("matching")}>Match</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Analytics Card */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Resource Distribution</h3>
          <div style={{ height: 220, position: "relative" }}>
            <canvas ref={doughnutRef} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{analytics?.totalNeeds}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Needs</div>
            </div>
          </div>
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: 12, background: "var(--bg-input)", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Trend</div>
              <div style={{ height: 40 }}><canvas ref={barRef} /></div>
            </div>
            <div style={{ padding: 12, background: "var(--bg-input)", borderRadius: 8, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Active Responders</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent-green)" }}>{analytics?.availableVolunteers}</div>
            </div>
          </div>
        </div>

        {/* Activity Timeline Feed */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Live Feed</h3>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {feedEvents.length} events
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
            {/* Vertical timeline line */}
            {feedEvents.length > 0 && (
              <div style={{
                position: "absolute",
                left: 15,
                top: 0,
                bottom: 0,
                width: 2,
                background: "var(--border)",
                borderRadius: 2,
              }} />
            )}

            {feedEvents.length === 0 && (
              <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
                🌱 No recent activity
              </div>
            )}

            {feedEvents.map((ev, i) => (
              <div key={ev.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingBottom: 16, position: "relative" }}>
                {/* Icon bubble */}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: ev.bg,
                  border: `2px solid ${ev.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, flexShrink: 0,
                  position: "relative", zIndex: 1,
                }}>
                  {ev.icon}
                </div>
                {/* Content */}
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.4 }}>
                    {ev.text}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                    {formatDate(ev.time)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
