import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DoctorCard from "../components/DoctorCard";
import Badge from "../components/Badge";
import { getAvailableSlots } from "../api/appointments";
import { getDoctors } from "../api/doctors";
import { COLORS } from "../utils/constants";

/**
 * Renders the FlowCare landing page with public clinic information and doctor previews.
 */
function LandingPage() {
  const [queueSummary, setQueueSummary] = useState(null);
  const [queueError, setQueueError] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState("");
  const [featuredSlots, setFeaturedSlots] = useState([]);

  // Section 2: Queue status bar data fetch.
  useEffect(() => {
    async function loadQueueStatus() {
      try {
        const response = await fetch("/api/queue/status.php", {
          credentials: "include",
        });
        if (!response.ok) {
          setQueueError("Visit us today");
          return;
        }

        const data = await response.json();
        setQueueSummary(data);
      } catch (error) {
        setQueueError("Visit us today");
      }
    }

    loadQueueStatus();
  }, []);

  // Section 4: Doctors data fetch.
  useEffect(() => {
    async function loadDoctors() {
      setDoctorsLoading(true);
      try {
        const data = await getDoctors();
        if (!data.success && data.success !== undefined) {
          setDoctorsError(data.error || "Could not load doctors right now.");
          setDoctors([]);
          return;
        }

        setDoctors(Array.isArray(data) ? data : data.doctors || []);
      } catch (error) {
        setDoctorsError("Could not load doctors right now.");
        setDoctors([]);
      } finally {
        setDoctorsLoading(false);
      }
    }

    loadDoctors();
  }, []);

  // Section 4: Optional slot preview fetch so the page can reuse the slot helper.
  useEffect(() => {
    async function loadFeaturedSlots() {
      try {
        const doctorListResponse = await getDoctors();
        const doctorList = Array.isArray(doctorListResponse)
          ? doctorListResponse
          : doctorListResponse.doctors || [];
        const firstDoctor = doctorList[0];

        if (!firstDoctor?.user_id) {
          return;
        }

        const today = new Date().toISOString().slice(0, 10);
        const slotsResponse = await getAvailableSlots(
          firstDoctor.user_id,
          today,
        );

        if (Array.isArray(slotsResponse)) {
          setFeaturedSlots(slotsResponse.slice(0, 3));
        }
      } catch (error) {
        setFeaturedSlots([]);
      }
    }

    loadFeaturedSlots();
  }, []);

  const queueNumber = queueSummary?.queue_number ?? "Q--";
  const waitingCount =
    queueSummary?.waiting ?? queueSummary?.total_waiting ?? 0;
  const avgWait =
    queueSummary?.estimated_wait_minutes ?? queueSummary?.avg_wait_minutes ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      {/* Section 1: Top navigation bar. */}
      <Navbar />

      <main className="flex-1">
        {/* Section 2: Queue status bar. */}
        <section
          className="w-full px-7 py-3 text-sm text-blue-900"
          style={{ backgroundColor: COLORS.PRIMARY_LIGHT }}
        >
          {queueSummary ? (
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 font-medium">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS.SUCCESS }}
                />
                Open now
              </span>
              <span>Serving {queueNumber}</span>
              <span>{waitingCount} waiting</span>
              <span>~{avgWait} min avg wait</span>
            </div>
          ) : (
            <p className="font-medium text-blue-900">
              {queueError || "Visit us today"}
            </p>
          )}
        </section>

        {/* Section 3: Hero area. */}
        <section className="px-7 py-14">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <Badge text="Badulla, Uva Province, Sri Lanka" color="blue" />
              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
                  Quality healthcare, now easier to access
                </h1>
                <p className="max-w-xl text-base leading-7 text-gray-600">
                  FlowCare helps patients book visits, track live queue
                  progress, and stay informed about clinic services in one
                  simple place.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/register" className="btn-primary px-5 py-2.5">
                  Book an appointment
                </Link>
                <Link to="/how-it-works" className="btn-secondary px-5 py-2.5">
                  How it works
                </Link>
              </div>
              {featuredSlots.length > 0 && (
                <p className="text-sm text-gray-500">
                  Some available slots today: {featuredSlots.join(", ")}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Today at the clinic
              </h2>
              <div className="mt-5 space-y-4 text-sm text-gray-700">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span>Serving</span>
                  <span className="font-semibold">
                    {queueSummary?.queue_number ?? "Q--"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span>Waiting</span>
                  <span className="font-semibold">{waitingCount}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span>Avg wait</span>
                  <span className="font-semibold">~{avgWait} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Consultations done today</span>
                  <span className="font-semibold">
                    {queueSummary?.completed ??
                      queueSummary?.total_completed ??
                      0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Doctors list. */}
        <section className="px-7 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Meet our doctors
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Friendly specialists ready to help you and your family.
            </p>
          </div>

          {doctorsLoading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="mt-4 h-6 w-24 animate-pulse rounded-full bg-gray-200" />
                  <div className="mt-4 h-4 w-full animate-pulse rounded bg-gray-200" />
                  <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-gray-200" />
                  <div className="mt-6 h-10 w-full animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : doctors.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => (
                <DoctorCard
                  key={doctor.user_id ?? doctor.id ?? doctor.full_name}
                  doctor={doctor}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
              {doctorsError || "No doctors available right now."}
            </div>
          )}
        </section>

        {/* Section 5: Why choose us. */}
        <section className="px-7 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Why choose us
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Book from phone",
                text: "Reserve your visit anytime from your mobile.",
              },
              {
                title: "Live queue",
                text: "See your queue progress without asking at the desk.",
              },
              {
                title: "Digital records",
                text: "Keep visits and consultations organized in one place.",
              },
              {
                title: "Walk-ins welcome",
                text: "Visit the clinic directly when you need immediate help.",
              },
              {
                title: "Experienced doctors",
                text: "Consult trusted doctors across different specialties.",
              },
              {
                title: "Short wait",
                text: "Plan your visit with clearer queue and time information.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </section>

              {/* Section 3: Hero area. */}
              <section className="px-7 py-16">
                <div className="mx-auto max-w-7xl">
                  <div className="grid gap-8 md:grid-cols-2 md:items-center">
                    <div className="space-y-6">
                      <Badge text="Badulla, Uva Province, Sri Lanka" color="blue" />
                      <div className="space-y-4">
                        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
                          Quality healthcare,
                          <br /> now easier to access
                        </h1>
                        <p className="max-w-2xl text-lg leading-7 text-gray-600">
                          FlowCare helps patients book visits, track live queue progress, and stay informed about clinic services in one simple place.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link to="/register" className="btn-primary px-5 py-2.5">
                          Book an appointment
                        </Link>
                        <Link to="/how-it-works" className="btn-secondary px-5 py-2.5">
                          How it works
                        </Link>
                      </div>

                      {featuredSlots.length > 0 && (
                        <p className="text-sm text-gray-500">Some available slots today: {featuredSlots.join(', ')}</p>
                      )}
                    </div>

                    <div className="relative flex items-center justify-center">
                      <div className="w-full max-w-md rounded-3xl bg-white/70 p-6 shadow-2xl backdrop-blur-sm">
                        <img src="/src/assets/hero.svg" alt="Clinic illustration" className="w-full h-auto rounded-xl" />
                      </div>
                      <div className="absolute right-6 top-6 hidden md:block">
                        <div className="rounded-full bg-white p-2 shadow">
                          <span className="text-sm text-gray-600">Open now</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clinic stats card moved slightly down for better visual balance */}
                  <div className="mt-10 grid justify-items-end">
                    <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                      <h2 className="text-lg font-semibold text-gray-900">Today at the clinic</h2>
                      <div className="mt-5 space-y-4 text-sm text-gray-700">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <span>Serving</span>
                          <span className="font-semibold">{queueSummary?.queue_number ?? 'Q--'}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <span>Waiting</span>
                          <span className="font-semibold">{waitingCount}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <span>Avg wait</span>
                          <span className="font-semibold">~{avgWait} min</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Consultations done today</span>
                          <span className="font-semibold">{queueSummary?.completed ?? queueSummary?.total_completed ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
      </main>

      {/* Section 7: Footer. */}
      <Footer />
    </div>
  )
}

export default LandingPage
