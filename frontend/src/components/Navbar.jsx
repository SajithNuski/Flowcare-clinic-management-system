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
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent p-0 md:p-4">
      {/* Main Floating Pill Navbar Container */}
      <div className="w-full bg-[#F0F7FF]/90 backdrop-blur-md border-b border-blue-100/80 md:max-w-6xl md:w-[92%] md:mx-auto md:rounded-full md:border md:border-blue-100/50 md:shadow-[0_12px_40px_rgba(26,115,232,0.06)] relative transition-all duration-300">
        
        {/* Content wrapper with three equal flex columns */}
        <div className="mx-auto flex h-16 md:h-18 items-center justify-between px-4 sm:px-6 md:px-8 relative">
          
          {/* Column 1: Desktop Links (Left-aligned) */}
          <div className="hidden md:flex flex-1 justify-start items-center">
            <nav className="flex items-center gap-1.5">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-full text-xs lg:text-sm font-semibold transition-all duration-300 ${
                    isActive(link.to)
                      ? "text-[#1A73E8] bg-blue-100/50 font-bold"
                      : "text-[#4B5563] hover:text-[#1A73E8] hover:bg-blue-50/50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 2: Logo and Branding (Centered on desktop, Left-aligned on mobile) */}
          <div className="flex md:flex-1 justify-start md:justify-center items-center">
            <Link to="/" className="flex items-center gap-3 group z-10">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm transition-transform duration-300 group-hover:scale-105 p-1 border border-slate-100">
                <img src={ashiniLogo} alt="ASHINI Family Clinic Center" className="h-full w-full object-contain" />
              </div>
              <div className="leading-tight">
                <span className="block text-xs lg:text-sm font-bold text-[#0F172A] tracking-tight group-hover:text-[#1A73E8] transition-colors duration-200">
                  ASHINI Family Clinic Center
                </span>
                <span className="block text-[8px] lg:text-[9px] uppercase tracking-widest font-bold text-[#64748B]">
                  FlowCare Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Column 3: Desktop Auth Controls (Right-aligned) & Mobile Menu Button */}
          <div className="flex flex-1 justify-end items-center gap-4">
            {!user ? (
              <div className="hidden md:flex items-center gap-4">
                <Link
                  to="/login"
                  className="px-3 py-2 text-xs lg:text-sm font-bold text-[#4B5563] hover:text-[#1A73E8] transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="cursor-pointer rounded-full bg-[#10B981] px-5 py-2.5 text-xs lg:text-sm font-bold text-white shadow-[0_4px_12px_rgba(16,185,129,0.2)] transition-all duration-300 hover:bg-[#059669] hover:shadow-[0_6px_18px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3 bg-white/60 backdrop-blur-sm border border-blue-100 rounded-full p-1.5 pr-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8F0FE] text-[#1A73E8] border border-[#1A73E8]/10 font-bold text-[10px]">
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
                  className="cursor-pointer flex items-center justify-center p-1 text-[#6B7280] hover:text-[#DC2626] transition-colors duration-200"
                  title="Logout"
                >
                  <i className="ti ti-logout text-sm" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              aria-label="Toggle navigation menu"
              onClick={() => setMenuOpen((s) => !s)}
              className="relative z-50 inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-[#F0F7FF] p-2 text-[#0F172A] transition-all duration-200 hover:bg-blue-50 md:hidden"
            >
              <div className="flex flex-col gap-1 justify-center items-center w-4">
                <span
                  className={`block h-0.5 w-4 bg-[#0F172A] transition duration-300 ${
                    menuOpen ? "rotate-45 translate-y-1.5" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-4 bg-[#0F172A] transition duration-300 ${
                    menuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`block h-0.5 w-4 bg-[#0F172A] transition duration-300 ${
                    menuOpen ? "-rotate-45 -translate-y-1.5" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        <div
          className={`md:hidden bg-[#F0F7FF] border-t border-blue-100/80 shadow-md transition-all duration-300 ease-in-out overflow-hidden rounded-b-2xl ${
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
                      : "text-[#4B5563] hover:bg-blue-50 hover:text-[#1A73E8]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-blue-100 pt-4">
              {!user ? (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl border border-blue-200 px-4 py-3 text-center text-sm font-bold text-[#4B5563]"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl bg-[#10B981] px-4 py-3 text-center text-sm font-bold text-white shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 bg-white/60 border border-blue-100 rounded-2xl p-2.5">
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
      </div>
    </header>
  );
}

export default Navbar;
