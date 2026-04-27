import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://relieflink1.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (data) => API.post("/auth/login", data);
export const signup = (data) => API.post("/auth/register", data);
export const signupUser = (data) => API.post("/auth/register-user", data);

// Admin workflow
export const getPendingTasks = () => API.get("/admin/pending-tasks");
export const approveTask = (id) => API.patch(`/admin/tasks/${id}/approve`);
export const rejectTask = (id) => API.patch(`/admin/tasks/${id}/reject`);

// Needs
export const fetchNeeds = (params) => API.get("/needs", { params });
export const fetchPrioritizedNeeds = () => API.get("/needs/prioritized");
export const createNeed = (data) => API.post("/needs", data);
export const updateNeedStatus = (id, status) => API.patch(`/needs/${id}/status`, { status });
export const acceptTask = (id) => API.post(`/needs/${id}/accept`);
export const deleteNeed = (id) => API.delete(`/needs/${id}`);

// Volunteers
export const fetchVolunteers = (params) => API.get("/volunteers", { params });
export const createVolunteer = (data) => API.post("/volunteers", data);
export const updateVolunteer = (id, data) => API.patch(`/volunteers/${id}`, data);
export const deleteVolunteer = (id) => API.delete(`/volunteers/${id}`);

// Matching
export const fetchMatches = (needId) => API.get(`/match/${needId}`);

// Assignments
export const createAssignment = (data) => API.post("/assignments", data);
export const fetchAssignments = (params) => API.get("/assignments", { params });
export const updateAssignmentStatus = (id, status) => API.patch(`/assignments/${id}/status`, { status });

// Analytics
export const fetchAnalytics = () => API.get("/analytics");

// Profile
export const getProfile = () => API.get("/profile");
export const updateProfile = (data) => API.patch("/profile", data);

// Seed
export const seedDatabase = () => API.post("/seed");

// Bulk Requests
export const submitBulkRequest = (data) => API.post("/bulk-request", data);
export const getBulkRequests = () => API.get("/bulk-request");
export const approveBulkRequest = (id) => API.post(`/bulk-request/${id}/approve`);
export const rejectBulkRequest = (id) => API.post(`/bulk-request/${id}/reject`);

export default API;
