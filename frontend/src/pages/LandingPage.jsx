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

const staticQueueMessage =
  "Badulla Medical Centre — Open Mon to Sat · 8:00 AM – 5:00 PM · Call: 055 222 4567";

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
  },
  {
    number: "2",
    title: "Book or Walk In",
    text: "Choose your doctor and time slot online, or just arrive",
  },
  {
    number: "3",
    title: "Track & Consult",
    text: "Track your queue live and see the doctor when called",
  },
];

function formatQueueNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "Q--";
  }

  const normalized = String(value).replace(/^Q/i, "").trim();
  if (!normalized) {
    return "Q--";
  }

  const numeric = Number(normalized);
  return Number.isFinite(numeric)
    ? `Q${String(numeric).padStart(2, "0")}`
    : `Q${normalized}`;
}

function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [queueSummary, setQueueSummary] = useState(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadQueueStatus() {
      setQueueLoading(true);
      try {
        const response = await fetch("/api/queue/status.php", {
          credentials: "include",
        });

        if (!response.ok) {
          if (active) {
            setQueueSummary(null);
          }
          return;
        }

        const data = await response.json();
        if (active) {
          setQueueSummary(data);
        }
      } catch (error) {
        if (active) {
          setQueueSummary(null);
        }
      } finally {
        if (active) {
          setQueueLoading(false);
        }
      }
    }

    loadQueueStatus();
    const intervalId = window.setInterval(loadQueueStatus, 30000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

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

  const queueNumber = formatQueueNumber(queueSummary?.queue_number);
  const waitingCount = Number(
    queueSummary?.waiting ?? queueSummary?.total_waiting ?? 0,
  );
  const avgWait = Number(
    queueSummary?.estimated_wait_minutes ?? queueSummary?.avg_wait_minutes ?? 0,
  );
  const consultationsDone = Number(
    queueSummary?.completed ?? queueSummary?.total_completed ?? 0,
  );
  const isClinicOpen =
    queueSummary?.open_now !== false &&
    String(queueSummary?.status || "open").toLowerCase() !== "closed";
  const queueAnnouncement = queueLoading
    ? "Loading live clinic updates..."
    : isClinicOpen
      ? `Clinic Open · Now Serving ${queueNumber} · ${waitingCount} patients waiting · ~${avgWait} min avg wait`
      : staticQueueMessage;
  const leadDoctorInitials = getInitials(doctors[0]?.full_name || "BM");
  const doctorTitle = doctors[0]?.full_name || "Our physicians";

  function handleBookAppointment() {
    navigate(user ? "/patient/book" : "/register");
  }

  function handleHowItWorks() {
    navigate("/how-it-works");
  }

  function scrollToOverview() {
    document.getElementById("clinic-overview")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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
    {
      label: "Queue Status",
      icon: "ti-list-numbers",
      action: scrollToOverview,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] text-[#1F2937]">
      <Navbar />

      <main className="flex-1">
        <section className="w-full bg-[#1A73E8] px-4 py-2 text-center text-sm text-white sm:px-8">
          {queueLoading ? (
            <div className="mx-auto h-4 w-72 animate-pulse rounded-full bg-white/25" />
          ) : (
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-2 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2ECC71]" />
                {isClinicOpen ? "Clinic Open" : "Clinic Closed"}
              </span>
              <span>·</span>
              <span>Now Serving {queueNumber}</span>
              <span>·</span>
              <span>{waitingCount} patients waiting</span>
              <span>·</span>
              <span>~{avgWait} min avg wait</span>
            </p>
          )}
        </section>

        <section
          className="relative h-[380px] overflow-hidden sm:h-[450px] lg:h-[500px]"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex h-full items-center justify-center px-4 sm:px-8">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center text-white">
              <span className="mb-4 inline-flex items-center rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white">
                Uva Province · Badulla, Sri Lanka
              </span>
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
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:px-8 lg:grid-cols-4">
            {quickAccessCards.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                aria-label={item.label}
                className="group cursor-pointer rounded-xl border border-[#E5E7EB] bg-white p-6 text-center transition-all duration-200 hover:border-[rgba(26,115,232,0.15)] hover:shadow-md"
              >
                <i
                  className={`ti ${item.icon} mb-3 block text-3xl text-[#1A73E8]`}
                />
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

        <section
          id="clinic-overview"
          className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-8 sm:px-8"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#1F2937]">
                Today at Badulla Medical Centre
              </h2>
              <p className="mt-1 text-sm text-[#4B5563]">
                Live clinic updates, queue movement, and service availability
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm lg:self-auto">
              <span
                className={`h-2.5 w-2.5 rounded-full ${isClinicOpen ? "bg-[#2ECC71]" : "bg-[#9CA3AF]"}`}
              />
              <span
                className={
                  isClinicOpen
                    ? "font-medium text-[#2ECC71]"
                    : "font-medium text-[#4B5563]"
                }
              >
                {isClinicOpen ? "Open Now" : "Closed"}
              </span>
            </div>
          </div>

          <div className="mx-auto mt-6 grid max-w-7xl gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { value: queueNumber, label: "Current Queue" },
              { value: waitingCount, label: "Patients Waiting" },
              { value: `~${avgWait} min`, label: "Avg Wait Time" },
              { value: consultationsDone, label: "Consultations Done" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
              >
                <div className="text-2xl font-bold text-[#1A73E8]">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-[#4B5563]">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-4 max-w-7xl text-sm text-[#4B5563]">
            {queueLoading ? (
              <div className="h-4 w-80 animate-pulse rounded-full bg-[#E5E7EB]" />
            ) : (
              <p>{queueAnnouncement}</p>
            )}
          </div>
        </section>

        <section className="bg-[#FFFFFF] px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1A73E8]">
              Specialists
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1F2937]">
              Meet Our Doctors
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-[#4B5563]">
              Our experienced team provides the best medical care in Badulla
            </p>
            <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2 text-xs text-[#4B5563]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F0FE] text-sm font-semibold text-[#1A73E8]">
                {leadDoctorInitials}
              </span>
              <span>{doctorTitle}</span>
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-7xl">
            {doctorsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
                  >
                    <div className="h-16 w-16 animate-pulse rounded-full bg-[#E5E7EB]" />
                    <div className="mt-4 h-5 w-40 animate-pulse rounded bg-[#E5E7EB]" />
                    <div className="mt-2 h-4 w-20 animate-pulse rounded bg-[#E5E7EB]" />
                    <div className="mt-4 h-8 w-28 animate-pulse rounded-full bg-[#E5E7EB]" />
                    <div className="mt-5 h-px w-full bg-[#E5E7EB]" />
                    <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-[#E5E7EB]" />
                    <div className="mt-2 h-4 w-full animate-pulse rounded bg-[#E5E7EB]" />
                    <div className="mt-6 h-5 w-32 animate-pulse rounded bg-[#E5E7EB]" />
                  </div>
                ))}
              </div>
            ) : doctors.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {doctors.map((doctor) => (
                  <DoctorCard
                    key={doctor.user_id ?? doctor.id ?? doctor.full_name}
                    doctor={doctor}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-5 text-sm text-[#4B5563]">
                {doctorsError || "Unable to load. Please refresh."}
              </div>
            )}
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

          <div className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-3">
            {stepItems.map((step, index) => (
              <div
                key={step.title}
                className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#1A73E8] text-sm font-semibold text-white">
                  {step.number}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-[#1F2937]">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#4B5563]">
                  {step.text}
                </p>
                {index < stepItems.length - 1 ? (
                  <div className="mt-4 hidden text-[#9CA3AF] md:block">→</div>
                ) : null}
              </div>
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
