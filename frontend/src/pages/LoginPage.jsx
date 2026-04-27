import React, { useState } from "react";
import { login } from "../utils/api";
import { toast } from "react-toastify";
export default function LoginPage({ onLogin, setPage }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      const { token, user } = res.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      onLogin(user);
      
      toast.success(`Welcome back, ${user.role}!`);
      
      if (user.role === "admin") {
        setPage("dashboard");
      } else {
        setPage("vol-dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#ffffff" }}>
      {/* Left Side: Decorative Panel */}
      <div style={{ 
        flex: 1.2, 
        background: `linear-gradient(rgba(22, 101, 52, 0.85), rgba(15, 23, 42, 0.9)), url("/relief_hero_bg_1777225443990.png")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 10%",
        color: "#ffffff"
      }}>
        <div style={{ maxWidth: 500 }}>
          <h1 style={{ fontSize: 56, fontWeight: 800, marginBottom: 24, letterSpacing: "-1.5px" }}>ReliefLink</h1>
          <p style={{ fontSize: 20, lineHeight: 1.6, color: "#dcfce7", opacity: 0.9 }}>
            Empowering communities through smart resource allocation and real-time triage during critical times.
          </p>
          <div style={{ marginTop: 48, display: "flex", gap: 32 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>24/7</div>
              <div style={{ fontSize: 14, color: "#86efac", textTransform: "uppercase", letterSpacing: "1px" }}>Availability</div>
            </div>
            <div style={{ width: 1, height: 48, background: "rgba(255,255,255,0.2)" }} />
            <div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>AI-Driven</div>
              <div style={{ fontSize: 14, color: "#86efac", textTransform: "uppercase", letterSpacing: "1px" }}>Matching</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Secure Access</h2>
            <p style={{ color: "#64748b" }}>Enter your credentials to manage relief operations.</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>Email</label>
              <input 
                type="email" 
                required 
                className="auth-input"
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                placeholder="admin@relieflink.com"
                style={{ height: 48, fontSize: 16 }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 32, position: "relative" }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="auth-input"
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
                  placeholder="••••••••"
                  style={{ height: 48, fontSize: 16, width: "100%", paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 4
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: "100%", height: 52, fontSize: 16, fontWeight: 600, borderRadius: 10, background: "#166534", border: "none", boxShadow: "0 4px 12px rgba(22, 101, 52, 0.2)" }} 
              disabled={loading}
            >
              {loading ? "Verifying Identity..." : "Authorize Access"}
            </button>
          </form>
          
          <div style={{ textAlign: "center", marginTop: 32, fontSize: 15, color: "#64748b" }}>
            First time assisting? <button onClick={() => setPage("signup")} style={{ background: "none", border: "none", padding: 0, color: "#166534", fontWeight: 700, cursor: "pointer" }}>Join the Volunteer Network</button>
          </div>
        </div>
      </div>
    </div>
  );
}
