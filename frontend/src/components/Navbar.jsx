import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Badge from "./Badge";
import ashiniLogo from "../assets/images/Ashini logo.png";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "How It Works", to: "/how-it-works" },
    { label: "Contact Us", to: "/contact" },
  ];

  const isActive = (path) => location.pathname === path;

  const getUserInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100/80 shadow-[0_2px_15px_rgba(15,23,42,0.02)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3.5 sm:px-8">
        
        {/* Logo and Branding */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm transition-transform duration-300 group-hover:scale-105 p-1 border border-slate-100">
            <img src={ashiniLogo} alt="ASHINI Family Clinic Center" className="h-full w-full object-contain" />
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-bold text-[#0F172A] tracking-tight group-hover:text-[#1A73E8] transition-colors duration-200">
              ASHINI Family Clinic Center
            </span>
            <span className="block text-[9px] uppercase tracking-widest font-bold text-[#64748B]">
              FlowCare Platform
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="relative px-4 py-2 text-sm font-semibold transition-all duration-200 text-[#4B5563] hover:text-[#1A73E8]"
            >
              <span className={isActive(link.to) ? "text-[#1A73E8]" : ""}>
                {link.label}
              </span>
              <span
                className={`absolute left-4 right-4 bottom-1 h-[2px] rounded-full bg-[#1A73E8] transition-transform duration-300 origin-left ${
                  isActive(link.to) ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Controls */}
        <div className="hidden items-center gap-4 md:flex">
          {!user ? (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-bold text-[#4B5563] hover:text-[#1A73E8] transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="cursor-pointer rounded-xl bg-[#1A73E8] px-5 py-2 text-sm font-bold text-white shadow-[0_4px_12px_rgba(26,115,232,0.2)] transition-all duration-300 hover:bg-[#1557B0] hover:shadow-[0_6px_18px_rgba(26,115,232,0.35)] hover:-translate-y-0.5 active:translate-y-0"
              >
                Register
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 pr-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A73E8] border border-[#1A73E8]/10 font-bold text-xs">
                {getUserInitials(user.full_name)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#374151]">
                  {user.full_name.split(" ")[0]}
                </span>
                <Badge text={user.role} color="blue" />
              </div>
              <button
                type="button"
                onClick={logout}
                className="cursor-pointer flex items-center justify-center p-1.5 text-[#6B7280] hover:text-[#DC2626] transition-colors duration-200"
                title="Logout"
              >
                <i className="ti ti-logout text-base" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((s) => !s)}
          className="relative z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 p-2 text-[#0F172A] transition-all duration-200 hover:bg-slate-50 md:hidden"
        >
          <div className="flex flex-col gap-1.5 justify-center items-center w-5">
            <span
              className={`block h-0.5 w-5 bg-[#0F172A] transition duration-300 ${
                menuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-[#0F172A] transition duration-300 ${
                menuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-[#0F172A] transition duration-300 ${
                menuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu Panel */}
      <div
        className={`md:hidden bg-white/95 border-t border-slate-100/80 shadow-md transition-all duration-300 ease-in-out overflow-hidden ${
          menuOpen ? "max-h-[380px] opacity-100 py-5" : "max-h-0 opacity-0 py-0"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8 space-y-4">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                  isActive(link.to)
                    ? "bg-[#E8F0FE] text-[#1A73E8]"
                    : "text-[#4B5563] hover:bg-slate-50 hover:text-[#1A73E8]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-slate-100 pt-4">
            {!user ? (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-[#4B5563]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl bg-[#1A73E8] px-4 py-3 text-center text-sm font-bold text-white shadow-sm"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A73E8] font-bold text-xs">
                    {getUserInitials(user.full_name)}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#374151]">
                      {user.full_name}
                    </span>
                    <span className="block mt-0.5">
                      <Badge text={user.role} color="blue" />
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#DC2626] hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
