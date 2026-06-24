import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import heroImage from "../assets/images/clinic image.png";

function ContactPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1F2937]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden px-4 py-20 sm:px-8 md:py-24 flex items-center justify-center"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/70" />
          <div className="relative mx-auto max-w-4xl text-center z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8F0FE] mb-6 backdrop-blur-sm border border-white/10">
              Get In Touch
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl leading-[1.2]">
              Contact Us
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-[#E2E8F0] sm:text-lg leading-relaxed">
              We&apos;re here to help and answer any questions you may have.
              <br className="hidden sm:inline" />
              Reach out to us anytime.
            </p>
          </div>
        </section>

        {/* Contact Info and Message Form Grid */}
        <section className="px-4 py-16 sm:px-8 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
            
            {/* Message Form */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A73E8] border border-[#1A73E8]/10 shadow-sm">
                  <i className="ti ti-message-dots text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0F172A]">
                    Send us a Message
                  </h2>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    Fill out the form below and we&apos;ll get back to you as
                    soon as possible.
                  </p>
                </div>
              </div>

              <form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="h-11 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 text-sm outline-none transition-all focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="h-11 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 text-sm outline-none transition-all focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10"
                  />
                </div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 text-sm outline-none transition-all focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10"
                />
                <input
                  type="text"
                  placeholder="Subject"
                  className="h-11 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 text-sm outline-none transition-all focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10"
                />
                <textarea
                  rows="5"
                  placeholder="Your Message"
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3 text-sm outline-none transition-all focus:border-[#1A73E8] focus:bg-white focus:ring-2 focus:ring-[#1A73E8]/10"
                />

                <button
                  type="button"
                  className="cursor-pointer inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#1A73E8] px-6 py-4 text-sm font-bold text-white shadow-[0_4px_14px_rgba(26,115,232,0.3)] transition-all duration-300 hover:bg-[#1557B0] hover:shadow-[0_6px_20px_rgba(26,115,232,0.5)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  <i className="ti ti-send" />
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Details & Map Card */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A73E8] border border-[#1A73E8]/10 shadow-sm">
                  <i className="ti ti-phone text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0F172A]">
                    Contact Information
                  </h2>
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-[#1A73E8] uppercase tracking-wider">
                      Address
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
                      No. 14, Bandarawela Road,
                      <br />
                      Badulla, Uva Province
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[#1A73E8] uppercase tracking-wider">
                      Phone
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
                      055 222 4567
                      <br />
                      077 123 4567
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[#1A73E8] uppercase tracking-wider">
                      Email
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
                      ashinifamilyclinic@gmail.com
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[#1A73E8] uppercase tracking-wider">
                      Working Hours
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
                      <strong>Mon - Sat:</strong> 8:00 AM - 5:00 PM
                      <br />
                      <strong>Sunday:</strong> Closed
                    </p>
                  </div>
                </div>

                {/* Map Block */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-[#F8FAFC] p-4 flex flex-col justify-center">
                  <div className="relative flex h-full min-h-[300px] items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#eef4ff_0%,#f9fbff_45%,#eef9f1_100%)]">
                    <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(#c7d5f7_1px,transparent_1px)] [background-size:18px_18px]" />
                    <div className="relative rounded-2xl border border-white/70 bg-white/90 px-6 py-5 text-center shadow-sm backdrop-blur-sm">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F0FE] text-[#1A73E8] shadow-sm">
                        <i className="ti ti-map-pin" />
                      </div>
                      <h3 className="mt-3 text-sm font-bold text-[#0F172A]">
                        ASHINI Family Clinic Center
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#4B5563]">
                        No. 14, Bandarawela Road,
                        <br />
                        Badulla, Uva Province
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Immediate Assistance Banner */}
        <section className="px-4 pb-16 sm:px-8 bg-white">
          <div className="mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 rounded-2xl bg-[#E8F0FE]/40 border border-[#1A73E8]/10 px-8 py-6 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">
                Need Immediate Assistance?
              </h3>
              <p className="mt-1 text-sm text-[#4B5563]">
                Call us directly during working hours or book an appointment
                online.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/patient/book")}
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-[#1A73E8] bg-white px-6 py-3.5 text-sm font-bold text-[#1A73E8] shadow-sm transition-all duration-300 hover:bg-[#E8F0FE]/40 hover:-translate-y-0.5"
            >
              <i className="ti ti-phone" />
              Call Now
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default ContactPage;
