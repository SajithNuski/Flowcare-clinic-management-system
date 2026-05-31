import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import clinicHeroImage from "../assets/images/clinic image.png";

const valueItems = [
  {
    icon: "ti-stethoscope",
    title: "Clinical Excellence",
    text: "We uphold the highest medical standards through rigorous evidence-based practice and continuous staff training.",
  },
  {
    icon: "ti-users",
    title: "Community First",
    text: "Deeply rooted in Badulla, we prioritize local outreach and accessible medical programs for all residents.",
  },
  {
    icon: "ti-heart",
    title: "Patient Care",
    text: "Every patient is treated with dignity, empathy, and a commitment to their long-term health and well-being.",
  },
];

function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Navbar />

      <main className="flex-1">
        <section
          className="relative overflow-hidden px-4 py-20 sm:px-8 md:py-28"
          style={{
            backgroundImage: `url(${clinicHeroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-white/80" />
          <div className="relative mx-auto max-w-4xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[#1F2937] sm:text-4xl">
              Compassionate Healthcare for
              <br className="hidden sm:block" />
              Badulla
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#4B5563] sm:text-base">
              Our mission is to provide accessible, high-quality medical care to
              the local community, ensuring every patient receives the
              professional attention and personalized care they deserve.
            </p>
          </div>
        </section>

        <section className="bg-white px-4 py-14 sm:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F0FE] text-[#1A73E8]">
              <i className="ti ti-archive" />
            </div>
            <h2 className="mt-3 text-xl font-semibold text-[#1F2937]">
              Our Story
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-[#4B5563] sm:text-base">
              Founded in 2018, FlowCare Badulla began as a small community
              clinic with a vision to modernize healthcare delivery in the Uva
              Province. Today, we have grown into a leading medical center,
              combining advanced clinical practice with the warmth and trust of
              a local neighborhood doctor.
            </p>
          </div>
        </section>

        <section className="bg-[#F8FAFC] px-4 py-14 sm:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-xl font-semibold text-[#1F2937] sm:text-2xl">
              Our Core Values
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {valueItems.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F0FE] text-[#1A73E8]">
                    <i className={`ti ${item.icon}`} />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-[#1F2937]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-[#4B5563] sm:text-sm">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 pb-14 sm:px-8">
          <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-r from-[#1A73E8] to-[#0B63D1] px-6 py-10 text-center text-white shadow-lg sm:px-10">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Start Your Wellness Journey Today
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
              Our specialized medical team is ready to provide you with the best
              healthcare available in Badulla.
            </p>
            <button
              type="button"
              onClick={() => navigate("/patient/book")}
              className="mt-6 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-[#1A73E8] transition-colors duration-200 hover:bg-[#F9FAFB]"
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
