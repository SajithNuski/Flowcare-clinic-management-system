import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DoctorCard from "../components/DoctorCard";
import { getInitials, formatTime } from "../utils/helpers";
import { COLORS } from "../utils/constants";
import heroImage from "../assets/images/hero-clinic.jpg";
import { getDoctors } from "../api/doctors";
import bookImg from "../assets/images/book.png";
import walkingImg from "../assets/images/walking.png";
import consultImg from "../assets/images/cunsult.png";
import doctorOneImg from "../assets/images/doctor1.png";
import doctorTwoImg from "../assets/images/doctor2.png";
import doctorThreeImg from "../assets/images/doctor3.png";

const featureItems = [
  {
    icon: "ti-device-mobile",
    accent: "rgba(26,115,232,0.10)",
    color: COLORS.PRIMARY,
    title: "Book From Your Phone",
    text: "Register once and book from mobile browser, no calls needed",
  },
  {
    icon: "ti-list-numbers",
    accent: "rgba(46,204,113,0.10)",
    color: COLORS.SUCCESS,
    title: "Live Queue Tracking",
    text: "Watch your queue position update in real time from anywhere",
  },
  {
    icon: "ti-notes",
    accent: "rgba(26,115,232,0.08)",
    color: COLORS.PRIMARY,
    title: "Digital Consultation Records",
    text: "Every diagnosis and doctor note saved and accessible forever",
  },
  {
    icon: "ti-user-check",
    accent: "rgba(229,57,53,0.10)",
    color: COLORS.DANGER,
    title: "Walk-ins Always Welcome",
    text: "No appointment needed — just arrive and we add you to queue",
  },
  {
    icon: "ti-heart-rate-monitor",
    accent: "rgba(26,115,232,0.08)",
    color: COLORS.PRIMARY,
    title: "Experienced Specialists",
    text: "Qualified MBBS doctors with years of Uva Province experience",
  },
  {
    icon: "ti-clock",
    accent: "rgba(46,204,113,0.10)",
    color: COLORS.SUCCESS,
    title: "Minimal Waiting Time",
    text: "Smart queue system keeps average wait under 25 minutes",
  },
];

const serviceItems = [
  "General outpatient consultations",
  "Paediatric care (children under 16)",
  "Chronic disease management",
  "Minor wound treatment",
  "Health checkups and referrals",
  "Prescription and medication advice",
];

const stepItems = [
  {
    number: "1",
    title: "Register",
    text: "Create your free patient account in under 2 minutes",
    image: bookImg,
    alt: "Register",
  },
  {
    number: "2",
    title: "Book or Walk In",
    text: "Choose your doctor and time slot online, or just arrive",
    image: walkingImg,
    alt: "Book or Walk In",
  },
  {
    number: "3",
    title: "Track & Consult",
    text: "Track your queue live and see the doctor when called",
    image: consultImg,
    alt: "Track and Consult",
  },
];

const doctorShowcaseItems = [
  {
    specialty: "Cardiology",
    badgeClass: "bg-[#1A73E8]",
    image: doctorOneImg,
    name: "Dr. Prasanna Perera",
    title: "Senior Cardiologist",
    credentials: "MD, FRCP Cardiology (Oxford)",
    experience: "15+ Years Experience",
  },
  {
    specialty: "Pediatrics",
    badgeClass: "bg-[#16A34A]",
    image: doctorTwoImg,
    name: "Dr. Sarah Wijesinghe",
    title: "Pediatric Specialist",
    credentials: "MBBS, DCH, MD (Colombo)",
    experience: "12+ Years Experience",
  },
  {
    specialty: "Surgery",
    badgeClass: "bg-[#DC2626]",
    image: doctorThreeImg,
    name: "Dr. Aruna Perera",
    title: "General Surgeon",
    credentials: "MS, FRCS (Edinburgh)",
    experience: "20+ Years Experience",
  },
];

function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDoctors() {
      setDoctorsLoading(true);
      setDoctorsError("");

      try {
        const data = await getDoctors();

        if (!data.success && data.success !== undefined) {
          if (active) {
            setDoctorsError("Unable to load. Please refresh.");
            setDoctors([]);
          }
          return;
        }

        if (active) {
          setDoctors(Array.isArray(data) ? data : data.doctors || []);
        }
      } catch (error) {
        if (active) {
          setDoctorsError("Unable to load. Please refresh.");
          setDoctors([]);
        }
      } finally {
        if (active) {
          setDoctorsLoading(false);
        }
      }
    }

    loadDoctors();

    return () => {
      active = false;
    };
  }, []);

  const leadDoctorInitials = getInitials(doctors[0]?.full_name || "BM");
  const doctorTitle = doctors[0]?.full_name || "Our physicians";

  function handleBookAppointment() {
    navigate(user ? "/patient/book" : "/register");
  }

  function handleHowItWorks() {
    navigate("/how-it-works");
  }

  function scrollToOverview() {
    navigate("/queue");
  }

  const quickAccessCards = [
    {
      label: "Our Doctors",
      icon: "ti-stethoscope",
      action: () => navigate("/about"),
    },
    {
      label: "Location",
      icon: "ti-map-pin",
      action: () => navigate("/contact"),
    },
    {
      label: "Appointments",
      icon: "ti-calendar-plus",
      action: handleBookAppointment,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1F2937]">
      <Navbar />

      <main className="flex-1">
        <section
          className="relative min-h-[100svh] overflow-hidden"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-8">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center text-white">
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
                Quality Healthcare, Now Easier to Access
              </h1>
              <p className="mb-8 max-w-[540px] text-lg font-normal text-white/90 sm:text-xl">
                Book appointments online, track your queue from your phone, and
                view your consultation history — all in one place.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  aria-label="Book an appointment"
                  onClick={handleBookAppointment}
                  className="cursor-pointer rounded-lg bg-[#1A73E8] px-6 py-3 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:opacity-90"
                >
                  Book an Appointment
                </button>
                <button
                  type="button"
                  aria-label="Learn how it works"
                  onClick={handleHowItWorks}
                  className="cursor-pointer rounded-lg border border-white bg-white px-6 py-3 text-sm font-medium text-[#1A73E8] shadow-lg transition-all duration-200 hover:bg-[#F9FAFB]"
                >
                  How It Works
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#E5E7EB] bg-[#FFFFFF] py-10">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 sm:px-8 lg:grid-cols-3 justify-items-center">
            {quickAccessCards.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                aria-label={item.label}
                className="group flex flex-col items-center justify-center w-80 cursor-pointer rounded-xl border border-[#E5E7EB] bg-white p-6 text-center transition-all duration-200 hover:border-[rgba(26,115,232,0.15)] hover:shadow-md"
              >
                <i className={`ti ${item.icon} mb-3 text-3xl text-[#1A73E8]`} />
                <div className="text-sm font-medium text-[#4B5563]">
                  {item.label}
                </div>
                <div className="mt-1 text-xs text-[#9CA3AF] transition-all duration-200 group-hover:text-[#1A73E8]">
                  →
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-[#FFFFFF] px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-7xl rounded-[28px] bg-[#F7F8FC] px-4 py-12 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:px-6 lg:px-8 lg:py-14">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F0FE] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1A73E8]">
                <i className="ti ti-shield-check text-[12px]" />
                Trusted Healthcare
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl lg:text-5xl">
                Meet Our Qualified Doctors
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#4B5563] sm:text-base">
                At Badulla Medical Centre, our specialists bring decades of
                clinical precision and compassionate care. From complex surgical
                interventions to routine family wellness, we are committed to
                your health journey.
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-7xl gap-6 md:grid-cols-3">
              {doctorShowcaseItems.map((doctor) => (
                <article
                  key={doctor.name}
                  className="overflow-hidden rounded-xl border border-[#D9E2EF] bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative">
                    <img
                      src={doctor.image}
                      alt={doctor.name}
                      className="h-72 w-full object-cover object-top sm:h-80"
                    />
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow ${doctor.badgeClass}`}
                    >
                      {doctor.specialty}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-medium text-[#0F172A] sm:text-[17px]">
                      {doctor.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-[#1A73E8]">
                      {doctor.title}
                    </p>

                    <div className="mt-4 space-y-3 text-sm text-[#4B5563]">
                      <div className="flex items-start gap-2">
                        <i className="ti ti-stethoscope mt-0.5 text-[#9CA3AF]" />
                        <span>{doctor.credentials}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <i className="ti ti-clock-cog mt-0.5 text-[#9CA3AF]" />
                        <span>{doctor.experience}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F9FAFB] px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1A73E8]">
              Why Choose Us
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1F2937]">
              What Makes Us Different
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-[#4B5563]">
              We combine experienced medical care with a modern digital system
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featureItems.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-[#E5E7EB] bg-white p-5 transition-all duration-200 hover:border-[rgba(26,115,232,0.15)] hover:shadow-md"
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                  style={{ backgroundColor: item.accent, color: item.color }}
                >
                  <i className={`ti ${item.icon}`} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[#1F2937]">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#FFFFFF] px-4 py-16 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1A73E8]">
                Our Services
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#1F2937]">
                Comprehensive Outpatient Care
              </h2>
              <p className="mt-3 max-w-xl text-sm text-[#4B5563]">
                Our clinic provides reliable primary care, family support, and
                referral pathways for the Badulla community.
              </p>

              <div className="mt-6 space-y-0">
                {serviceItems.map((service) => (
                  <div
                    key={service}
                    className="flex items-center gap-2 border-b border-[#F9FAFB] py-2 text-sm text-[#4B5563]"
                  >
                    <i className="ti ti-circle-check text-[#2ECC71]" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/about"
                className="mt-5 inline-flex items-center text-sm font-medium text-[#1A73E8] transition-all duration-200 hover:underline"
              >
                About Our Clinic →
              </Link>
            </div>

            <div className="rounded-2xl bg-[#1A73E8] p-8 text-white shadow-lg">
              <h3 className="text-xl font-bold tracking-tight text-white">
                Trusted by the Badulla Community
              </h3>
              <div className="mt-6 space-y-4">
                {[
                  ["15+", "Years serving Badulla"],
                  ["3", "Specialist Doctors"],
                  ["50+", "Patients per day"],
                ].map(([value, label]) => (
                  <div key={label} className="border-b border-white/20 pb-4">
                    <div className="text-4xl font-bold text-white">{value}</div>
                    <div className="mt-1 text-sm text-white/80">{label}</div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                aria-label="Register as a patient"
                onClick={() => navigate("/register")}
                className="mt-4 w-full rounded-lg bg-white px-5 py-2.5 text-center text-sm font-medium text-[#1A73E8] transition-all duration-200 hover:bg-[#F9FAFB]"
              >
                Register as a Patient
              </button>
            </div>
          </div>
        </section>

        <section className="bg-[#F9FAFB] px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1A73E8]">
              Simple Process
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1F2937]">
              How It Works
            </h2>
          </div>

          <div className="mx-auto mt-10 grid max-w-7xl gap-6 md:grid-cols-3">
            {stepItems.map((step) => (
              <article
                key={step.title}
                className="bg-white rounded-xl shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <div className="overflow-hidden">
                  <img
                    src={step.image}
                    alt={step.alt}
                    className="h-44 w-full object-cover md:h-56"
                  />
                </div>

                <div className="p-5">
                  <div className="text-xs font-medium text-[#9CA3AF]">
                    Step {step.number}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-[#1A237E]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#4B5563]">
                    {step.text}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              type="button"
              aria-label="Get started free"
              onClick={handleBookAppointment}
              className="cursor-pointer rounded-lg bg-[#1A73E8] px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
            >
              Get Started Free →
            </button>
          </div>
        </section>

        <section className="border-t border-b border-[#E5E7EB] bg-[#FFFFFF] px-4 py-12 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A73E8]">
                <i className="ti ti-clock" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1F2937]">
                  Opening Hours
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">
                  Mon – Fri: {formatTime("08:00")} – {formatTime("17:00")}
                  <br />
                  Sat: {formatTime("08:00")} – {formatTime("13:00")}
                  <br />
                  Sun &amp; Public Holidays: Closed
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A73E8]">
                <i className="ti ti-phone" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1F2937]">
                  Contact Us
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">
                  Tel: 055 222 4567
                  <br />
                  Mobile: 077 123 4567
                  <br />
                  Email: badullamedical@gmail.com
                  <br />
                  WhatsApp: 077 123 4567
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A73E8]">
                <i className="ti ti-map-pin" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1F2937]">
                  Find Us
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">
                  No. 14, Bandarawela Road
                  <br />
                  Badulla, Uva Province
                  <br />
                  Sri Lanka — 90000
                  <br />
                  Near Badulla Bus Stand
                </p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}

export default LandingPage;
