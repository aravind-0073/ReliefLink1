import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const CATEGORIES = ["food", "health", "education", "disaster", "other"];
const URGENCIES = ["low", "medium", "high", "critical"];

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export default function SuggestNeed({ setPage }) {
  const [form, setForm] = useState({
    title: "", description: "", category: "food", urgency: "medium",
    peopleAffected: "", address: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Geocode address
      const geoRes = await fetch(
        `${NOMINATIM_URL}?q=${encodeURIComponent(form.address)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en", "User-Agent": "ReliefLink/1.0" } }
      );
      const geoData = await geoRes.json();
      if (!geoData.length) {
        toast.error("Could not find that location. Try being more specific.");
        setSubmitting(false);
        return;
      }
      const lat = parseFloat(geoData[0].lat);
      const lng = parseFloat(geoData[0].lon);

      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          peopleAffected: Number(form.peopleAffected),
          location: { lat, lng },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Your suggestion has been submitted for admin review! ✅");
      setPage("vol-dashboard");
    } catch (err) {
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Suggest a Community Need</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Identify a gap in local relief and let the administrators know.</p>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "rgba(251, 191, 36, 0.1)", borderRadius: 12, marginBottom: 32, border: "1px solid rgba(251, 191, 36, 0.2)" }}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            <strong style={{ color: "#d97706" }}>Awaiting Approval:</strong> Your suggestion will be reviewed by our coordination team before it is broadcast to all responders.
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Suggestion Title *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Water shortage in North Block" required />
          </div>

          <div className="form-group" style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Situation Details *</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the situation in detail..." rows={4} required style={{ resize: "vertical" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Category *</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Perceived Urgency *</label>
              <select value={form.urgency} onChange={(e) => set("urgency", e.target.value)}>
                {URGENCIES.map((u) => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Estimated People Affected *</label>
            <input type="number" min="1" value={form.peopleAffected} onChange={(e) => set("peopleAffected", e.target.value)} placeholder="e.g. 50" required />
          </div>

          <div className="form-group" style={{ marginBottom: 32 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Location *</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="e.g. Karol Bagh, New Delhi, 110005" required />
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Full address or landmark for our review team.</div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, marginTop: 40 }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", height: 52, fontSize: 16, fontWeight: 700 }}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Send Suggestion for Review"}
            </button>
            <button
              type="button"
              className="btn btn-link"
              style={{ width: "100%", marginTop: 12, fontSize: 14, color: "var(--text-muted)" }}
              onClick={() => setPage("vol-dashboard")}
            >
              Discard and Return
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
