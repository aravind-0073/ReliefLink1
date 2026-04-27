import React, { useState } from "react";
import { signup, signupUser } from "../utils/api";
import { toast } from "react-toastify";
export default function SignupPage({ setPage }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [role, setRole] = useState("volunteer");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (role === "volunteer") {
        await signup(form);
      } else {
        await signupUser(form);
      }
      toast.success("Account created successfully! Please login.");
      setPage("login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
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
            Be the change. Join our network of dedicated volunteers and help us coordinate resources where they are needed most.
          </p>
          <div style={{ marginTop: 48 }}>
            <div style={{ display: "inline-block", padding: "12px 24px", background: "rgba(255,255,255,0.1)", borderRadius: "12px", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Join over 500+ active responders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
              {role === "volunteer" ? "Volunteer Sign Up" : "Request Help"}
            </h2>
            <p style={{ color: "#64748b" }}>
              {role === "volunteer" ? "Join the network of responders." : "Create an account to submit and track relief requests."}
            </p>
          </div>

          {/* Role Toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 28, background: "#f1f5f9", borderRadius: 12, padding: 4 }}>
            {[
              { value: "volunteer", label: "🤝 I want to help", desc: "Volunteer" },
              { value: "user",      label: "🙋 I need help",    desc: "Normal User" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                style={{
                  flex: 1, padding: "10px 8px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                  background: role === opt.value ? "#ffffff" : "transparent",
                  color: role === opt.value ? "#166534" : "#64748b",
                  boxShadow: role === opt.value ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>Full Name</label>
              <input 
                type="text" 
                required 
                className="auth-input"
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="Arjun Sharma"
                style={{ height: 48, fontSize: 16 }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>Email Address</label>
              <input 
                type="email" 
                required 
                className="auth-input"
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                placeholder="volunteer@relieflink.com"
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
              {loading ? "Creating Account..." : role === "volunteer" ? "Register as Volunteer" : "Create Account"}
            </button>
          </form>
          
          <div style={{ textAlign: "center", marginTop: 32, fontSize: 15, color: "#64748b" }}>
            Already registered? <button onClick={() => setPage("login")} style={{ background: "none", border: "none", padding: 0, color: "#166534", fontWeight: 700, cursor: "pointer" }}>Log in here</button>
          </div>
        </div>
      </div>
    </div>
  );
}
