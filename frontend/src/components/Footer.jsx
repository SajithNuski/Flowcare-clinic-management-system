import { Link } from "react-router-dom";
import ashiniLogo from "../assets/images/Ashini logo.png";

function Footer() {
  return (
    <footer className="bg-[#1F2937] px-4 pb-6 pt-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-0.5 shadow-sm">
                <img src={ashiniLogo} alt="AFC" className="h-full w-full object-contain" />
              </div>
              <div className="text-base font-semibold">
                ASHINI Family Clinic Center
              </div>
            </div>
            <p className="mt-3 max-w-48 text-xs text-[#9CA3AF]">
              Quality healthcare for the Uva Province community
            </p>
            <div className="mt-4 flex items-center gap-3">
              {[
                ["Facebook", "ti-brand-facebook"],
                ["WhatsApp", "ti-brand-whatsapp"],
                ["Instagram", "ti-brand-instagram"],
              ].map(([label, icon]) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#9CA3AF] transition-all duration-200 hover:text-white"
                >
                  <i className={`ti ${icon}`} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Quick Links
            </h2>
            <div className="space-y-1">
              {[
                ["Home", "/"],
                ["About", "/about"],
                ["How It Works", "/how-it-works"],
                ["Contact Us", "/contact"],
                ["Register", "/register"],
                ["Login", "/login"],
              ].map(([label, to]) => (
                <Link
                  key={label}
                  to={to}
                  className="block py-0.5 text-sm text-[#9CA3AF] transition-all duration-200 hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Our Services
            </h2>
            <div className="space-y-1">
              {[
                "General Consultations",
                "Paediatric Care",
                "Chronic Disease Management",
                "Health Checkups",
                "Referrals",
                "Walk-in Visits",
              ].map((service) => (
                <div key={service} className="py-0.5 text-sm text-[#9CA3AF]">
                  {service}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Contact
            </h2>
            <div className="space-y-3 text-sm text-[#9CA3AF]">
              <div className="flex items-start gap-3">
                <i className="ti ti-phone mt-0.5" />
                <span>055 222 4567</span>
              </div>
              <div className="flex items-start gap-3">
                <i className="ti ti-mail mt-0.5" />
                <span>ashinifamilyclinic@gmail.com</span>
              </div>
              <div className="flex items-start gap-3">
                <i className="ti ti-map-pin mt-0.5" />
                <span>No. 14, Bandarawela Rd, Badulla</span>
              </div>
              <div className="flex items-start gap-3">
                <i className="ti ti-clock mt-0.5" />
                <span>Mon-Sat 8AM-5PM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-3 text-xs text-[#9CA3AF] md:flex-row md:items-center md:justify-between">
            <span>© 2026 ASHINI Family Clinic Center. All rights reserved.</span>
            <span className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#1A73E8] px-2 py-0.5 text-white">
                Powered by FlowCare
              </span>
              <span>· Group 14 · IIT271-2 · Uva Wellassa University</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
