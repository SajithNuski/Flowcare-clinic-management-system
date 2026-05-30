/**
 * Renders a small pill badge for short status or category labels.
 * @param {{ text: string, color?: 'green' | 'blue' | 'amber' | 'red' | 'gray' }} props
 */
function Badge({ text, color = "gray" }) {
  const colorMap = {
    green: "bg-green-100 text-green-800 border border-green-300",
    blue: "bg-blue-100 text-blue-800 border border-blue-300",
    amber: "bg-amber-100 text-amber-800 border border-amber-300",
    red: "bg-red-100 text-red-800 border border-red-300",
    gray: "bg-gray-100 text-gray-600 border border-gray-300",
  };

  const colorClass = colorMap[color] || colorMap.gray;

  return (
    <span className={colorClass + " text-xs px-2 py-0.5 rounded-full"}>
      {text}
    </span>
  );
}

export default Badge;
