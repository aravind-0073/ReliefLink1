import React, { useState } from "react";
import { fetchVolunteers } from "../utils/api";
import { toast } from "react-toastify";

const NAV_ITEMS = [
  { id: "dashboard",     label: "Dashboard",       icon: "📊", roles: ["admin"] },
  { id: "vol-dashboard", label: "My Overview",     icon: "🏠", roles: ["volunteer"] },
  { id: "user-dashboard",label: "My Requests",     icon: "📋", roles: ["user"] },
  { id: "needs",         label: "Community Needs", icon: "📝", roles: ["admin", "volunteer"] },
  { id: "volunteers",    label: "Volunteers",      icon: "👥", roles: ["admin"] },
  { id: "map",           label: "Live Map",        icon: "📍", roles: ["admin", "volunteer"] },
  { id: "matching",      label: "Smart Match",     icon: "⚡", roles: ["admin"] },
  { id: "submit-need",   label: "Create Need",     icon: "➕", roles: ["admin"] },
  { id: "add-volunteer", label: "Add Volunteer",   icon: "👤+",roles: ["admin"] },
  { id: "suggest-need",  label: "Suggest Need",    icon: "💡", roles: ["volunteer"] },
  { id: "bulk-upload",   label: "Bulk Upload",     icon: "📦", roles: ["admin", "volunteer", "user"] },
];

export default function Sidebar({ user, page, setPage }) {
  const [showModal, setShowModal] = useState(false);
  const [volunteers, setVolunteers] = useState([]);
  const [loadingVols, setLoadingVols] = useState(false);
  const isUser = user?.role === "user";

  const handleGetHelp = async () => {
    setShowModal(true);
    try {
      setLoadingVols(true);
      const res = await fetchVolunteers(); // all volunteers — show available/busy badge on card
      setVolunteers(res.data.data || []);
    } catch {
      toast.error("Could not load volunteers. Please try again.");
    } finally {
      setLoadingVols(false);
    }
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-box">🌿</div>
          <span className="logo-text">ReliefLink</span>
        </div>

        <div className="nav-section">
          <div className="nav-label">Main Navigation</div>
          {NAV_ITEMS.filter(item => item.roles.includes(user?.role)).map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="nav-label">System</div>
          <button
            className={`nav-item ${page === "profile" ? "active" : ""}`}
            onClick={() => setPage("profile")}
          >
            <span className="nav-icon">👤</span>
            Profile
          </button>
        </div>

        {/* Quick Action — only for normal users */}
        {isUser && (
          <div style={{ padding: "0 16px 20px" }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(59, 130, 246, 0.15))",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--accent-green)", marginBottom: "4px", textTransform: "uppercase" }}>⚡ Quick Action</div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>Need immediate help or resource info?</p>
              <button
                className="btn btn-primary btn-sm"
                style={{ width: "100%", fontSize: "11px", fontWeight: "700" }}
                onClick={handleGetHelp}
              >
                Get Help Now
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Volunteer Contact Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              width: "100%",
              maxWidth: 520,
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
              animation: "fadeInUp 0.25s ease both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>🆘 Available Responders</h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {loadingVols
                    ? "Finding volunteers..."
                    : `${volunteers.length} responders · ${volunteers.filter(v => v.availability).length} available now`}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
              >✕</button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "var(--border)", margin: "20px 24px 0" }} />

            {/* Volunteer List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              {loadingVols && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 14 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                  Looking for available volunteers...
                </div>
              )}

              {!loadingVols && volunteers.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>😔</div>
                  <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 8 }}>No volunteers available right now.</p>
                  <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Please submit a request and our team will reach out.</p>
                </div>
              )}

              {!loadingVols && volunteers.map((vol) => (
                <div
                  key={vol.id}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    padding: "16px",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: "var(--accent-green-dim)",
                      border: "2px solid var(--accent-green-glow)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, fontWeight: 800, color: "var(--accent-green)",
                      flexShrink: 0,
                    }}>
                      {vol.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{vol.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: vol.availability ? "var(--accent-green)" : "#f59e0b", display: "inline-block" }} />
                        <span style={{ fontSize: 11, color: vol.availability ? "var(--accent-green)" : "#f59e0b", fontWeight: 700 }}>
                          {vol.availability ? "Available" : "Currently Busy"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  {vol.skills?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                      {vol.skills.slice(0, 4).map((s) => (
                        <span key={s} style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                          background: "var(--accent-blue-dim)", color: "var(--accent-blue)",
                          border: "1px solid rgba(59,130,246,0.25)", textTransform: "capitalize",
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Contact Info */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {vol.email && (
                      <a
                        href={`mailto:${vol.email}`}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                          background: "var(--accent-green-dim)", color: "var(--accent-green)",
                          border: "1px solid var(--accent-green-glow)", textDecoration: "none",
                          transition: "all 0.2s",
                        }}
                      >
                        ✉️ Email
                      </a>
                    )}
                    {vol.phone ? (
                      <a
                        href={`tel:${vol.phone}`}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                          background: "var(--accent-blue-dim)", color: "var(--accent-blue)",
                          border: "1px solid rgba(59,130,246,0.3)", textDecoration: "none",
                          transition: "all 0.2s",
                        }}
                      >
                        📞 {vol.phone}
                      </a>
                    ) : (
                      <div style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "8px 12px", borderRadius: 10, fontSize: 12,
                        color: "var(--text-muted)", background: "var(--bg-input)", border: "1px solid var(--border)",
                      }}>
                        No phone on file
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ height: 1, background: "var(--border)", marginBottom: 16 }} />
              <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
                💡 You can also submit a formal request via <strong style={{ color: "var(--text-secondary)" }}>My Requests</strong> for tracked assistance.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
