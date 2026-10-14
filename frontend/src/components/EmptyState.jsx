import React from "react";

/**
 * Reusable empty state view for tables, lists, and search queries.
 * @param {{
 *   icon?: string,
 *   title?: string,
 *   description?: string,
 *   actionLabel?: string,
 *   onAction?: () => void,
 *   className?: string
 * }} props
 */
export default function EmptyState({
  icon = "ti ti-folder-off",
  title = "No data found",
  description = "There are no records to display at this moment.",
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-white/60 ${className}`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4 shadow-inner">
        <i className={`${icon} text-3xl`} />
      </div>

      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
