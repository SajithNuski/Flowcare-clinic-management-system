import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import clinicHero from "../assets/images/clinic image.png";
import bookImg from "../assets/images/book.png";

const steps = [
  {
    number: 1,
    title: "Book an Appointment",
    text: "Accessibly appear online or in-person. Use our streamlined online portal to choose your preferred specialist and time slot, or call our clinic reception to book directly.",
    badgeClass: "bg-[#E8F0FE] border-[#1A73E8]/20 text-[#1A73E8]",
    bulletClass: "bg-[#E8F0FE] border-[#1A73E8]/30 text-[#1A73E8]",
    cardHoverClass: "hover:border-[#1A73E8]/30 hover:shadow-[0_15px_30px_rgba(26,115,232,0.06)] hover:text-[#1A73E8]",
    textColor: "group-hover:text-[#1A73E8]",
  },
  {
    number: 2,
    title: "Visit the Clinic",
    text: "On arrival, present your identification at our main reception desk. Our patient coordinator will assist you with quick check-in processes and direct you to the comfortable waiting lounge.",
    badgeClass: "bg-[#EBF7ED] border-[#16A34A]/20 text-[#16A34A]",
    bulletClass: "bg-[#EBF7ED] border-[#16A34A]/30 text-[#16A34A]",
    cardHoverClass: "hover:border-[#16A34A]/30 hover:shadow-[0_15px_30px_rgba(22,163,74,0.06)] hover:text-[#16A34A]",
    textColor: "group-hover:text-[#16A34A]",
  },
  {
    number: 3,
    title: "Consult with Specialists",
    text: "Meet with our board-certified specialists for a comprehensive evaluation. This phase includes a detailed assessment, diagnostic testing if necessary, and a clear explanation of your medical condition and plan.",
    badgeClass: "bg-[#FEF2F2] border-[#EF4444]/20 text-[#EF4444]",
    bulletClass: "bg-[#FEF2F2] border-[#EF4444]/30 text-[#EF4444]",
    cardHoverClass: "hover:border-[#EF4444]/30 hover:shadow-[0_15px_30px_rgba(239,68,68,0.06)] hover:text-[#EF4444]",
    textColor: "group-hover:text-[#EF4444]",
  },
  {
    number: 4,
    title: "Treatment & Follow-up",
    text: "Receive your personalised treatment plan and digital prescriptions. Our team will help you schedule any necessary follow-ups to monitor progress and ensure full recovery.",
    badgeClass: "bg-[#EBF7ED] border-[#16A34A]/20 text-[#16A34A]",
    bulletClass: "bg-[#EBF7ED] border-[#16A34A]/30 text-[#16A34A]",
    cardHoverClass: "hover:border-[#16A34A]/30 hover:shadow-[0_15px_30px_rgba(22,163,74,0.06)] hover:text-[#16A34A]",
    textColor: "group-hover:text-[#16A34A]",
  },
];

function HowItWorks() {
  const navigate = useNavigate();
  const refs = useRef([]);
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    refs.current = refs.current.slice(0, steps.length);
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute("data-idx"));
          if (entry.isIntersecting) {
            setVisible((v) => {
              const next = [...v];
              next[idx] = true;
              return next;
            });
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    refs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1F2937]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden px-4 py-24 sm:px-8 md:py-28 flex items-center justify-center"
          style={{
            backgroundImage: `url(${clinicHero})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/70" />
          <div className="relative mx-auto max-w-4xl text-center z-10">
            <div className="bg-gradient-to-r from-[#EF4444] via-[#10B981] to-[#1A73E8] p-[1.5px] rounded-full inline-flex mb-6 shadow-lg">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0E1E38]/95 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8F0FE] backdrop-blur-sm">
                Patient Care Pathway
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl leading-[1.2]">
              Your Path to Better Health
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-[#E2E8F0] sm:text-lg leading-relaxed">
              ASHINI Family Clinic Center simplifies your healthcare journey. From
              the first click to your first follow-up, we ensure a seamless and
              professional experience focused entirely on your recovery.
            </p>
          </div>
        </section>

        {/* 4-Step Care Process Section */}
        <section className="px-4 py-20 sm:px-8 bg-white">
          <div className="mx-auto max-w-4xl text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#1A73E8]">
              Step-by-Step Guide
            </div>
            <h2 className="mt-3 text-3xl font-extrabold text-[#0F172A] sm:text-4xl">
              Our 4-Step Care Process
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-[#4B5563]">
              Guided medical support at every stage of your journey.
            </p>

            <div className="mt-16 space-y-12 relative">
              {steps.map((s, idx) => (
                <div key={s.number} className="relative flex items-start gap-6">
                  {/* Timeline Bullet (hidden on mobile, styled nicely on tablet/desktop) */}
                  <div className="absolute left-0 top-2 hidden h-full w-12 md:block">
                    <div className="flex h-full flex-col items-center">
                      <div className={`mb-4 h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full border-2 font-bold shadow-sm font-sans text-sm ${s.bulletClass}`}>
                        {s.number}
                      </div>
                      <div className="flex-1 w-[2px] bg-slate-100" />
                    </div>
                  </div>

                  <div
                    data-idx={idx}
                    ref={(el) => (refs.current[idx] = el)}
                    className={`group ml-0 md:ml-16 flex-1 transform rounded-2xl border border-slate-200/50 bg-white p-8 shadow-sm transition-all duration-700 ease-out ${
                      visible[idx]
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-6"
                    } ${s.cardHoverClass} text-left`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-bold text-[#0F172A] transition-colors duration-200 ${s.textColor}`}>
                        {s.title}
                      </h3>
                      <div className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider font-sans border ${s.badgeClass}`}>
                        Step {s.number}
                      </div>
                    </div>
                    <p className="mt-4 text-xs sm:text-sm leading-relaxed text-[#4B5563]">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner Section */}
        <section className="px-4 pb-20 sm:px-8 bg-white">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto rounded-[24px] overflow-hidden shadow-xl border border-slate-100 md:max-w-4xl bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative bg-slate-900 p-8 sm:p-10 text-white flex flex-col justify-center overflow-hidden border border-slate-800">
                  {/* Glowing red, green, and blue accents */}
                  <div className="absolute -top-12 -left-12 w-40 h-40 bg-[#EF4444]/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-[#10B981]/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#1A73E8]/10 rounded-full blur-3xl pointer-events-none" />
                  
                  {/* Grid overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.02)_1px,_transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                  <h3 className="relative z-10 text-2xl font-extrabold tracking-tight text-white">
                    Ready to start your journey?
                  </h3>
                  <p className="relative z-10 mt-4 text-sm text-white/80 leading-relaxed">
                    Book your first consultation today at ASHINI Family Clinic Center. Our specialists are ready to provide the clinical
                    precision you deserve.
                  </p>

                  <div className="relative z-10 mt-8 flex flex-wrap gap-4">
                    <button
                      onClick={() => navigate("/patient/book")}
                      className="cursor-pointer rounded-xl bg-white px-6 py-3.5 text-xs font-bold text-slate-900 shadow-md transition-all duration-300 hover:bg-[#F8FAFC] hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Book Online Now
                    </button>
                    <button
                      onClick={() => navigate("/about")}
                      className="cursor-pointer rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-xs font-bold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:-translate-y-0.5"
                    >
                      View Specialists
                    </button>
                  </div>
                </div>

                <div className="relative min-h-[220px] bg-slate-50 md:min-h-0">
                  <img
                    src={bookImg}
                    alt="Clinic CTA"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HowItWorks;
