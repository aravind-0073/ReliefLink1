import React, { useState } from "react";
import { createNeed } from "../utils/api";
import { toast } from "react-toastify";

const CATEGORIES = ["food", "health", "education", "disaster", "other"];
const URGENCIES = ["critical", "high", "medium", "low"];

const URGENCY_W = { critical: 4, high: 3, medium: 2, low: 1 };
const CATEGORY_W = { disaster: 1.5, health: 1.6, food: 1.2, education: 1.0, other: 1.0 };

const MAX_PEOPLE_CONTRIBUTION = 20;
const MAX_SCORE = 90;

function previewScore(form) {
  if (!form.title) return null;

  const urgencyVal = URGENCY_W[form.urgency] || 1;
  const categoryVal = CATEGORY_W[form.category] || 1.0;
  
  let peopleAffected = Number(form.peopleAffected);
  if (isNaN(peopleAffected) || peopleAffected < 1) {
    peopleAffected = 1;
  }

  let rawScore = 0;

  if (form.urgency === "critical") {
    const urgencyScore = urgencyVal * 10;
    const categoryScore = categoryVal * 3;
    const peopleScore = Math.min(Math.sqrt(peopleAffected), MAX_PEOPLE_CONTRIBUTION);
    const criticalBoost = 20;
    rawScore = urgencyScore + categoryScore + peopleScore + criticalBoost;
  } else {
    const urgencyScore = urgencyVal * 5;
    const categoryScore = categoryVal * 2;
    const peopleScore = Math.min(Math.sqrt(peopleAffected) * 2, MAX_PEOPLE_CONTRIBUTION);
    rawScore = urgencyScore + categoryScore + peopleScore;
  }

  const normalizedScore = (rawScore / MAX_SCORE) * 100;
  const finalScore = Math.min(normalizedScore, 100);

  return Math.round(finalScore * 10) / 10;
}

export default function SubmitNeed({ setPage }) {
  const [form, setForm] = useState({ title: "", description: "", category: "food", urgency: "medium", peopleAffected: "", address: "" });
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const score = previewScore(form);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.peopleAffected || !form.address) {
      toast.error("Please fill all required fields.");
      return;
    }
    try {
      setSubmitting(true);

      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}`);
      const geoData = await geoRes.json();
      
      let lat, lng;
      if (geoData && geoData.length > 0) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      } else {
        toast.error("Could not find that address. Please try adding city/state.");
        setSubmitting(false);
        return;
      }

      await createNeed({
        title: form.title,
        description: form.description,
        category: form.category,
        urgency: form.urgency,
        peopleAffected: Number(form.peopleAffected),
        location: { lat, lng },
        address: form.address,
      });
      toast.success(form.urgency === "critical" || form.urgency === "high" ? "🚨 Urgent need submitted!" : "✓ Need submitted successfully!");
      setPage("needs");
    } catch (err) {
      toast.error("Failed to submit need. Check backend connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Create Need</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Submit a new relief requirement to the community radar.</p>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Title <span style={{ color: "#ef4444" }}>*</span></label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Brief description of the need" required />
          </div>

          <div className="form-group" style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Detailed Description <span style={{ color: "#ef4444" }}>*</span></label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Detailed description of the situation..." rows={4} required style={{ resize: "vertical" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Urgency Level</label>
              <select value={form.urgency} onChange={(e) => set("urgency", e.target.value)}>
                {URGENCIES.map((u) => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28, alignItems: "end" }}>
            <div className="form-group">
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>People Affected <span style={{ color: "#ef4444" }}>*</span></label>
              <input type="number" min="1" value={form.peopleAffected} onChange={(e) => set("peopleAffected", e.target.value)} placeholder="e.g. 50" required />
            </div>
            {score !== null && (
              <div style={{ padding: "12px 20px", background: "var(--bg-input)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>AI Priority Score</div>
                <div style={{ color: form.urgency === "critical" ? "#991b1b" : form.urgency === "high" ? "#dc2626" : form.urgency === "medium" ? "#d97706" : "#16a34a", fontSize: 24, fontWeight: 800 }}>
                  {score}
                </div>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 32 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Incident Location <span style={{ color: "#ef4444" }}>*</span></label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="e.g. 123 Main St, New York, NY" required />
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Full address or landmark for responder dispatch.</div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 40, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ flex: 1, padding: "14px" }}>
              {submitting ? "Submitting..." : "Broadcast Need"}
            </button>
            <button className="btn" type="button" onClick={() => setPage("needs")} style={{ flex: 0.3 }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
