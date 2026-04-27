export const CATEGORY_COLORS = {
  food: "#16a34a",
  health: "#dc2626",
  education: "#2563eb",
  disaster: "#d97706",
  other: "#64748b",
};

export const URGENCY_COLORS = {
  critical: "#991b1b",
  high: "#dc2626",
  medium: "#d97706",
  low: "#16a34a",
};

export const URGENCY_MAP_COLORS = {
  critical: "#991b1b",
  high: "#dc2626",
  medium: "#eab308",
  low: "#16a34a",
};

export const STATUS_COLORS = {
  pending: { bg: "#f1f5f9", color: "#475569" },
  open: { bg: "#dbeafe", color: "#1e40af" },
  "in-progress": { bg: "#fef9c3", color: "#854d0e" },
  completed: { bg: "#dcfce7", color: "#166534" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
};

export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function getInitials(name) {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

export const AVATAR_COLORS = [
  { bg: "#dcfce7", color: "#166534" },
  { bg: "#dbeafe", color: "#1e40af" },
  { bg: "#ede9fe", color: "#7c3aed" },
  { bg: "#ffedd5", color: "#9a3412" },
  { bg: "#cffafe", color: "#155e75" },
  { bg: "#fce7f3", color: "#9d174d" },
];

export function getAvatarStyle(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}
