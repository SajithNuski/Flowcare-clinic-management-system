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
    <header className="sticky top-0 z-50 w-full bg-[#F0F7FF]/95 backdrop-blur-md border-b border-blue-100/80 shadow-[0_2px_15px_rgba(26,115,232,0.02)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          
          {/* Left: Logo and Branding */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm transition-all duration-500 ease-out group-hover:scale-105 group-hover:rotate-3 p-1 border border-slate-100">
              <img src={ashiniLogo} alt="ASHINI Family Clinic Center" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight">
              <span className="block text-sm md:text-base font-bold text-slate-800 tracking-tight group-hover:text-[#1A73E8] transition-colors duration-300">
                ASHINI Family Clinic Center
              </span>
              <span className="block text-[9px] uppercase tracking-widest font-bold text-slate-400">
                FlowCare Platform
              </span>
            </div>
          </Link>

          {/* Center: Navigation Links with Smooth Animated Bottom Indicators */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`group relative px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out ${
                  isActive(link.to)
                    ? "text-[#1A73E8]"
                    : "text-slate-600 hover:text-[#1A73E8]"
                }`}
              >
                <span className="relative z-10">{link.label}</span>
                <span
                  className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-[#1A73E8] transition-transform duration-300 ease-out origin-center ${
                    isActive(link.to) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            ))}
          </nav>

          {/* Right: Auth Controls / Hamburger with hover scale transitions */}
          <div className="flex items-center gap-4">
            {!user ? (
              <div className="hidden md:flex items-center">
                {/* Segmented Sign in / Register Button */}
                <div className="flex items-center border border-[#1A73E8] rounded-full overflow-hidden bg-white shadow-sm hover:shadow transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-98">
                  <Link
                    to="/login"
                    className="px-5 py-2 text-xs lg:text-sm font-extrabold text-white bg-[#1A73E8] hover:bg-[#1557B0] transition-colors duration-300 text-center min-w-[85px] lg:min-w-[95px]"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2 text-xs lg:text-sm font-extrabold text-[#1A73E8] bg-white hover:bg-blue-50/60 transition-colors duration-300 text-center min-w-[85px] lg:min-w-[95px]"
                  >
                    Register
                  </Link>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3 bg-white/60 border border-blue-50 rounded-2xl p-1.5 pr-3 shadow-sm transition-all duration-300 hover:shadow-md">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A73E8] border border-[#1A73E8]/10 font-bold text-xs">
                  {getUserInitials(user.full_name)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    {user.full_name.split(" ")[0]}
                  </span>
                  <Badge text={user.role} color="blue" />
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="cursor-pointer flex items-center justify-center p-1.5 text-slate-400 hover:text-red-500 hover:scale-110 transition-all duration-300 ease-out"
                  title="Logout"
                >
                  <i className="ti ti-logout text-base" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              aria-label="Toggle navigation menu"
              onClick={() => setMenuOpen((s) => !s)}
              className="relative z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 transition-all duration-300 hover:bg-slate-100 md:hidden"
            >
              <div className="flex flex-col gap-1.5 justify-center items-center w-5">
                <span
                  className={`block h-0.5 w-5 bg-slate-800 transition duration-300 ${
                    menuOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-slate-800 transition duration-300 ${
                    menuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-slate-800 transition duration-300 ${
                    menuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        <div
          className={`md:hidden bg-white border-t border-slate-100 transition-all duration-300 ease-in-out overflow-hidden ${
            menuOpen ? "max-h-[380px] opacity-100 py-5" : "max-h-0 opacity-0 py-0"
          }`}
        >
          <div className="space-y-4">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                    isActive(link.to)
                      ? "bg-[#E8F0FE] text-[#1A73E8]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#1A73E8]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-slate-100 pt-4">
              {!user ? (
                <div className="flex justify-center px-2">
                  <div className="flex w-full items-center border border-[#1A73E8] rounded-full overflow-hidden bg-white shadow-sm">
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 py-2.5 text-sm font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] transition-colors text-center"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 py-2.5 text-sm font-bold text-[#1A73E8] bg-white hover:bg-blue-50/60 transition-colors text-center"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A73E8] font-bold text-xs">
                      {getUserInitials(user.full_name)}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-700">
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
