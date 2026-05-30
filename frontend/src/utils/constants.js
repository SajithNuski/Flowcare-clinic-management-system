// API base path — the Vite proxy rewrites /api to our XAMPP backend
export const API_BASE = "/api";

// User roles — use these constants instead of typing strings everywhere
// This way if we rename a role we only change it in one place
export const ROLES = {
  PATIENT: "patient",
  DOCTOR: "doctor",
  RECEPTIONIST: "receptionist",
  ADMIN: "admin",
};

// How often the queue auto-refreshes (in milliseconds)
// 10000 = 10 seconds
export const QUEUE_REFRESH_INTERVAL = 10000;

// FlowCare brand colors — matches tailwind.config.js
// Use these in recharts or anywhere Tailwind classes cannot be used
export const COLORS = {
  PRIMARY: "#1A73E8",
  SUCCESS: "#2ECC71",
  DANGER: "#E53935",
  BACKGROUND: "#FFFFFF",
  TEXT_DARK: "#1F2937",
  TEXT_MEDIUM: "#4B5563",
  LIGHT_GRAY_BG: "#F9FAFB",
  BORDER: "#E5E7EB",
  WHITE: "#FFFFFF",
  NEUTRAL_500: "#6B7280",
  PRIMARY_LIGHT: "#E8F0FE",
  SUCCESS_LIGHT: "#EAFAF1",
  DANGER_LIGHT: "#FDEDEC",
};

// Visit reason options used in booking form and dropdowns
export const VISIT_REASONS = [
  "General consultation",
  "Follow-up visit",
  "Lab results review",
  "Child health check",
  "Chronic disease management",
  "Other",
];
