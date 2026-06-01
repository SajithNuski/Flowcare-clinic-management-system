import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Badge from "./Badge";

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

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-sm border-b border-transparent shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#2B78E4] to-[#0B63D1] text-sm font-semibold text-white shadow-md">
            BM
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-semibold text-[#0F172A]">Badulla Medical Centre</span>
            <span className="block text-xs text-[#6B7280]">Uva Province, Sri Lanka</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="relative px-3 py-2 text-sm text-[#374151] transition-colors duration-200 hover:text-[#1A73E8]"
            >
              <span className={isActive(link.to) ? "font-medium text-[#1A73E8]" : ""}>{link.label}</span>
              <span
                className={
                  "absolute left-0 -bottom-0.5 h-0.5 w-full transform origin-left bg-[#1A73E8] transition-transform duration-300 " +
                  (isActive(link.to) ? "scale-x-100" : "scale-x-0")
                }
              />
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!user ? (
            <>
              <Link to="/login" className="rounded-md border border-[#1A73E8] px-4 py-1.5 text-sm text-[#1A73E8] transition hover:bg-[#F1F8FF]">
                Login
              </Link>
              <Link to="/register" className="rounded-md bg-[#1A73E8] px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95">
                Register
              </Link>
            </>
          ) : (
            <>
              <div className="hidden items-center gap-3 sm:flex">
                <span className="text-sm text-[#4B5563]">Hello, {user.full_name}</span>
                <Badge text={user.role} color="blue" />
                <button onClick={logout} className="rounded-md border border-[#E6EEF3] px-3 py-1 text-sm text-[#374151] hover:bg-[#F9FAFB]">Logout</button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((s) => !s)}
          className="relative z-50 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-transparent bg-white/60 p-2 text-[#0F172A] transition-all duration-200 hover:bg-white md:hidden"
        >
          <span className={`block h-0.5 w-5 transform bg-[#0F172A] transition duration-300 ${menuOpen ? "-translate-y-0.5 rotate-45" : "-translate-y-1.5"}`} />
          <span className={`block h-0.5 w-5 transform bg-[#0F172A] transition duration-300 ${menuOpen ? "opacity-0" : "opacity-100"}`} />
          <span className={`block h-0.5 w-5 transform bg-[#0F172A] transition duration-300 ${menuOpen ? "translate-y-0.5 -rotate-45" : "translate-y-1.5"}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden bg-white/90 border-t border-transparent shadow-sm transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-8">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`rounded-md px-4 py-2 text-sm transition-colors duration-150 ${isActive(link.to) ? "bg-[#E8F0FE] text-[#1A73E8] font-medium" : "text-[#374151] hover:bg-[#F9FAFB] hover:text-[#1A73E8]"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-3 flex flex-col gap-3">
            {!user ? (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="rounded-md border border-[#1A73E8] px-4 py-2 text-center text-sm font-medium text-[#1A73E8]">Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="rounded-md bg-[#1A73E8] px-4 py-2 text-center text-sm font-medium text-white">Register</Link>
              </>
            ) : (
              <>
                <div className="text-sm text-[#4B5563]">Hello, {user.full_name}</div>
                <div>
                  <Badge text={user.role} color="blue" />
                </div>
                <button type="button" onClick={logout} className="rounded-md border border-[#E6EEF3] px-4 py-2 text-sm text-[#374151]">Logout</button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
