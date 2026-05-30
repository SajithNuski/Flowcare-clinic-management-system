/**
 * Renders a centered modal overlay with a title and arbitrary child content.
 * @param {{ isOpen: boolean, onClose: Function, title: string, children: React.ReactNode }} props
 */
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      {/* Note: we cannot use position:fixed in some environments,
			so we use a full-width div with flex center as the overlay */}
      <div
        className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close modal"
        >
          <span className="text-xl leading-none">×</span>
        </button>

        <h2 className="pr-8 text-xl font-semibold text-gray-900">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
