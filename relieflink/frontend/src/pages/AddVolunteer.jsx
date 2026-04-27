import React, { useState } from "react";
import { createVolunteer } from "../utils/api";
import { toast } from "react-toastify";

const PRESET_SKILLS = ["medical", "first-aid", "nursing", "doctor", "teaching", "education", "tutoring", "logistics", "food-distribution", "cooking", "construction", "disaster-relief", "rescue", "counseling", "training", "general-help", "driving", "communication"];

export default function AddVolunteer({ setPage }) {
  const [form, setForm] = useState({ name: "", skills: [], availability: true, address: "" });
  const [skillInput, setSkillInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleSkill = (skill) => {
    set("skills", form.skills.includes(skill) ? form.skills.filter((s) => s !== skill) : [...form.skills, skill]);
  };

  const addCustomSkill = () => {
    const s = skillInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (s && !form.skills.includes(s)) {
      set("skills", [...form.skills, s]);
      setSkillInput("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || form.skills.length === 0 || !form.address) {
      toast.error("Please enter name, skills, and an address.");
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

      await createVolunteer({
        name: form.name,
        skills: form.skills,
        availability: form.availability,
        location: { lat, lng },
        address: form.address,
      });
      toast.success(`✓ ${form.name} registered as a volunteer!`);
      setPage("volunteers");
    } catch {
      toast.error("Failed to register volunteer. Check backend connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Register New Volunteer</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Add a new responder to the system with their skills and location.</p>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ananya D Shetty" required />
          </div>

          <div className="form-group" style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Location <span style={{ color: "#ef4444" }}>*</span></label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="e.g. 123 Main St, Mumbai, Maharashtra" required />
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Used for smart-matching based on proximity.</div>
          </div>

          <div className="form-group" style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Current Availability</label>
            <select value={String(form.availability)} onChange={(e) => set("availability", e.target.value === "true")}>
              <option value="true">Active & Available</option>
              <option value="false">Currently Unavailable</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 32 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Specialized Skills <span style={{ color: "#ef4444" }}>*</span></label>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a custom skill (e.g. 'paramedic')"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary btn-sm" type="button" onClick={addCustomSkill}>Add Skill</button>
            </div>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {PRESET_SKILLS.map((s) => (
                <button 
                  key={s} 
                  type="button" 
                  className={`filter-chip ${form.skills.includes(s) ? "active" : ""}`} 
                  onClick={() => toggleSkill(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            {form.skills.length > 0 && (
              <div style={{ padding: 16, background: "var(--bg-input)", borderRadius: 12, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-green)", marginBottom: 12, textTransform: "uppercase" }}>Selected Responders Skills ({form.skills.length})</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {form.skills.map((s) => (
                    <span key={s} className="skill-tag" onClick={() => toggleSkill(s)} title="Click to remove">
                      {s} <span style={{ opacity: 0.5, fontSize: "14px", marginLeft: "2px" }}>×</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 40, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ flex: 1, padding: "14px" }}>
              {submitting ? "Registering..." : "Create Volunteer Profile"}
            </button>
            <button className="btn" type="button" onClick={() => setPage("volunteers")} style={{ flex: 0.3 }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
