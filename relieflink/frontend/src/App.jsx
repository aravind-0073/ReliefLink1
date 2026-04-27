import React, { useState, useEffect, useCallback, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import AdminDashboard from "./pages/AdminDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NeedsPage from "./pages/NeedsPage";
import VolunteersPage from "./pages/VolunteersPage";
import MapPage from "./pages/MapPage";
import MatchingPage from "./pages/MatchingPage";
import SubmitNeed from "./pages/SubmitNeed";
import SuggestNeed from "./pages/SuggestNeed";
import AddVolunteer from "./pages/AddVolunteer";
import TaskDetail from "./pages/TaskDetail";
import ProfilePage from "./pages/ProfilePage";
import UserDashboard from "./pages/UserDashboard";
import BulkUploadPage from "./pages/BulkUploadPage";
import LoadingSpinner from "./components/LoadingSpinner";

import { fetchNeeds, fetchVolunteers, fetchAssignments, seedDatabase } from "./utils/api";

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem("rl-last-page");
    if (saved) return saved;
    if (user?.role === "admin") return "dashboard";
    if (user?.role === "volunteer") return "vol-dashboard";
    return "user-dashboard";
  });
  
  const [theme, setTheme] = useState(() => localStorage.getItem("rl-theme") || "dark");
  const [needs, setNeeds] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "New Need Reported", message: "Medical emergency in Sector 4", time: new Date().toISOString(), read: false, type: "need" },
    { id: 2, title: "Volunteer Joined", message: "Rahul (Medical Expert) is now active", time: new Date().toISOString(), read: true, type: "vol" },
  ]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [preSelectedNeedId, setPreSelectedNeedId] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchTimeout = useRef(null);

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    searchTimeout.current = setTimeout(() => {
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      const lowerQ = q.toLowerCase();
      const filteredNeeds = needs.filter(n => 
        n.title.toLowerCase().includes(lowerQ) || 
        n.description.toLowerCase().includes(lowerQ) ||
        n.category.toLowerCase().includes(lowerQ)
      ).map(n => ({ ...n, type: "need" }));
      
      const filteredVols = volunteers.filter(v => 
        v.name.toLowerCase().includes(lowerQ) || 
        v.skills.some(s => s.toLowerCase().includes(lowerQ))
      ).map(v => ({ ...v, type: "volunteer" }));
      
      setSearchResults([...filteredNeeds, ...filteredVols]);
    }, 300);
  };

  const addNotification = (title, message, type = "info") => {
    const newNotif = {
      id: Date.now(),
      title,
      message,
      time: new Date().toISOString(),
      read: false,
      type
    };
    setNotifications(prev => [...prev, newNotif]);
  };

  const loadAll = useCallback(async (updatedNeedId, updatedStatus) => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Optimistic UI update to prevent index racing and improve UX
    if (updatedNeedId && typeof updatedNeedId === 'string' && updatedStatus) {
      setNeeds((prev) => prev.map((n) => n.id === updatedNeedId ? { ...n, status: updatedStatus } : n));
      await new Promise((r) => setTimeout(r, 800));
    }

    try {
      const [n, v, a] = await Promise.all([
        fetchNeeds(),
        fetchVolunteers(),
        fetchAssignments(),
      ]);
      setNeeds(n.data.data || []);
      setVolunteers(v.data.data || []);
      setAssignments(a.data.data || []);
    } catch (e) {
      console.error("Failed to load data", e);
      if (e.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("rl-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("rl-last-page", page);
    }
  }, [page, user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.role === "admin") setPage("dashboard");
    else if (userData.role === "volunteer") setPage("vol-dashboard");
    else setPage("user-dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rl-last-page");
    setUser(null);
    setPage("login");
    toast.info("Logged out successfully");
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedDatabase();
      toast.success("Sample data seeded successfully!");
      await loadAll();
    } catch {
      toast.error("Seeding failed.");
    } finally {
      setSeeding(false);
    }
  };

  const handleTaskClick = (id) => {
    setPreSelectedNeedId(id);
    setPage("matching");
  };

  if (loading && user) return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme={theme} />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg-primary)" }}>
        <LoadingSpinner message="ReliefLink is preparing..." />
      </div>
    </>
  );

  if (!user) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme={theme} />
        {page === "signup" ? <SignupPage setPage={setPage} /> : <LoginPage onLogin={handleLogin} setPage={setPage} />}
      </>
    );
  }

  // RBAC Guards
  const isAdmin = user.role === "admin";
  const isVolunteer = user.role === "volunteer";
  const isUser = user.role === "user";
  const adminOnlyPages = ["dashboard", "volunteers", "matching", "submit-need", "add-volunteer"];
  const volunteerOnlyPages = ["vol-dashboard", "suggest-need"];
  const userOnlyPages = ["user-dashboard"];

  if (isAdmin && (volunteerOnlyPages.includes(page) || userOnlyPages.includes(page))) setPage("dashboard");
  if (isVolunteer && (adminOnlyPages.includes(page) || userOnlyPages.includes(page))) setPage("vol-dashboard");
  if (isUser && (adminOnlyPages.includes(page) || volunteerOnlyPages.includes(page))) setPage("user-dashboard");

  const urgentCount = needs.filter((n) => n.urgency === "high" && n.status !== "completed").length;
  const availableCount = volunteers.filter((v) => v.availability).length;

  return (
    <div className="app">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme={theme} />
      
      <Sidebar 
        user={user} 
        page={page} 
        setPage={setPage}
        urgentCount={urgentCount} 
        availableCount={availableCount} 
      />

      <div className="main">
        <Topbar 
          user={user} 
          page={page} 
          setPage={setPage} 
          urgentCount={notifications.filter(n => !n.read).length}
          notifications={notifications}
          setNotifications={setNotifications}
          onSeed={handleSeed}
          seeding={seeding}
          theme={theme}
          setTheme={setTheme}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          searchResults={searchResults}
          setSearchQuery={setSearchQuery}
        />

        <div className="content">
          {page === "dashboard" && <AdminDashboard needs={needs} volunteers={volunteers} assignments={assignments} setPage={setPage} addNotification={addNotification} />}
          {page === "vol-dashboard" && <VolunteerDashboard user={user} needs={needs} assignments={assignments} setPage={setPage} onNeedUpdate={loadAll} />}
          {page === "user-dashboard" && <UserDashboard user={user} />}
          {page === "bulk-upload" && <BulkUploadPage user={user} />}
          {page === "needs" && <NeedsPage user={user} onNeedUpdate={loadAll} setPage={setPage} />}
          {page === "volunteers" && <VolunteersPage assignments={assignments} setPage={setPage} />}
          {page === "map" && <MapPage needs={needs} volunteers={volunteers} user={user} onMatchClick={handleTaskClick} />}
          {page === "matching" && <MatchingPage needs={needs} onAssign={loadAll} initialNeedId={preSelectedNeedId} setPage={setPage} />}
          {page === "submit-need" && <SubmitNeed setPage={setPage} />}
          {page === "suggest-need" && <SuggestNeed setPage={setPage} />}
          {page === "add-volunteer" && <AddVolunteer setPage={setPage} />}
          {page === "task-detail" && <TaskDetail user={user} taskId={preSelectedNeedId} setPage={setPage} />}
          {page === "profile" && <ProfilePage user={user} setPage={setPage} />}
        </div>
      </div>
    </div>
  );
}
