import { useEffect, useState, useRef } from "react";
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
import ashiniLogo from "../assets/images/Ashini logo.png";
import clinicImage from "../assets/images/clinic image.png";

const featureItems = [
  {
    icon: "ti-device-mobile",
    color: "#1A73E8",
    title: "Book From Your Phone",
    text: "Register once and book from mobile browser, no calls needed",
  },
  {
    icon: "ti-list-numbers",
    color: "#1A73E8",
    title: "Live Queue Tracking",
    text: "Watch your queue position update in real time from anywhere",
  },
  {
    icon: "ti-notes",
    color: "#1A73E8",
    title: "Digital Consultation Records",
    text: "Every diagnosis and doctor note saved and accessible forever",
  },
  {
    icon: "ti-user-check",
    color: "#EF4444",
    title: "Walk-ins Always Welcome",
    text: "No appointment needed — just arrive and we add you to queue",
  },
  {
    icon: "ti-heart-rate-monitor",
    color: "#EF4444",
    title: "Experienced Specialists",
    text: "Qualified MBBS doctors with years of Uva Province experience",
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


function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState("");
  const [scrollIndex, setScrollIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef(null);

  const scrollPrev = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -244, behavior: "smooth" });
    }
  };

  const scrollNext = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 15) {
        carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        carouselRef.current.scrollBy({ left: 244, behavior: "smooth" });
      }
    }
  };

  const scrollTo = (index) => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: index * 244, behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const index = Math.round(scrollLeft / 244);
      setScrollIndex(index);
    }
  };

  useEffect(() => {
    if (doctors.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [doctors, isPaused]);

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
    <div className="flex min-h-screen flex-col bg-[#E8F1FC] text-[#1F2937]">
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
        <section className="bg-transparent px-4 py-24 sm:px-8 relative overflow-hidden">
          {/* Accent Ambient Glow behind doctor cards */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,_rgba(26,115,232,0.03)_0%,_transparent_70%)] pointer-events-none" />

          <div className="relative mx-auto max-w-7xl rounded-[28px] bg-gradient-to-br from-white via-slate-50/50 to-blue-50/20 px-6 py-16 shadow-[0_20px_50px_rgba(26,115,232,0.03)] border border-blue-100/60 sm:px-8 lg:px-12 lg:py-20">
            {/* Corner Dotted Design Accents */}
            <div
              className="absolute -top-6 -right-6 w-24 h-24 bg-[radial-gradient(#1A73E8_1.5px,transparent_1.5px)] [background-size:8px_8px] opacity-15 pointer-events-none rounded-2xl hidden md:block"
            />
            <div
              className="absolute -bottom-6 -left-6 w-24 h-24 bg-[radial-gradient(#1A73E8_1.5px,transparent_1.5px)] [background-size:8px_8px] opacity-15 pointer-events-none rounded-2xl hidden md:block"
            />

            <div className="relative mx-auto max-w-3xl text-center">
              {/* Dotted pattern accent positioned behind/beside the section heading */}
              <div
                className="absolute -top-6 left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 w-20 h-20 bg-[radial-gradient(#1A73E8_1.5px,transparent_1.5px)] [background-size:8px_8px] opacity-15 pointer-events-none"
                style={{ width: "80px", height: "80px" }}
              />

              <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F0FE] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#1A73E8] relative z-10">
                <i className="ti ti-shield-check" />
                Trusted Healthcare
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl relative z-10">
                Meet Our Qualified Doctors
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-[#4B5563] relative z-10">
                At ASHINI Family Clinic Center, our specialists bring decades of clinical precision and compassionate care.
                From complex surgical interventions to routine family wellness, we are committed to your health journey.
              </p>
            </div>

            {/* Carousel Container */}
            <div className="relative mx-auto mt-16 max-w-6xl px-12 group/carousel">
              {/* Navigation Arrows */}
              {doctors.length > 0 && (
                <>
                  <button
                    onClick={scrollPrev}
                    aria-label="Previous Doctor"
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1A73E8] shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-100 hover:bg-[#F8FAFC] transition-all hover:scale-105 duration-200 cursor-pointer opacity-70 group-hover/carousel:opacity-100"
                  >
                    <i className="ti ti-chevron-left text-lg font-bold" />
                  </button>
                  <button
                    onClick={scrollNext}
                    aria-label="Next Doctor"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1A73E8] shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-100 hover:bg-[#F8FAFC] transition-all hover:scale-105 duration-200 cursor-pointer opacity-70 group-hover/carousel:opacity-100"
                  >
                    <i className="ti ti-chevron-right text-lg font-bold" />
                  </button>
                </>
              )}

              {/* Scrollable track */}
              {doctorsLoading ? (
                <div className="flex gap-6 overflow-x-hidden py-4 justify-center">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="w-[220px] shrink-0 bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)] animate-pulse space-y-4">
                      <div className="aspect-[4/5] w-full bg-slate-200 rounded-xl" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-3 bg-slate-200 rounded w-5/6" />
                    </div>
                  ))}
                </div>
              ) : doctorsError ? (
                <div className="text-center py-12 text-[#E53935] font-medium text-sm">
                  {doctorsError}
                </div>
              ) : doctors.length === 0 ? (
                <div className="w-full text-center py-12 text-[#4B5563]">
                  <div className="text-4xl mb-2 text-slate-300"><i className="ti ti-stethoscope" /></div>
                  <p className="text-sm font-semibold">No qualified doctors added yet.</p>
                  <p className="text-xs text-slate-400">Doctors will appear here once they are registered by the administration.</p>
                </div>
              ) : (
                <>
                  <div
                    ref={carouselRef}
                    onScroll={handleScroll}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-6 px-1 scrollbar-hide"
                    style={{
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    {doctors.map((doc, idx) => {
                      const id = doc.id || doc.doctor_id;
                      const name = doc.name || doc.full_name;
                      const specialty = doc.specialty || doc.specialisation || "General Practitioner";
                      const photoUrl = doc.photo_url || "";

                      // Process qualification and experience
                      let qualification = doc.qualification || "";
                      let experience = doc.experience_years ? `${doc.experience_years} Years Experience` : "";
                      if (doc.bio && (!qualification || !experience)) {
                        const parts = doc.bio.split(',');
                        if (parts.length > 0 && !qualification) qualification = parts[0].trim();
                        if (parts.length > 1 && !experience) experience = parts[1].trim();
                      }
                      if (!qualification) qualification = doc.bio || "Medical Officer";
                      if (!experience) experience = "Experienced Consultant";

                      return (
                        <article
                          key={id || idx}
                          className="group w-[80%] sm:w-[45%] md:w-[45%] lg:w-[220px] shrink-0 snap-start bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_24px_rgba(26,115,232,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col relative"
                        >
                          <div className="relative">
                            <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-50 rounded-t-2xl">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={name}
                                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1A73E8] to-[#1557B0] text-white text-3xl font-extrabold select-none">
                                  {getInitials(name)}
                                </div>
                              )}
                            </div>

                            {/* Specialty badge: overlapping the bottom edge of the photo */}
                            <span className="absolute bottom-0 left-4 translate-y-1/2 z-20 rounded-full bg-[#1A73E8] px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-md whitespace-nowrap">
                              {specialty}
                            </span>
                          </div>

                          <div className="p-4 pt-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="text-sm font-extrabold text-[#0F172A] line-clamp-1 group-hover:text-[#1A73E8] transition-colors duration-200">
                                {name}
                              </h3>
                              <p className="mt-1.5 text-[11px] font-semibold text-[#4B5563] line-clamp-1">
                                {qualification}
                              </p>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-[11px] text-[#4B5563] border-t border-slate-100 pt-3">
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1A73E8]">
                                <i className="ti ti-briefcase text-[9px]" />
                              </div>
                              <span className="font-semibold text-slate-700">{experience}</span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Dot Indicators */}
                  {doctors.length > 1 && (
                    <div className="mt-4 flex justify-center gap-1.5">
                      {doctors.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => scrollTo(idx)}
                          aria-label={`Go to slide ${idx + 1}`}
                          className={`h-1.5 rounded-full transition-all duration-300 ${scrollIndex === idx ? "w-4 bg-[#1A73E8]" : "w-1.5 bg-slate-300 hover:bg-slate-400"
                            }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section - Redesigned Asymmetric Layout */}
        <section className="bg-[#F3F7FC] px-4 py-24 sm:px-8 border-y border-blue-100/30 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,_rgba(26,115,232,0.025)_0%,_transparent_70%)] pointer-events-none" />

          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-12 items-center">

              {/* Left Column: Image (40% width -> 5/12 columns) */}
              <div className="lg:col-span-5 relative group">
                {/* Decorative background shape */}
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#1A73E8]/10 to-[#1A73E8]/5 -rotate-1 scale-[1.02] group-hover:rotate-0 transition-transform duration-500" />

                <div className="relative h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] rounded-2xl overflow-hidden shadow-lg border border-slate-200">
                  <img
                    src={clinicImage}
                    alt="ASHINI Family Clinic Center reception and queue management system"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                </div>

                {/* Tiny Floating badge for premium feel */}
                <div className="absolute -bottom-6 -right-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-xl flex items-center gap-3 hidden sm:flex animate-pulse">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1A73E8]">
                    <i className="ti ti-clock text-lg" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-800">Zero Wait Time</div>
                    <div className="text-[10px] text-slate-400 font-bold">Track from your phone</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Clean Editorial List (60% width -> 7/12 columns) */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <div className="text-left mb-10">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F0FE] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#1A73E8]">
                    <i className="ti ti-circle-half-2" />
                    Why Choose Us
                  </div>
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
                    What Makes Us Different
                  </h2>
                  <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#4B5563]">
                    We combine experienced medical care with a modern digital system, designed to respect your time and health.
                  </p>
                </div>

                <div className="space-y-0">
                  {featureItems.map((item, index) => (
                    <div
                      key={item.title}
                      className="group flex gap-5 py-6 border-b border-slate-200 last:border-b-0 items-start hover:bg-white/30 rounded-xl px-4 -mx-4 transition-colors duration-200 animate-slide-in-up"
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-base shadow-sm transition-transform duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: "#1A73E8",
                        }}
                      >
                        <i className={`ti ${item.icon}`} />
                      </div>

                      <div className="space-y-1 flex-1">
                        <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#1A73E8] transition-colors duration-150">
                          {item.title}
                        </h3>
                        <p className="text-xs sm:text-sm leading-relaxed text-[#4B5563]">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* Our Services Section */}
        <section className="bg-transparent px-4 py-24 sm:px-8">
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

              <div className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {serviceItems.map((service) => (
                  <div
                    key={service}
                    className="flex items-center gap-3.5 p-2 rounded-xl transition-all duration-200 hover:bg-[#E8F0FE]/40 group/item"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1A73E8] text-white shadow-sm transition-transform duration-200 group-hover/item:scale-110">
                      <i className="ti ti-check text-xs font-bold" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 leading-normal group-hover/item:text-[#1A73E8] transition-colors duration-150">
                      {service}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-slate-100 pt-6">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#1A73E8] hover:text-[#1557B0] transition-colors duration-200 group/link"
                >
                  About Our Clinic
                  <i className="ti ti-arrow-right text-base group-hover/link:translate-x-1 transition-transform" />
                </Link>
                {/* Decorative govt. registered info badge */}
                <div className="flex items-center gap-3 bg-[#E8F0FE]/50 rounded-2xl p-3 border border-blue-50/85">


                </div>
              </div>
            </div>

            {/* Right Column: Stats Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#122340] p-10 text-white shadow-[0_20px_50px_rgba(15,23,42,0.12)] overflow-hidden border border-slate-800/80">
                {/* Soft Radial Glow positioned top-right corner behind the "15+" stat */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_top_right,_rgba(26,115,232,0.22)_0%,_transparent_70%)] pointer-events-none" />

                {/* Decorative Glowing Blurs */}
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#EF4444]/8 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#1A73E8]/8 pointer-events-none" />

                {/* Visual backdrop grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.02)_1px,_transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                <h3 className="relative z-10 text-xl font-bold tracking-tight text-white mb-8">
                  Trusted by the Badulla Community
                </h3>

                {/* Stats stacked with more generous vertical spacing */}
                <div className="relative z-10 space-y-8">
                  {[
                    ["15+", "Years serving Badulla"],
                    ["3", "Specialist Doctors"],
                    ["50+", "Patients per day"],
                  ].map(([value, label]) => (
                    <div key={label} className="flex flex-col items-start">
                      {/* Thin blue accent line above each stat number */}
                      <div className="w-10 h-[2px] bg-[#1A73E8] rounded-full mb-3.5" />
                      <div className="text-4xl font-extrabold font-sans bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent inline-block tracking-tight leading-none">
                        {value}
                      </div>
                      <div className="mt-2 text-xs sm:text-sm text-slate-400 font-medium">{label}</div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="group relative z-10 mt-10 w-full rounded-xl bg-white px-5 py-4 text-center text-xs font-bold text-[#0F172A] shadow-md transition-all duration-300 ease-in-out hover:bg-slate-50 hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Register as a Patient</span>
                  <i className="ti ti-arrow-right text-sm transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-transparent px-4 py-24 sm:px-8 border-t border-blue-100/20">
          <div className="mx-auto max-w-7xl text-center">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#1A73E8]">
              Simple Process
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
              How It Works
            </h2>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-8 md:grid-cols-3 relative">
            {/* Process connector dashed line for large screens */}
            <div className="absolute top-[22%] left-[12%] right-[12%] h-[2px] border-t-2 border-dashed border-blue-200/50 hidden md:block -z-10" />

            {stepItems.map((step) => (
              <article
                key={step.title}
                className="group relative bg-white rounded-2xl border border-slate-200/50 p-6 flex flex-col items-center text-center shadow-[0_8px_30px_rgba(15,23,42,0.02)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(26,115,232,0.06)]"
              >
                <div className="relative mb-6 w-full">
                  <div className="relative overflow-hidden rounded-2xl bg-slate-50 w-full shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 aspect-[16/10]">
                    <img
                      src={step.image}
                      alt={step.alt}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    {/* Subtle blue-tinted overlay gradient at the bottom third */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#1A73E8]/15 to-transparent pointer-events-none" />
                  </div>
                  {/* Overlapping Numbered Badge with rotate sticker feel */}
                  <div
                    className={`absolute -top-3 -left-3 z-20 flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black shadow-[0_4px_10px_rgba(0,0,0,0.12)] border-2 border-white ${step.number === "1" ? "bg-gradient-to-br from-[#60A5FA] to-[#1A73E8] text-white" :
                        "bg-gradient-to-br from-[#60A5FA] to-[#1A73E8] text-white"
                      }`}
                    style={{ transform: "rotate(-5deg)" }}
                  >
                    {step.number}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-base font-bold text-[#0F172A]">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#4B5563]">
                    {step.text}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-14 text-center">
            <button
              type="button"
              onClick={handleBookAppointment}
              className="cursor-pointer rounded-xl bg-[#1A73E8] px-8 py-4 text-sm font-bold text-white shadow-[0_4px_14px_rgba(26,115,232,0.25)] transition-all duration-300 hover:bg-[#1557B0] hover:shadow-[0_8px_24px_rgba(26,115,232,0.45)] hover:scale-[1.03] active:scale-95"
            >
              Get Started Free →
            </button>
          </div>
        </section>

        {/* Contact Info Grid */}
        <section className="bg-transparent border-t border-blue-100/20 px-4 py-16 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Opening Hours */}
            <div className="group flex items-start gap-4 rounded-2xl border border-blue-100/40 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200/50">
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
            <div className="group flex items-start gap-4 rounded-2xl border border-blue-100/40 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200/50">
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
            <div className="group flex items-start gap-4 rounded-2xl border border-blue-100/40 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200/50 col-span-1 sm:col-span-2 lg:col-span-1">
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
