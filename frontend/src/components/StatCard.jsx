/**
 * Renders a dashboard metric card with an icon, label, and value.
 * @param {{ label: string, value: string | number, icon: string, color: string }} props
 */
function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100">
      <div
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${color}`}
      >
        <i className={icon} />
      </div>
      <div className="mt-4 text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

export default StatCard;
