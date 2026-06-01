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
  },
  {
    number: 2,
    title: "Visit the Clinic",
    text: "On arrival, present your identification at our main reception desk. Our patient coordinator will assist you with quick check-in processes and direct you to the comfortable waiting lounge.",
  },
  {
    number: 3,
    title: "Consult with Specialists",
    text: "Meet with our board-certified specialists for a comprehensive evaluation. This phase includes a detailed assessment, diagnostic testing if necessary, and a clear explanation of your medical condition and plan.",
  },
  {
    number: 4,
    title: "Treatment & Follow-up",
    text: "Receive your personalised treatment plan and digital prescriptions. Our team will help you schedule any necessary follow-ups to monitor progress and ensure full recovery.",
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
    <div className="flex min-h-screen flex-col bg-[#FAFAFC] text-[#0F172A]">
      <Navbar />

      <main className="flex-1">
        <section
          className="relative overflow-hidden px-4 py-24 sm:px-8 md:py-28"
          style={{
            backgroundImage: `url(${clinicHero})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-[#000000]/70" />
          <div className="relative mx-auto max-w-4xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[#ffffff] sm:text-4xl">
              Your Path to Better Health
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#ffffff] sm:text-base">
              FlowCare Medical Centre simplifies your healthcare journey. From
              the first click to your first follow-up, we ensure a seamless and
              professional experience focused entirely on your recovery.
            </p>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold text-[#1565D8]">
              Our 4-Step Care Process
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[#4B5563]">
              Guided medical support at every stage of your journey.
            </p>

            <div className="mt-8 space-y-8">
              {steps.map((s, idx) => (
                <div key={s.number} className="relative flex items-start gap-6">
                  {/* timeline bullet */}
                  <div className="absolute left-0 top-2 hidden h-full w-12 md:block">
                    <div className="flex h-full flex-col items-center">
                      <div className="mb-4 h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-green-500 text-white font-semibold shadow-md">
                        {s.number}
                      </div>
                      <div className="flex-1 w-px bg-[#E6EEF3]" />
                    </div>
                  </div>

                  <div
                    data-idx={idx}
                    ref={(el) => (refs.current[idx] = el)}
                    className={`ml-0 md:ml-14 flex-1 transform rounded-lg border border-[#E6EEF3] bg-white p-6 shadow-sm transition-all duration-700 ease-out ${
                      visible[idx]
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-6"
                    } hover:shadow-md hover:-translate-y-1`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-[#0F172A]">
                        {s.title}
                      </h3>
                      <div className="text-xs text-[#9CA3AF]">
                        STEP {s.number}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-[#4B5563]">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto rounded-2xl overflow-hidden shadow-lg md:max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="bg-gradient-to-r from-[#1565D8] to-[#0B63D1] p-6 sm:p-8 text-white">
                  <h3 className="text-xl font-semibold">
                    Ready to start your journey?
                  </h3>
                  <p className="mt-2 max-w-lg text-sm text-white/90">
                    Book your first consultation today at FlowCare Medical
                    Center. Our specialists are ready to provide the clinical
                    precision you deserve.
                  </p>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => navigate("/patient/book")}
                      className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#0B63D1] hover:opacity-95"
                    >
                      Book Online Now
                    </button>
                    <button
                      onClick={() => navigate("/about")}
                      className="rounded-md border border-white/30 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
                    >
                      View Specialists
                    </button>
                  </div>
                </div>

                <div className="relative bg-white">
                  <img
                    src={bookImg}
                    alt="Clinic CTA"
                    className="h-40 w-full object-cover sm:h-56"
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
