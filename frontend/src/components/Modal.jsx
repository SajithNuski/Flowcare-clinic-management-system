/**
 * Renders a centered modal overlay with a title and arbitrary child content.
 * @param {{ isOpen: boolean, onClose: Function, title: string, children: React.ReactNode }} props
 */
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-lg rounded-[24px] bg-white p-7 sm:p-8 shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-slate-100/80 transform transition-all duration-300 scale-100 z-10"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all duration-200 cursor-pointer"
          aria-label="Close modal"
        >
          <i className="ti ti-x text-lg leading-none" />
        </button>

        {/* Modal Title */}
        {title && (
          <h2 className="pr-10 text-2xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
        )}

        {/* Modal Content */}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
