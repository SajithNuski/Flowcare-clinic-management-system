/**
 * Renders a small pill badge for short status or category labels.
 * @param {{ text: string, color?: 'green' | 'blue' | 'amber' | 'red' | 'gray' }} props
 */
function Badge({ text, color = "gray" }) {
  const colorMap = {
    green: {
      backgroundColor: "#EAFAF1",
      color: "#2ECC71",
      borderColor: "#2ECC71",
    },
    blue: {
      backgroundColor: "#E8F0FE",
      color: "#1A73E8",
      borderColor: "#1A73E8",
    },
    amber: {
      backgroundColor: "#F9FAFB",
      color: "#4B5563",
      borderColor: "#E5E7EB",
    },
    red: {
      backgroundColor: "#FDEDEC",
      color: "#E53935",
      borderColor: "#E53935",
    },
    gray: {
      backgroundColor: "#F3F4F6",
      color: "#4B5563",
      borderColor: "#E5E7EB",
    },
  };

  const colorClass = colorMap[color] || colorMap.gray;

  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide"
      style={colorClass}
    >
      {text}
    </span>
  );
}

export default Badge;
