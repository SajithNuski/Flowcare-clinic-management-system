import { useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "How It Works", to: "/how-it-works" },
    { label: "Contact Us", to: "/contact" },
  ];

  const isActive = (path) => location.pathname === path;

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A73E8] text-sm font-semibold text-white">
            BM
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-medium text-[#1F2937]">
              Badulla Medical Centre
            </span>
            <span className="block text-xs text-[#4B5563]">
              Uva Province, Sri Lanka
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={
                  "border-b-2 px-4 py-2 text-sm transition-all duration-200 " +
                  (active
                    ? "border-[#1A73E8] font-medium text-[#1A73E8]"
                    : "border-transparent text-[#4B5563] hover:text-[#1A73E8]")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!user ? (
            <>
              <Link
                to="/login"
                className="rounded-lg border border-[#1A73E8] px-4 py-1.5 text-sm text-[#1A73E8] transition-all duration-200 hover:bg-[#F9FAFB]"
              >
                Login
              </Link>
              <Link to="/register" className="btn-primary px-4 py-1.5">
                Register
              </Link>
            </>
          ) : (
            <>
              <span className="hidden text-sm text-[#4B5563] sm:inline">
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

        <button
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#1F2937] transition-all duration-200 hover:bg-[#F9FAFB] md:hidden"
        >
          <span className="text-lg leading-none">☰</span>
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-[#E5E7EB] bg-white px-4 py-4 shadow-sm md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className={
                  "rounded-lg px-4 py-3 text-sm transition-all duration-200 " +
                  (isActive(link.to)
                    ? "bg-[#E8F0FE] font-medium text-[#1A73E8]"
                    : "text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#1A73E8]")
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-3">
            {!user ? (
              <>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="rounded-lg border border-[#1A73E8] px-4 py-2 text-center text-sm font-medium text-[#1A73E8] transition-all duration-200 hover:bg-[#F9FAFB]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="btn-primary px-4 py-2 text-center"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <div className="text-sm text-[#4B5563]">
                  Hello, {user.full_name}
                </div>
                <div>
                  <Badge text={user.role} color="blue" />
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="btn-secondary px-4 py-2"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
