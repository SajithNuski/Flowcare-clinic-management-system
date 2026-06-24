import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DoctorCard from "../components/DoctorCard";
import { getInitials, formatTime } from "../utils/helpers";
import { COLORS } from "../utils/constants";
import heroImage from "../assets/images/hero-clinic.png";
import { getDoctors } from "../api/doctors";
import bookImg from "../assets/images/book.png";
import walkingImg from "../assets/images/walking.png";
import consultImg from "../assets/images/cunsult.png";
import doctorOneImg from "../assets/images/doctor1.png";
import doctorTwoImg from "../assets/images/doctor2.png";
import doctorThreeImg from "../assets/images/doctor3.png";
import ashiniLogo from "../assets/images/Ashini logo.png";

const featureItems = [
  {
    icon: "ti-device-mobile",
    accent: "rgba(26,115,232,0.06)",
    color: "#1A73E8",
    title: "Book From Your Phone",
    text: "Register once and book from mobile browser, no calls needed",
    hoverBorder: "hover:border-[#1A73E8]/30 hover:shadow-[0_15px_30px_rgba(26,115,232,0.08)]",
  },
  {
    icon: "ti-list-numbers",
    accent: "rgba(16,185,129,0.06)",
    color: "#10B981",
    title: "Live Queue Tracking",
    text: "Watch your queue position update in real time from anywhere",
    hoverBorder: "hover:border-[#10B981]/30 hover:shadow-[0_15px_30px_rgba(16,185,129,0.08)]",
  },
  {
    icon: "ti-notes",
    accent: "rgba(26,115,232,0.06)",
    color: "#1A73E8",
    title: "Digital Consultation Records",
    text: "Every diagnosis and doctor note saved and accessible forever",
    hoverBorder: "hover:border-[#1A73E8]/30 hover:shadow-[0_15px_30px_rgba(26,115,232,0.08)]",
  },
  {
    icon: "ti-user-check",
    accent: "rgba(239,68,68,0.06)",
    color: "#EF4444",
    title: "Walk-ins Always Welcome",
    text: "No appointment needed — just arrive and we add you to queue",
    hoverBorder: "hover:border-[#EF4444]/30 hover:shadow-[0_15px_30px_rgba(239,68,68,0.08)]",
  },
  {
    icon: "ti-heart-rate-monitor",
    accent: "rgba(239,68,68,0.06)",
    color: "#EF4444",
    title: "Experienced Specialists",
    text: "Qualified MBBS doctors with years of Uva Province experience",
    hoverBorder: "hover:border-[#EF4444]/30 hover:shadow-[0_15px_30px_rgba(239,68,68,0.08)]",
  },
  {
    icon: "ti-clock",
    accent: "rgba(16,185,129,0.06)",
    color: "#10B981",
    title: "Minimal Waiting Time",
    text: "Smart queue system keeps average wait under 25 minutes",
    hoverBorder: "hover:border-[#10B981]/30 hover:shadow-[0_15px_30px_rgba(16,185,129,0.08)]",
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
    badgeClass: "bg-[#FEF2F2] border-[#EF4444]/20 text-[#EF4444]",
    hoverClass: "hover:border-[#EF4444]/20 hover:shadow-[0_15px_30px_rgba(239,68,68,0.06)]",
  },
  {
    number: "2",
    title: "Book or Walk In",
    text: "Choose your doctor and time slot online, or just arrive",
    image: walkingImg,
    alt: "Book or Walk In",
    badgeClass: "bg-[#EBF7ED] border-[#16A34A]/20 text-[#16A34A]",
    hoverClass: "hover:border-[#16A34A]/20 hover:shadow-[0_15px_30px_rgba(22,163,74,0.06)]",
  },
  {
    number: "3",
    title: "Track & Consult",
    text: "Track your queue live and see the doctor when called",
    image: consultImg,
    alt: "Track and Consult",
    badgeClass: "bg-[#E8F0FE] border-[#1A73E8]/20 text-[#1A73E8]",
    hoverClass: "hover:border-[#1A73E8]/20 hover:shadow-[0_15px_30px_rgba(26,115,232,0.06)]",
  },
];

const doctorShowcaseItems = [
  {
    specialty: "Cardiology",
    badgeClass: "bg-[#FEF2F2] text-[#EF4444] border border-[#EF4444]/10",
    image: doctorOneImg,
    name: "Dr. Prasanna Perera",
    title: "Senior Cardiologist",
    credentials: "MD, FRCP Cardiology (Oxford)",
    experience: "15+ Years Experience",
    hoverClass: "hover:border-[#EF4444]/30 hover:shadow-[0_20px_45px_rgba(239,68,68,0.08)]",
    titleHoverClass: "group-hover:text-[#EF4444]",
    subtitleColorClass: "text-[#EF4444]",
  },
  {
    specialty: "Pediatrics",
    badgeClass: "bg-[#EBF7ED] text-[#16A34A] border border-[#16A34A]/10",
    image: doctorTwoImg,
    name: "Dr. Sarah Wijesinghe",
    title: "Pediatric Specialist",
    credentials: "MBBS, DCH, MD (Colombo)",
    experience: "12+ Years Experience",
    hoverClass: "hover:border-[#16A34A]/30 hover:shadow-[0_20px_45px_rgba(22,163,74,0.08)]",
    titleHoverClass: "group-hover:text-[#16A34A]",
    subtitleColorClass: "text-[#16A34A]",
  },
  {
    specialty: "Surgery",
    badgeClass: "bg-[#FEF2F2] text-[#EF4444] border border-[#EF4444]/10",
    image: doctorThreeImg,
    name: "Dr. Aruna Perera",
    title: "General Surgeon",
    credentials: "MS, FRCS (Edinburgh)",
    experience: "20+ Years Experience",
    hoverClass: "hover:border-[#EF4444]/30 hover:shadow-[0_20px_45px_rgba(239,68,68,0.08)]",
    titleHoverClass: "group-hover:text-[#EF4444]",
    subtitleColorClass: "text-[#EF4444]",
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

  const quickAccessCards = [
    {
      label: "Our Doctors",
      sublabel: "Meet our specialist team",
      icon: "ti-stethoscope",
      colorClass: "bg-[#FEF2F2] text-[#EF4444] group-hover:bg-[#FEE2E2]",
      hoverBgClass: "hover:bg-[#FEF2F2]/40 hover:border-[#EF4444]/20",
      hoverTextClass: "group-hover:text-[#EF4444]",
      action: () => navigate("/about"),
    },
    {
      label: "Location",
      sublabel: "Find us in Badulla town",
      icon: "ti-map-pin",
      colorClass: "bg-[#ECFDF5] text-[#10B981] group-hover:bg-[#D1FAE5]",
      hoverBgClass: "hover:bg-[#ECFDF5]/40 hover:border-[#10B981]/20",
      hoverTextClass: "group-hover:text-[#10B981]",
      action: () => navigate("/contact"),
    },
    {
      label: "Appointments",
      sublabel: "Book your consultation",
      icon: "ti-calendar-plus",
      colorClass: "bg-[#E8F0FE] text-[#1A73E8] group-hover:bg-[#D2E3FC]",
      hoverBgClass: "hover:bg-[#E8F0FE]/40 hover:border-[#1A73E8]/20",
      hoverTextClass: "group-hover:text-[#1A73E8]",
      action: handleBookAppointment,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1F2937]">
      <Navbar />

      <main className="flex-1">
        {/* Original Hero Section - Retained background image & content with enhanced button styling */}
        <section
          className="relative min-h-[90svh] overflow-hidden flex items-center justify-center py-24"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          {/* Subtle gradient overlay for better contrast & premium feel */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/70" />

          <div className="absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-8">
            <div className="mx-auto flex max-w-4xl flex-col items-center text-center text-white">
              <div className="bg-gradient-to-r from-[#EF4444] via-[#10B981] to-[#1A73E8] p-[1.5px] rounded-2xl mb-6 shadow-[0_4px_20px_rgba(239,68,68,0.25)]">
                <div className="flex items-center gap-3 rounded-[15px] bg-[#0E1E38]/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#E8F0FE] backdrop-blur-md">
                  <img src={ashiniLogo} alt="Logo" className="h-6 w-auto object-contain bg-white rounded p-0.5" />
                  <span>ASHINI Family Clinic Center</span>
                </div>
              </div>
              <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl leading-[1.15]">
                Quality Healthcare,<br className="hidden sm:inline" /> Now Easier to Access
              </h1>
              <p className="mb-10 max-w-[620px] text-base font-normal text-[#E2E8F0] sm:text-lg lg:text-xl leading-relaxed">
                Book appointments online, track your queue from your phone, and
                view your consultation history — all in one place.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto px-4">
                <button
                  type="button"
                  aria-label="Book an appointment"
                  onClick={handleBookAppointment}
                  className="w-full sm:w-auto cursor-pointer rounded-xl bg-[#1A73E8] px-8 py-4 text-sm font-bold text-white shadow-[0_4px_14px_rgba(26,115,232,0.3)] transition-all duration-300 hover:bg-[#1557B0] hover:shadow-[0_6px_20px_rgba(26,115,232,0.5)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  Book an Appointment
                </button>
                <button
                  type="button"
                  aria-label="Learn how it works"
                  onClick={handleHowItWorks}
                  className="w-full sm:w-auto cursor-pointer rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-md shadow-sm transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:-translate-y-0.5"
                >
                  How It Works
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Floating Quick Action cards */}
        <section className="relative -mt-10 z-20 px-4 sm:px-8">
          <div className="mx-auto max-w-5xl bg-white rounded-2xl border border-slate-200/80 shadow-[0_15px_35px_rgba(15,23,42,0.06)] p-3 grid gap-3 sm:grid-cols-3">
            {quickAccessCards.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                aria-label={item.label}
                className={`group flex items-center gap-4 text-left cursor-pointer rounded-xl border border-transparent p-4 transition-all duration-300 ${item.hoverBgClass}`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${item.colorClass}`}>
                  <i className={`ti ${item.icon} text-lg`} />
                </div>
                <div>
                  <div className={`text-sm font-bold text-[#0F172A] transition-colors duration-200 ${item.hoverTextClass}`}>
                    {item.label}
                  </div>
                  <div className="mt-0.5 text-xs text-[#6B7280]">
                    {item.sublabel}
                  </div>
                </div>
                <div className="ml-auto text-[#9CA3AF] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                  <i className="ti ti-chevron-right text-xs font-bold" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Doctor Showcase Section */}
        <section className="bg-[#FFFFFF] px-4 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl rounded-[24px] bg-[#F8FAFC] px-6 py-14 shadow-[0_20px_50px_rgba(15,23,42,0.02)] border border-slate-100/80 sm:px-8 lg:px-12 lg:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F0FE] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#1A73E8]">
                <i className="ti ti-shield-check" />
                Trusted Healthcare
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
                Meet Our Qualified Doctors
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-[#4B5563]">
                At ASHINI Family Clinic Center, our specialists bring decades of clinical precision and compassionate care.
                From complex surgical interventions to routine family wellness, we are committed to your health journey.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-center">
              {doctorShowcaseItems.map((doctor) => (
                <article
                  key={doctor.name}
                  className={`group overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 ${doctor.hoverClass}`}
                >
                  <div className="relative overflow-hidden bg-slate-100">
                    <img
                      src={doctor.image}
                      alt={doctor.name}
                      className="h-72 w-full object-cover object-top sm:h-80 transition-transform duration-500 group-hover:scale-105"
                    />
                    <span
                      className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${doctor.badgeClass}`}
                    >
                      {doctor.specialty}
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className={`text-lg font-bold text-[#0F172A] transition-colors duration-200 ${doctor.titleHoverClass}`}>
                      {doctor.name}
                    </h3>
                    <p className={`mt-0.5 text-xs font-semibold uppercase tracking-wider ${doctor.subtitleColorClass}`}>
                      {doctor.title}
                    </p>

                    <div className="mt-5 space-y-2.5 text-sm text-[#4B5563] border-t border-slate-100 pt-4">
                      <div className="flex items-start gap-2.5">
                        <i className="ti ti-school text-[#9CA3AF] text-lg mt-0.5" />
                        <span className="text-xs leading-relaxed">{doctor.credentials}</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <i className="ti ti-briefcase text-[#9CA3AF] text-lg mt-0.5" />
                        <span className="text-xs font-medium">{doctor.experience}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="bg-[#F8FAFC] px-4 py-20 sm:px-8 border-y border-slate-100">
          <div className="mx-auto max-w-7xl text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#1A73E8]">
              Why Choose Us
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
              What Makes Us Different
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-[#4B5563]">
              We combine experienced medical care with a modern digital system
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureItems.map((item) => (
              <div
                key={item.title}
                className={`group rounded-2xl border border-slate-200/50 bg-white p-6 transition-all duration-300 ${item.hoverBorder}`}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: item.accent, color: item.color }}
                >
                  <i className={`ti ${item.icon}`} />
                </div>
                <h3 className="mt-5 text-base font-bold text-[#0F172A]">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#4B5563]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Services Section */}
        <section className="bg-white px-4 py-20 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12 lg:items-center">

            {/* Left Column: Services */}
            <div className="lg:col-span-7">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#1A73E8]">
                Our Services
              </div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
                Comprehensive Outpatient Care
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#4B5563] max-w-xl">
                Our clinic provides reliable primary care, family support, and referral pathways for the Badulla community.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {serviceItems.map((service) => (
                  <div
                    key={service}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-colors duration-200 hover:bg-[#F8FAFC]"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAFAF1] text-[#2ECC71]">
                      <i className="ti ti-check text-xs font-bold" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-[#4B5563]">{service}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1A73E8] hover:text-[#1557B0] transition-colors duration-200"
                >
                  About Our Clinic
                  <i className="ti ti-arrow-right text-base" />
                </Link>
              </div>
            </div>

            {/* Right Column: Stats Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-slate-900 p-8 text-white shadow-xl overflow-hidden border border-slate-800">
                {/* Decorative Glowing Blurs */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#EF4444]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#10B981]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#1A73E8]/10 rounded-full blur-3xl pointer-events-none" />

                {/* Visual backdrop grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.03)_1px,_transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                <h3 className="relative z-10 text-xl font-bold tracking-tight text-white mb-6">
                  Trusted by the Badulla Community
                </h3>
                <div className="relative z-10 space-y-6">
                  {[
                    ["15+", "Years serving Badulla"],
                    ["3", "Specialist Doctors"],
                    ["50+", "Patients per day"],
                  ].map(([value, label]) => (
                    <div key={label} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                      <div className="text-4xl font-extrabold text-white font-sans">{value}</div>
                      <div className="mt-1 text-xs sm:text-sm text-white/70 font-medium">{label}</div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="relative z-10 mt-8 w-full rounded-xl bg-white px-5 py-4 text-center text-xs font-bold text-slate-900 shadow-md transition-all duration-300 hover:bg-[#F8FAFC] hover:-translate-y-0.5 active:translate-y-0"
                >
                  Register as a Patient
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-[#F8FAFC] px-4 py-20 sm:px-8 border-t border-slate-100">
          <div className="mx-auto max-w-7xl text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#1A73E8]">
              Simple Process
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
              How It Works
            </h2>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3 relative">
            {/* Process connector line for large screens */}
            <div className="absolute top-1/3 left-1/6 right-1/6 h-[2px] bg-slate-200/50 hidden md:block -z-10" />

            {stepItems.map((step) => (
              <article
                key={step.title}
                className={`group relative bg-white rounded-2xl border border-slate-200/50 p-6 transition-all duration-300 flex flex-col items-center text-center ${step.hoverClass}`}
              >
                <div className="relative mb-6 overflow-hidden rounded-xl bg-slate-50 w-full">
                  <img
                    src={step.image}
                    alt={step.alt}
                    className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className={`absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold shadow-md font-sans ${step.badgeClass}`}>
                    {step.number}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-base font-bold text-[#0F172A]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#4B5563]">
                    {step.text}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={handleBookAppointment}
              className="cursor-pointer rounded-xl bg-[#1A73E8] px-8 py-4 text-sm font-bold text-white shadow-[0_4px_14px_rgba(26,115,232,0.3)] transition-all duration-300 hover:bg-[#1557B0] hover:shadow-[0_6px_20px_rgba(26,115,232,0.5)] hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started Free →
            </button>
          </div>
        </section>

        {/* Contact Info Grid */}
        <section className="bg-white border-t border-slate-100 px-4 py-16 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Opening Hours */}
            <div className="group flex items-start gap-4 rounded-2xl border border-slate-200/50 p-6 transition-all duration-300 hover:shadow-md hover:border-[#10B981]/25">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EBF7ED] text-[#16A34A] transition-transform duration-300 group-hover:scale-110">
                <i className="ti ti-clock text-lg" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Operational Hours</span>
                <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                  Opening Hours
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#4B5563]">
                  <strong>Mon – Fri:</strong> {formatTime("08:00")} – {formatTime("17:00")}
                  <br />
                  <strong>Sat:</strong> {formatTime("08:00")} – {formatTime("13:00")}
                  <br />
                  <strong>Sun &amp; Public Holidays:</strong> Closed
                </p>
              </div>
            </div>

            {/* Contact Us */}
            <div className="group flex items-start gap-4 rounded-2xl border border-slate-200/50 p-6 transition-all duration-300 hover:shadow-md hover:border-[#EF4444]/25">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#EF4444] transition-transform duration-300 group-hover:scale-110">
                <i className="ti ti-phone text-lg" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Get in Touch</span>
                <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                  Contact Us
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#4B5563]">
                  <strong>Tel:</strong> 055 222 4567
                  <br />
                  <strong>Mobile:</strong> 077 123 4567
                  <br />
                  <strong>Email:</strong> ashinifamilyclinic@gmail.com
                  <br />
                  <strong>WhatsApp:</strong> 077 123 4567
                </p>
              </div>
            </div>

            {/* Find Us */}
            <div className="group flex items-start gap-4 rounded-2xl border border-slate-200/50 p-6 transition-all duration-300 hover:shadow-md hover:border-[#1A73E8]/25 col-span-1 sm:col-span-2 lg:col-span-1">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#1A73E8] transition-transform duration-300 group-hover:scale-110">
                <i className="ti ti-map-pin text-lg" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Clinic Location</span>
                <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                  Find Us
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#4B5563]">
                  No. 14, Bandarawela Road
                  <br />
                  Badulla, Uva Province
                  <br />
                  Sri Lanka — 90000
                  <br />
                  <span className="text-xs text-[#9CA3AF]">(Near Badulla Bus Stand)</span>
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
