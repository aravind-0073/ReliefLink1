import React, { useState, useEffect, useCallback } from "react";
import { fetchNeeds } from "../utils/api";
import { StatusBadge, UrgencyBadge, CategoryBadge } from "../components/Badges";
import { formatDate } from "../utils/helpers";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import MetricCard from "../components/MetricCard";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const CATEGORIES = ["food", "health", "education", "disaster", "other"];
const URGENCIES = ["low", "medium", "high", "critical"];

const STATUS_META = {
  pending:     { label: "Awaiting Review",  icon: "⏳", color: "#d97706",                 bg: "rgba(217,119,6,0.12)"  },
  open:        { label: "Approved",         icon: "✅", color: "var(--accent-green)",      bg: "var(--accent-green-dim)" },
  "in-progress":{ label: "Help On The Way", icon: "🚀", color: "var(--accent-blue)",       bg: "var(--accent-blue-dim)" },
  completed:   { label: "Resolved",         icon: "🎉", color: "#a3e635",                  bg: "rgba(163,230,53,0.12)" },
  rejected:    { label: "Declined",         icon: "❌", color: "var(--urgency-critical)",  bg: "var(--urgency-critical-bg)" },
};

export default function UserDashboard({ user }) {
  const [myNeeds, setMyNeeds]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [selected, setSelected]   = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "food",
    urgency: "medium", peopleAffected: "", address: "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const loadMyNeeds = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchNeeds();
      setMyNeeds(res.data.data || []);
    } catch {
      toast.error("Failed to load your requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMyNeeds(); }, [loadMyNeeds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.peopleAffected || !form.address) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const geoRes = await fetch(`${NOMINATIM_URL}?q=${encodeURIComponent(form.address)}&format=json&limit=1`, {
        headers: { "Accept-Language": "en", "User-Agent": "ReliefLink/1.0" },
      });
      const geoData = await geoRes.json();
      if (!geoData.length) {
        toast.error("Could not find that location. Try being more specific.");
        setSubmitting(false);
        return;
      }
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          peopleAffected: Number(form.peopleAffected),
          location: { lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Your request has been submitted for admin review!");
      setForm({ title: "", description: "", category: "food", urgency: "medium", peopleAffected: "", address: "" });
      setShowForm(false);
      await loadMyNeeds();
    } catch (err) {
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const pending     = myNeeds.filter((n) => n.status === "pending");
  const active      = myNeeds.filter((n) => n.status === "in-progress" || n.status === "open");
  const resolved    = myNeeds.filter((n) => n.status === "completed");

  if (loading) return <LoadingSpinner message="Loading your requests..." />;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
            My Requests
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
            Track your submitted relief requests and see who is helping you.
          </p>
        </div>
        <button
          className="btn btn-primary"
          style={{ gap: 8 }}
          onClick={() => { setShowForm(true); setSelected(null); }}
        >
          ➕ Submit New Request
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        <MetricCard label="Total Requests" value={myNeeds.length} sub="submitted by you" color="#3b82f6" />
        <MetricCard label="Pending Review" value={pending.length} sub="awaiting admin approval" color="#d97706" />
        <MetricCard label="In Progress" value={active.length} sub="help is on the way" color="#22c55e" />
        <MetricCard label="Resolved" value={resolved.length} sub="successfully helped" color="#a3e635" />
      </div>

      {/* Submit Form */}
      {showForm && (
        <div className="card animate-fade-in" style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>Submit a Relief Request</h2>
            <button className="btn btn-sm" onClick={() => setShowForm(false)}>✕ Cancel</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "rgba(251,191,36,0.08)", borderRadius: 12, marginBottom: 28, border: "1px solid rgba(251,191,36,0.2)" }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              <strong style={{ color: "#d97706" }}>Pending Admin Review:</strong> Your request will be reviewed before it is broadcast to responders.
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Title *</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Brief description of what you need" required />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Describe the Situation *</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Explain your situation in detail..." rows={4} required style={{ resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div className="form-group">
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Category</label>
                <select value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Urgency Level</label>
                <select value={form.urgency} onChange={(e) => set("urgency", e.target.value)}>
                  {URGENCIES.map((u) => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div className="form-group">
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>People Affected *</label>
                <input type="number" min="1" value={form.peopleAffected} onChange={(e) => set("peopleAffected", e.target.value)} placeholder="e.g. 5" required />
              </div>
              <div className="form-group">
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Location *</label>
                <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="e.g. 12 Main St, Chennai" required />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
              <button className="btn btn-primary" type="submit" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? "Submitting..." : "📨 Submit Request"}
              </button>
              <button className="btn" type="button" onClick={() => setShowForm(false)} style={{ flex: 0.3 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* My Requests List */}
      {myNeeds.length === 0 && !showForm && (
        <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🙋</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No requests yet</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>Submit your first relief request and our coordinators will review it.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>➕ Submit a Request</button>
        </div>
      )}

      {myNeeds.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {myNeeds.map((n) => {
            const meta = STATUS_META[n.status] || STATUS_META["pending"];
            const isOpen = selected === n.id;
            return (
              <div
                key={n.id}
                className="card"
                style={{ cursor: "pointer", borderLeft: `4px solid ${meta.color}` }}
                onClick={() => setSelected(isOpen ? null : n.id)}
              >
                {/* Summary row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{n.title}</span>
                      <UrgencyBadge urgency={n.urgency} />
                      <CategoryBadge category={n.category} />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                      {meta.label} · Submitted {formatDate(n.createdAt)}
                    </div>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 18, flexShrink: 0, transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "none" }}>›</div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="animate-fade-in" style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>{n.description}</p>
                    <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap", marginBottom: 16 }}>
                      <span>📍 {n.address || "Location on file"}</span>
                      <span>👥 {n.peopleAffected} people affected</span>
                      <span>🎯 Priority Score: {n.priorityScore}</span>
                    </div>

                    {/* Status timeline */}
                    <div style={{ display: "flex", gap: 0, marginBottom: 20 }}>
                      {["pending", "open", "in-progress", "completed"].map((s, i, arr) => {
                        const steps = ["pending", "open", "in-progress", "completed"];
                        const currentIdx = steps.indexOf(n.status);
                        const stepIdx = steps.indexOf(s);
                        const done = stepIdx <= currentIdx && n.status !== "rejected";
                        const labels = { pending: "Submitted", open: "Approved", "in-progress": "In Progress", completed: "Resolved" };
                        return (
                          <div key={s} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", background: done ? meta.color : "var(--bg-input)", border: `2px solid ${done ? meta.color : "var(--border)"}`, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: done ? "#fff" : "var(--text-muted)", fontWeight: 800, zIndex: 1, position: "relative" }}>
                              {done ? "✓" : i + 1}
                            </div>
                            {i < arr.length - 1 && (
                              <div style={{ position: "absolute", top: 12, left: "50%", width: "100%", height: 2, background: stepIdx < currentIdx && n.status !== "rejected" ? meta.color : "var(--border)" }} />
                            )}
                            <div style={{ fontSize: 10, color: done ? "var(--text-primary)" : "var(--text-muted)", marginTop: 6, fontWeight: done ? 700 : 400 }}>{labels[s]}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Assigned volunteer */}
                    {n.volunteerId && (
                      <div style={{ padding: "14px 16px", background: "var(--accent-green-dim)", borderRadius: 10, border: "1px solid var(--accent-green-glow)" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-green)", textTransform: "uppercase", marginBottom: 6 }}>🤝 Assigned Responder</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{n.volunteerEmail || "A volunteer"}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Is handling your request</div>
                      </div>
                    )}

                    {n.status === "rejected" && (
                      <div style={{ padding: "14px 16px", background: "var(--urgency-critical-bg)", borderRadius: 10, border: "1px solid var(--urgency-critical-border)" }}>
                        <div style={{ fontSize: 13, color: "var(--urgency-critical)", fontWeight: 600 }}>❌ This request was declined by the admin team.</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>You may submit a new request with more details.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
