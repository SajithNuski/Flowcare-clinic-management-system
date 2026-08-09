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

const CountUp = ({ end, duration = 1500, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);

  useEffect(() => {
    let start = 0;
    const endVal = parseInt(end, 10);
    if (isNaN(endVal)) return;

    let observer;
    let animationFrameId;

    const startAnimation = () => {
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Easing function: easeOutQuad
        const easeProgress = progress * (2 - progress);
        
        const currentCount = Math.floor(easeProgress * endVal);
        setCount(currentCount);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          setCount(endVal);
        }
      };

      animationFrameId = requestAnimationFrame(animate);
    };

    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          startAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (observer) observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [end, duration]);

  return <span ref={elementRef}>{count}{suffix}</span>;
};

const getGradientForDoctor = (name = "") => {
  const gradients = [
    "from-[#3B82F6] to-[#06B6D4]", // Blue-Cyan
    "from-[#10B981] to-[#3B82F6]", // Emerald-Blue
    "from-[#EC4899] to-[#8B5CF6]", // Pink-Purple
    "from-[#F59E0B] to-[#EF4444]", // Amber-Red
    "from-[#6366F1] to-[#D946EF]", // Indigo-Fuchsia
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % gradients.length;
  return gradients[idx];
};

const getSpecialtyStyles = (specialty = "") => {
  const s = specialty.toLowerCase();
  if (s.includes("cardio")) {
    return {
      badgeBg: "bg-rose-50/95 border-rose-100/60 text-rose-600",
      hoverBorder: "hover:border-rose-300 hover:shadow-[0_20px_40px_rgba(244,63,94,0.08)]",
      iconColor: "text-rose-500",
      bulletBg: "bg-rose-50",
      calendarColor: "text-rose-500 bg-rose-50",
      briefcaseColor: "text-rose-500 bg-rose-50"
    };
  }
  if (s.includes("paediat") || s.includes("pediat") || s.includes("child") || s.includes("baby")) {
    return {
      badgeBg: "bg-amber-50/95 border-amber-100/60 text-amber-600",
      hoverBorder: "hover:border-amber-300 hover:shadow-[0_20px_40px_rgba(245,158,11,0.08)]",
      iconColor: "text-amber-500",
      bulletBg: "bg-amber-50",
      calendarColor: "text-amber-500 bg-amber-50",
      briefcaseColor: "text-amber-500 bg-amber-50"
    };
  }
  if (s.includes("physician") || s.includes("general") || s.includes("practi")) {
    return {
      badgeBg: "bg-emerald-50/95 border-emerald-100/60 text-emerald-600",
      hoverBorder: "hover:border-emerald-300 hover:shadow-[0_20px_40px_rgba(16,185,129,0.08)]",
      iconColor: "text-emerald-500",
      bulletBg: "bg-emerald-50",
      calendarColor: "text-emerald-500 bg-emerald-50",
      briefcaseColor: "text-emerald-500 bg-emerald-50"
    };
  }
  return {
    badgeBg: "bg-blue-50/95 border-blue-100/60 text-[#1A73E8]",
    hoverBorder: "hover:border-blue-300 hover:shadow-[0_20px_40px_rgba(26,115,232,0.08)]",
    iconColor: "text-[#1A73E8]",
    bulletBg: "bg-blue-50",
    calendarColor: "text-[#1A73E8] bg-blue-50",
    briefcaseColor: "text-[#1A73E8] bg-blue-50"
  };
};

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
      carouselRef.current.scrollBy({ left: -284, behavior: "smooth" });
    }
  };

  const scrollNext = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 15) {
        carouselRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        carouselRef.current.scrollBy({ left: 284, behavior: "smooth" });
      }
    }
  };

  const scrollTo = (index) => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: index * 284, behavior: "smooth" });
    }
  };

  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const index = Math.round(scrollLeft / 284);
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

          <div className="relative mx-auto max-w-7xl rounded-[32px] bg-gradient-to-br from-white via-[#F8FAFC] to-white px-6 py-16 shadow-[0_20px_50px_rgba(26,115,232,0.025)] border border-slate-200/50 sm:px-8 lg:px-12 lg:py-20">
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
                className="absolute -top-6 left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 w-20 h-20 bg-[radial-gradient(#1A73E8_1.5px,transparent_1.5px)] [background-size:8px_8px] opacity-10 pointer-events-none"
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
            <div className="relative mx-auto mt-16 max-w-6xl px-4 group/carousel">
              {/* Navigation Arrows */}
              {doctors.length > 0 && (
                <>
                  <button
                    onClick={scrollPrev}
                    aria-label="Previous Doctor"
                    className="absolute -left-6 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-[#1A73E8] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 hover:bg-white hover:text-[#1557B0] hover:shadow-[0_8px_30px_rgba(26,115,232,0.15)] transition-all duration-300 cursor-pointer opacity-0 group-hover/carousel:opacity-100 translate-x-2 group-hover/carousel:translate-x-0"
                  >
                    <i className="ti ti-chevron-left text-lg font-bold" />
                  </button>
                  <button
                    onClick={scrollNext}
                    aria-label="Next Doctor"
                    className="absolute -right-6 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-[#1A73E8] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 hover:bg-white hover:text-[#1557B0] hover:shadow-[0_8px_30px_rgba(26,115,232,0.15)] transition-all duration-300 cursor-pointer opacity-0 group-hover/carousel:opacity-100 -translate-x-2 group-hover/carousel:translate-x-0"
                  >
                    <i className="ti ti-chevron-right text-lg font-bold" />
                  </button>
                </>
              )}

              {/* Scrollable track */}
              {doctorsLoading ? (
                <div className="flex gap-6 overflow-x-hidden py-4 justify-center">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="w-[260px] shrink-0 bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)] animate-pulse space-y-4">
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

                      // Parse working days
                      const daysArr = doc.working_days ? doc.working_days.split(',') : [];
                      const formattedDays = daysArr.length > 0 ? daysArr.join(', ') : 'Mon - Fri';

                      return (
                        <article
                          key={id || idx}
                          className="group w-[280px] sm:w-[260px] md:w-[260px] lg:w-[260px] shrink-0 snap-start bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(26,115,232,0.1)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col relative overflow-hidden"
                        >
                          {/* Image Container with aspect ratio and slide effect */}
                          <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-50">
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={name}
                                className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1A73E8] to-[#1557B0] text-white text-4xl font-extrabold select-none">
                                {getInitials(name)}
                              </div>
                            )}

                            {/* Elegant gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/70 via-[#0F172A]/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none" />

                            {/* Premium floating glassmorphism specialty badge */}
                            <span className="absolute bottom-4 left-4 z-20 rounded-xl bg-white/95 backdrop-blur-md px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#1A73E8] shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-blue-50/50 whitespace-nowrap">
                              {specialty}
                            </span>
                          </div>

                          {/* Content area with refined padding and micro-details */}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight line-clamp-1 group-hover:text-[#1A73E8] transition-colors duration-200">
                                {name}
                              </h3>
                              <p className="mt-1 text-xs font-semibold text-slate-400 line-clamp-1">
                                {qualification}
                              </p>

                              {/* Working days row */}
                              <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1A73E8]">
                                  <i className="ti ti-calendar text-[10px]" />
                                </div>
                                <span className="font-semibold text-slate-600 line-clamp-1">{formattedDays}</span>
                              </div>
                            </div>

                            {/* Footer section with experience and interactive call-to-action */}
                            <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                              <div className="flex items-center gap-2 text-[11px]">
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#10B981]">
                                  <i className="ti ti-briefcase text-[9px]" />
                                </div>
                                <span className="font-semibold text-slate-700">{experience}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-bold text-[#1A73E8] opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300">
                                <span>Book</span>
                                <i className="ti ti-arrow-right text-[10px]" />
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Dot Indicators */}
                  {doctors.length > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                      {doctors.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => scrollTo(idx)}
                          aria-label={`Go to slide ${idx + 1}`}
                          className={`h-1.5 rounded-full transition-all duration-300 ${scrollIndex === idx ? "w-6 bg-[#1A73E8]" : "w-1.5 bg-slate-200 hover:bg-slate-350"
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
                {/* Dotted Grid Pattern behind the image (top-left) */}
                <div className="absolute -top-10 -left-10 w-24 h-48 bg-[radial-gradient(#1A73E8_2px,transparent_2px)] [background-size:12px_12px] opacity-25 pointer-events-none hidden xl:block" />

                {/* Solid Blue Square overlapping the dotted grid (top-left) */}
                <div className="absolute -top-4 -left-6 w-16 h-16 bg-[#1A73E8] shadow-md pointer-events-none rounded-sm hidden xl:block z-10" />

                {/* Solid Dark Blue Strip / Rectangle at bottom-left */}
                <div className="absolute -bottom-8 -left-6 w-16 h-8 bg-[#1557B0] shadow-sm pointer-events-none rounded-sm hidden xl:block z-10" />

                {/* Cyan Quarter-Circle Shape sitting directly above the dark blue rectangle (bottom-left) */}
                <div className="absolute bottom-0 -left-6 w-16 h-16 bg-[#00D2FF] rounded-tr-full shadow-md pointer-events-none hidden xl:block z-10" />

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

            {/* Right Column: Modern Multiple Square Shapes (Stats Cards Grid) */}
            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Stat 1: 5+ Years */}
                <div className="relative aspect-square rounded-2xl bg-[#3B151F] p-6 text-white border border-[#4C1D24]/60 overflow-hidden shadow-md flex flex-col justify-between hover:-translate-y-1 transition-all duration-305">
                  {/* Soft glow & grid pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,_rgba(244,63,94,0.15)_0%,_transparent_70%)] pointer-events-none" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.01)_1px,_transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                  <div className="w-8 h-[2px] bg-[#F43F5E] rounded-full" />
                  <div>
                    <div className="text-3xl font-extrabold bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent inline-block tracking-tight">
                      <CountUp end={5} suffix="+" />
                    </div>
                    <div className="mt-1 text-xs text-slate-300 font-medium leading-tight">
                      Years serving Badulla
                    </div>
                  </div>
                </div>

                {/* Stat 2: 3 Specialist Doctors */}
                <div className="relative aspect-square rounded-2xl bg-[#0F1D3A] p-6 text-white border border-[#1D2E4D]/60 overflow-hidden shadow-md flex flex-col justify-between hover:-translate-y-1 transition-all duration-305">
                  {/* Soft glow & grid pattern */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.15)_0%,_transparent_70%)] pointer-events-none" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.01)_1px,_transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                  <div className="w-8 h-[2px] bg-[#1A73E8] rounded-full" />
                  <div>
                    <div className="text-3xl font-extrabold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent inline-block tracking-tight">
                      <CountUp end={3} />
                    </div>
                    <div className="mt-1 text-xs text-slate-300 font-medium leading-tight">
                      Specialist Doctors
                    </div>
                  </div>
                </div>

                {/* Stat 3: 10+ Patients per day (Full Width of Grid) */}
                <div className="col-span-2 relative rounded-2xl bg-[#0A2C21] p-6 text-white border border-[#143D30]/60 overflow-hidden shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:-translate-y-1 transition-all duration-305">
                  {/* Soft glow & grid pattern */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.15)_0%,_transparent_70%)] pointer-events-none" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.01)_1px,_transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                  <div className="flex flex-col">
                    <div className="w-8 h-[2px] bg-[#10B981] rounded-full mb-2" />
                    <div className="text-3xl font-extrabold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent inline-block tracking-tight">
                      <CountUp end={10} suffix="+" />
                    </div>
                    <div className="mt-1 text-xs text-slate-300 font-medium">
                      Patients per day
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="group relative z-10 w-full sm:w-auto rounded-xl bg-white px-5 py-3.5 text-center text-xs font-bold text-[#0F172A] shadow-md transition-all duration-300 ease-in-out hover:bg-slate-50 hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <span>Register as a Patient</span>
                    <i className="ti ti-arrow-right text-sm transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          className="relative bg-gradient-to-b from-white to-[#F0F6FE] px-4 py-32 sm:px-8 border-t border-blue-100/20 overflow-hidden"
          style={{
            '--card-radius': '24px',
            '--card-shadow': '0 4px 6px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.08)',
            '--badge-shadow': '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {/* Ambient Blue Glow background div */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,_rgba(26,115,232,0.06)_0%,_transparent_70%)] pointer-events-none" />

          {/* Decorative floating blue shapes */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#1A73E8]/5 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#1A73E8]/5 blur-3xl pointer-events-none" />

          {/* Subtle Decorative Ambient Background Blobs */}
          <div className="absolute top-[25%] left-[10%] w-[350px] h-[350px] bg-[#1A73E8]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-[#10B981]/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative mx-auto max-w-7xl text-center z-20">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#1A73E8]">
              Simple Process
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
              How It Works
            </h2>
          </div>

          <div className="mx-auto mt-20 grid max-w-5xl gap-8 md:grid-cols-3 relative z-20">
            {/* Process connector line for large screens */}
            <div className="absolute top-[35%] left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-blue-200/50 hidden md:block -z-10" />

            {/* Chevron arrows indicating progression direction between steps */}
            <div className="absolute top-[32%] left-[32%] -translate-y-1/2 hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-blue-100/50 shadow-sm z-10 text-[#1A73E8]">
              <i className="ti ti-chevron-right text-xs" />
            </div>
            <div className="absolute top-[38%] left-[65%] -translate-y-1/2 hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-blue-100/50 shadow-sm z-10 text-[#1A73E8]">
              <i className="ti ti-chevron-right text-xs" />
            </div>

            {stepItems.map((step) => (
              <article
                key={step.title}
                className={`group relative bg-white border border-slate-200/40 p-6 flex flex-col items-center text-center shadow-[var(--card-shadow)] hover:shadow-[0_20px_40px_rgba(26,115,232,0.1)] transition-all duration-300 ease-in-out hover:-translate-y-2 ${step.number === "1" ? "md:-translate-y-2 hover:md:-translate-y-4" :
                  step.number === "2" ? "md:translate-y-4 hover:md:translate-y-2" :
                    "md:-translate-y-2 hover:md:-translate-y-4"
                  }`}
                style={{
                  borderRadius: 'var(--card-radius)'
                }}
              >
                <div className="relative mb-6 w-full">
                  {/* Image wrapper with high rounded corners and overflow hidden */}
                  <div className="relative overflow-hidden rounded-[20px] bg-slate-50 w-full shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 h-56">
                    <img
                      src={step.image}
                      alt={step.alt}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Subtle gradient overlay at the bottom third */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#1A73E8]/20 via-[#1A73E8]/5 to-transparent pointer-events-none" />
                  </div>
                  {/* Overlapping circular badges with rotate sticker feel and white border */}
                  <div
                    className={`absolute -top-5 -left-5 z-20 flex h-12 w-12 items-center justify-center rounded-full text-sm font-black shadow-[var(--badge-shadow)] border-[3px] border-white ${step.number === "1" ? "bg-gradient-to-br from-[#FFA0A0] to-[#EF4444] text-white" :
                      step.number === "2" ? "bg-gradient-to-br from-[#60A5FA] to-[#1A73E8] text-white" :
                        "bg-gradient-to-br from-[#00E5FF] to-[#00A3E0] text-white"
                      }`}
                    style={{ transform: "rotate(-7deg)" }}
                  >
                    {step.number}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-start">
                  {/* Small step indicator text */}
                  <span className="text-[10px] font-bold tracking-widest text-[#1A73E8] uppercase block mb-1">
                    Step 0{step.number}
                  </span>
                  <h3 className="text-lg font-extrabold text-[#0F172A]">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#4B5563]">
                    {step.text}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {/* CTA Button with brand-blue tinted shadow and hover scale */}
          <div className="mt-20 text-center">
            <button
              type="button"
              onClick={handleBookAppointment}
              className="group/btn cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A73E8] px-8 py-4 text-sm font-bold text-white shadow-[0_4px_14px_rgba(26,115,232,0.25)] hover:shadow-[0_8px_24px_rgba(26,115,232,0.45)] transition-all duration-300 hover:bg-[#1557B0] hover:scale-[1.02] active:scale-95"
            >
              <span>Get Started Free</span>
              <i className="ti ti-arrow-right text-sm transition-transform duration-300 group-hover/btn:translate-x-1" />
            </button>
          </div>
        </section>

        {/* Contact Info Grid */}
        <section className="bg-transparent border-t border-slate-100 px-4 py-16 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Opening Hours */}
            <div className="group flex items-start gap-5 rounded-2xl border border-slate-100 border-l-4 border-l-[#10B981] bg-gradient-to-br from-white via-white to-[#ECFDF5]/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_20px_40px_rgba(16,185,129,0.08)] hover:-translate-y-1">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] transition-transform duration-300 group-hover:scale-110">
                <i className="ti ti-clock text-lg" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">Operational Hours</span>
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
            <div className="group flex items-start gap-5 rounded-2xl border border-slate-100 border-l-4 border-l-[#F43F5E] bg-gradient-to-br from-white via-white to-[#FFF1F2]/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_20px_40px_rgba(244,63,94,0.08)] hover:-translate-y-1">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F43F5E] to-[#E11D48] text-white shadow-[0_4px_12px_rgba(244,63,94,0.25)] transition-transform duration-300 group-hover:scale-110">
                <i className="ti ti-phone text-lg" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#E11D48] uppercase tracking-wider">Get in Touch</span>
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
            <div className="group flex items-start gap-5 rounded-2xl border border-slate-100 border-l-4 border-l-[#1A73E8] bg-gradient-to-br from-white via-white to-[#E8F0FE]/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_20px_40px_rgba(26,115,232,0.08)] hover:-translate-y-1 col-span-1 sm:col-span-2 lg:col-span-1">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1A73E8] to-[#1557B0] text-white shadow-[0_4px_12px_rgba(26,115,232,0.25)] transition-transform duration-300 group-hover:scale-110">
                <i className="ti ti-map-pin text-lg" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#1557B0] uppercase tracking-wider">Clinic Location</span>
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
