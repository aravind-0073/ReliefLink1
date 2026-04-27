import React, { useState, useEffect } from "react";
import { getProfile, updateProfile } from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-toastify";

const SKILL_OPTIONS = [
  "medical", "first-aid", "nursing", "teaching", "education", "tutoring",
  "logistics", "food-distribution", "driving", "counseling", "communication",
  "construction", "disaster-relief", "general-help"
];

export default function ProfilePage({ user, setPage }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", skills: [], address: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProfile();
        const data = res.data.data;
        setProfile(data);
        setForm({ name: data.name || "", phone: data.phone || "", skills: data.skills || [], address: data.address || "" });
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleSkill = (skill) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { name: form.name, phone: form.phone, skills: form.skills };

      // Geocode address if it changed
      if (form.address && form.address !== profile?.address) {
        setGeocoding(true);
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}&limit=1`,
          { headers: { "Accept-Language": "en", "User-Agent": "ReliefLink/1.0" } }
        );
        const geoData = await geoRes.json();
        setGeocoding(false);
        if (geoData.length > 0) {
          payload.address = form.address;
          payload.location = { lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) };
        } else {
          toast.error("Could not find that location. Try being more specific.");
          setSaving(false); setGeocoding(false); return;
        }
      } else if (form.address) {
        payload.address = form.address;
      }

      await updateProfile(payload);
      setProfile((prev) => ({ ...prev, ...payload }));
      toast.success("Profile updated successfully!");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false); setGeocoding(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading profile..." />;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>My Profile</h2>
        <p style={{ color: "#64748b" }}>Manage your volunteer information</p>
      </div>

      {/* Profile Header */}
      <div className="card" style={{ padding: 28, marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg, #166534, #16a34a)",
          color: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 700, flexShrink: 0
        }}>
          {(profile?.name || profile?.email || "U")[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{profile?.name || "No name set"}</div>
          <div style={{ fontSize: 14, color: "#64748b" }}>{profile?.email}</div>
          <div style={{ marginTop: 6 }}>
            <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
              {profile?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Personal Information</h3>
          {!editing && (
            <button className="btn btn-sm" onClick={() => setEditing(true)}>Edit Profile</button>
          )}
        </div>

        {!editing ? (
          <div style={{ display: "grid", gap: 16 }}>
            <ReadField label="Full Name" value={profile?.name || "Not set"} />
            <ReadField label="Email" value={profile?.email} />
            <ReadField label="Phone" value={profile?.phone || "Not set"} />
            {profile?.role === "volunteer" && (
              <>
                <ReadField label="Location" value={profile?.address || "Not set"} />
                <div>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Skills</div>
                  {(!profile?.skills || profile.skills.length === 0) ? (
                    <span style={{ color: "#94a3b8", fontSize: 13 }}>No skills listed</span>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {profile.skills.map((s) => (
                        <span key={s} className="skill-tag">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="form-group" style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Full Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
            </div>
            <div className="form-group" style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Phone Number</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
            {profile?.role === "volunteer" && (
              <>
                <div className="form-group" style={{ marginBottom: 28 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Location {profile?.location && <span style={{ fontSize: 10, color: "var(--accent-green)", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>✓ Geocoded</span>}
                  </label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="e.g. 123 Main St, Chennai, Tamil Nadu"
                  />
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    📍 Your address is geocoded and used for smart volunteer matching.
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 32 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Skills (select all that apply)</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    {SKILL_OPTIONS.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`filter-chip ${form.skills.includes(skill) ? "active" : ""}`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div style={{ display: "flex", gap: 12, marginTop: 40, borderTop: "1px solid var(--border)", paddingTop: 24 }}>
              <button type="submit" className="btn btn-primary" disabled={saving || geocoding} style={{ flex: 1, padding: "14px" }}>
                {geocoding ? "📍 Finding location..." : saving ? "Saving..." : "Save Profile Changes"}
              </button>
              <button type="button" className="btn" onClick={() => setEditing(false)} style={{ flex: 0.3 }}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ReadField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, color: "#1e293b", fontWeight: 500 }}>{value}</div>
    </div>
  );
}
