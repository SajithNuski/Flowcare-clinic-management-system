import React from "react";

/**
 * Reusable animated loading spinner for FlowCare.
 * @param {{ message?: string, size?: 'sm'|'md'|'lg', fullScreen?: boolean }} props
 */
export default function LoadingSpinner({
  message = "Loading...",
  size = "md",
  fullScreen = false,
}) {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-blue-200 border-t-blue-600 animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{spinner}</div>;
}
