/**
 * Converts "2026-05-30" to "30 May 2026"
 * @param {string} dateString - date in YYYY-MM-DD format
 * @returns {string} formatted date
 */
export function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Converts "09:30" to "9:30 AM"
 * @param {string} timeString - time in HH:MM format
 * @returns {string} formatted time
 */
export function formatTime(timeString) {
  if (!timeString) return "—";
  // If it's a full timestamp "YYYY-MM-DD HH:MM:SS", get the time portion
  const timePart = timeString.includes(" ") ? timeString.split(" ")[1] : timeString;
  const [hours, minutes] = timePart.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Converts "Kasun Silva" to "KS" — used for avatar initials
 * @param {string} fullName
 * @returns {string} initials (max 2 characters)
 */
export function getInitials(fullName) {
  if (!fullName) return "?";
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/**
 * Calculates age from date of birth string
 * @param {string} dobString - date of birth in YYYY-MM-DD format
 * @returns {number} age in years
 */
export function calculateAge(dobString) {
  if (!dobString) return 0;
  const today = new Date();
  const dob = new Date(dobString);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Returns the correct Tailwind badge class for a queue/appointment status
 * @param {string} status
 * @returns {string} Tailwind class string
 */
export function getStatusBadgeClass(status) {
  const map = {
    confirmed: "badge-success",
    completed: "badge-neutral",
    waiting: "badge-primary",
    in_consultation: "badge-primary",
    cancelled: "badge-danger",
    no_show: "badge-danger",
    rescheduled: "badge-neutral",
  };
  return map[status] || "badge-neutral";
}
