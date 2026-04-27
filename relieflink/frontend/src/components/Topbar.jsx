import React, { useState, useRef, useEffect } from "react";
import { getInitials } from "../utils/helpers";

export default function Topbar({ 
  user, 
  page, 
  setPage, 
  urgentCount, 
  onSeed, 
  seeding, 
  theme, 
  setTheme, 
  onLogout,
  searchQuery,
  onSearch,
  searchResults,
  setSearchQuery,
  notifications,
  setNotifications
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const searchInputRef = useRef(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false);
    };
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="greeting">
          {getGreeting()}, {user?.name ? user.name.split(" ")[0] : (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User")} 🌿
        </div>
        <div className="sub-greeting">Your operations dashboard for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
      </div>

      <div className="topbar-right">
        <div className="search-container" ref={searchRef}>
          <div className="topbar-search">
            <span>🔍</span>
            <input
              ref={searchInputRef}
              className="topbar-search-input"
              placeholder="Search needs, volunteers..."
              value={searchQuery}
              onChange={(e) => {
                onSearch(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
            />
          </div>

          {searchOpen && searchQuery.trim() && (
            <div className="topbar-dropdown" style={{ minWidth: "320px" }}>
              {searchResults.length > 0 ? (
                <div className="search-results">
                  {searchResults.map((result, idx) => (
                    <div 
                      key={idx} 
                      className="search-result-item"
                      onClick={() => {
                        setPage(result.type === "need" ? "needs" : "volunteers");
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="result-icon">{result.type === "need" ? "📝" : "👤"}</div>
                      <div className="result-info">
                        <div className="result-title">{result.title || result.name}</div>
                        <div className="result-sub">{result.category || result.skills?.join(", ")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="search-no-results">No results found for "{searchQuery}"</div>
              )}
            </div>
          )}
        </div>

        <div className="notif-container" ref={notifRef} style={{ position: "relative" }}>
          <button className="icon-btn" onClick={() => setNotifOpen(!notifOpen)}>
            <span>🔔</span>
            {urgentCount > 0 && <span className="badge-dot">{urgentCount}</span>}
          </button>

          {notifOpen && (
            <div className="topbar-dropdown" style={{ right: 0, width: "320px", maxHeight: "450px", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "15px" }}>Notifications</span>
                <button 
                  onClick={markAllAsRead}
                  style={{ background: "none", border: "none", color: "var(--accent-green)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  Mark all as read
                </button>
              </div>
              
              <div style={{ overflowY: "auto", flex: 1 }}>
                {notifications.length > 0 ? (
                  notifications.slice().reverse().map((n) => (
                    <div 
                      key={n.id} 
                      className={`dropdown-item ${!n.read ? "unread" : ""}`}
                      onClick={() => markAsRead(n.id)}
                      style={{ 
                        flexDirection: "column", 
                        alignItems: "flex-start", 
                        gap: "4px", 
                        padding: "12px 16px",
                        background: !n.read ? "rgba(34, 197, 94, 0.05)" : "transparent",
                        borderLeft: !n.read ? "3px solid var(--accent-green)" : "3px solid transparent"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: "13px" }}>{n.title}</span>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>{n.message}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                    No notifications yet
                  </div>
                )}
              </div>
              
              <div style={{ padding: "12px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
                <button 
                  onClick={() => { setPage("dashboard"); setNotifOpen(false); }}
                  style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}
                >
                  Activity Log
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          <span>{theme === "dark" ? "☀️" : "🌙"}</span>
        </button>

        {user?.role === "admin" && (
          <button className="btn-add" onClick={onSeed} disabled={seeding}>
            <span>{seeding ? "⚙️" : "⚡"}</span>
            {seeding ? "Seeding..." : "Seed Sample Data"}
          </button>
        )}

        <div className="profile-container" ref={profileRef} style={{ position: "relative" }}>
          <button className="icon-btn" onClick={() => setProfileOpen(!profileOpen)} style={{ padding: 4 }}>
            <div className="user-avatar" style={{ width: "100%", height: "100%", fontSize: 12 }}>
              {getInitials(user?.name || (user?.role === "admin" ? "Admin" : "Volunteer"))}
            </div>
          </button>

          {profileOpen && (
            <div className="topbar-dropdown" style={{ right: 0 }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{user?.name}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{user?.email}</div>
              </div>
              <div className="dropdown-item" onClick={() => { setPage("profile"); setProfileOpen(false); }}>
                <span>👤</span> My Profile
              </div>
              <div className="dropdown-item" onClick={() => { onLogout(); setProfileOpen(false); }} style={{ color: "var(--urgency-critical)" }}>
                <span>🚪</span> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
