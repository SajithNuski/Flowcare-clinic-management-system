export function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(timeString) {
  if (!timeString) return "—";
  if (
    timeString.toLowerCase().includes("am") ||
    timeString.toLowerCase().includes("pm") ||
    !timeString.includes(":")
  ) {
    return timeString;
  }
  const timePart = timeString.includes(" ") ? timeString.split(" ")[1] : timeString;
  const parts = timePart.split(":");
  if (parts.length < 2) return timeString;
  const [hours, minutes] = parts;
  const h = parseInt(hours);
  if (isNaN(h)) return timeString;
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export function getInitials(fullName) {
  if (!fullName) return "?";
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

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
