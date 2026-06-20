import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import clinicHeroImage from "../assets/images/clinic image.png";

const valueItems = [
  {
    icon: "ti-stethoscope",
    accent: "bg-[#E8F0FE] text-[#1A73E8] border border-[#1A73E8]/10",
    title: "Clinical Excellence",
    text: "We uphold the highest medical standards through rigorous evidence-based practice and continuous staff training.",
  },
  {
    icon: "ti-users",
    accent: "bg-[#EBF7ED] text-[#16A34A] border border-[#16A34A]/10",
    title: "Community First",
    text: "Deeply rooted in Badulla, we prioritize local outreach and accessible medical programs for all residents.",
  },
  {
    icon: "ti-heart",
    accent: "bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/10",
    title: "Patient Care",
    text: "Every patient is treated with dignity, empathy, and a commitment to their long-term health and well-being.",
  },
];

function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1F2937]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden px-4 py-24 sm:px-8 md:py-28 flex items-center justify-center"
          style={{
            backgroundImage: `url(${clinicHeroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/70" />
          <div className="relative mx-auto max-w-4xl text-center z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8F0FE] mb-6 backdrop-blur-sm border border-white/10">
              Our Vision
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl leading-[1.2]">
              Compassionate Healthcare for<br />Badulla
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-[#E2E8F0] sm:text-lg leading-relaxed">
              Our mission is to provide accessible, high-quality medical care to
              the local community, ensuring every patient receives the
              professional attention and personalized care they deserve.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="bg-white px-4 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A73E8] border border-[#1A73E8]/10 shadow-sm">
              <i className="ti ti-archive text-lg" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-[#0F172A]">
              Our Story
            </h2>
            <div className="relative mt-6 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-8 shadow-sm">
              <p className="mx-auto max-w-3xl text-sm sm:text-base leading-relaxed text-[#4B5563]">
                Founded in 2018, FlowCare Badulla began as a small community
                clinic with a vision to modernize healthcare delivery in the Uva
                Province. Today, we have grown into a leading medical center,
                combining advanced clinical practice with the warmth and trust of
                a local neighborhood doctor.
              </p>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="bg-[#F8FAFC] px-4 py-20 sm:px-8 border-y border-slate-100">
          <div className="mx-auto max-w-7xl text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#1A73E8]">
              Beliefs &amp; Culture
            </div>
            <h2 className="mt-3 text-3xl font-extrabold text-[#0F172A] sm:text-4xl">
              Our Core Values
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {valueItems.map((item) => (
                <article
                  key={item.title}
                  className="group rounded-2xl border border-slate-200/50 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-xl transition-transform duration-300 group-hover:scale-110 ${item.accent}`}>
                    <i className={`ti ${item.icon}`} />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-[#0F172A]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#4B5563]">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="bg-white px-4 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-r from-[#1A73E8] to-[#1557B0] px-8 py-14 text-center text-white shadow-xl sm:px-12">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Start Your Wellness Journey Today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-white/90 leading-relaxed">
              Our specialized medical team is ready to provide you with the best
              healthcare available in Badulla.
            </p>
            <button
              type="button"
              onClick={() => navigate("/patient/book")}
              className="mt-8 cursor-pointer rounded-xl bg-white px-8 py-4 text-sm font-bold text-[#1A73E8] shadow-md transition-all duration-300 hover:bg-[#F8FAFC] hover:-translate-y-0.5"
            >
              Book an Appointment
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AboutPage;
