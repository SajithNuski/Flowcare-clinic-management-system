import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Badge from "./Badge";

/**
 * Renders the top navigation bar for public pages and shows login state actions.
 * @param {{}} props
 */
function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "How it works", to: "/how-it-works" },
    { label: "Contact", to: "/contact" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-gray-200 bg-white px-7">
      <div className="flex h-full items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 text-sm font-bold text-white">
            BM
          </div>
          <span className="text-sm font-semibold text-gray-900">
            Badulla Medical Centre
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={
                  "rounded-md px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 " +
                  (active ? "bg-blue-50 font-medium text-blue-700" : "")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link
                to="/login"
                className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Login
              </Link>
              <Link to="/register" className="btn-primary px-4 py-1.5">
                Register
              </Link>
            </>
          ) : (
            <>
              <span className="hidden text-sm text-gray-600 sm:inline">
                Hello, {user.full_name}
              </span>
              <Badge text={user.role} color="blue" />
              <button
                type="button"
                onClick={logout}
                className="btn-secondary px-4 py-1.5"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
