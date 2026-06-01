import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import heroImage from "../assets/images/clinic image.png";

function ContactPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Navbar />

      <main className="flex-1">
        <section
          className="relative overflow-hidden px-4 py-16 sm:px-8 md:py-20"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-[#000000]/70" />
          <div className="relative mx-auto max-w-4xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[#ffffff] sm:text-4xl">
              Contact Us
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#ffffff] sm:text-base">
              We&apos;re here to help and answer any questions you may have.
              <br />
              Reach out to us anytime.
            </p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F0FE] text-[#1A73E8]">
                  <i className="ti ti-message-dots" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#1F2937]">
                    Send us a Message
                  </h2>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    Fill out the form below and we&apos;ll get back to you as
                    soon as possible.
                  </p>
                </div>
              </div>

              <form className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="h-11 rounded-md border border-[#E5E7EB] px-3 text-sm outline-none transition-colors focus:border-[#1A73E8]"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="h-11 rounded-md border border-[#E5E7EB] px-3 text-sm outline-none transition-colors focus:border-[#1A73E8]"
                  />
                </div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="h-11 w-full rounded-md border border-[#E5E7EB] px-3 text-sm outline-none transition-colors focus:border-[#1A73E8]"
                />
                <input
                  type="text"
                  placeholder="Subject"
                  className="h-11 w-full rounded-md border border-[#E5E7EB] px-3 text-sm outline-none transition-colors focus:border-[#1A73E8]"
                />
                <textarea
                  rows="5"
                  placeholder="Your Message"
                  className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none transition-colors focus:border-[#1A73E8]"
                />

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md bg-[#1A73E8] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#155fc0]"
                >
                  <i className="ti ti-send" />
                  Send Message
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F0FE] text-[#1A73E8]">
                  <i className="ti ti-phone" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#1F2937]">
                    Contact Information
                  </h2>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1F2937]">
                      Address
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#4B5563]">
                      123 Health Street, Wellness City,
                      <br />
                      Colombo 07, Sri Lanka
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#1F2937]">
                      Phone
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#4B5563]">
                      +94 11 234 5678
                      <br />
                      +94 11 234 5679
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#1F2937]">
                      Email
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#4B5563]">
                      info@flowcare.lk
                      <br />
                      support@flowcare.lk
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#1F2937]">
                      Working Hours
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#4B5563]">
                      Mon - Fri &nbsp;&nbsp; 8:00 AM - 6:00 PM
                      <br />
                      Saturday &nbsp;&nbsp;&nbsp; 8:00 AM - 1:00 PM
                      <br />
                      Sunday &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Closed
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                  <div className="relative flex h-full min-h-[320px] items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#eef4ff_0%,#f9fbff_45%,#eef9f1_100%)]">
                    <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(#c7d5f7_1px,transparent_1px)] [background-size:18px_18px]" />
                    <div className="relative rounded-2xl border border-white/70 bg-white/90 px-6 py-5 text-center shadow-sm backdrop-blur-sm">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F0FE] text-[#1A73E8] shadow-sm">
                        <i className="ti ti-map-pin" />
                      </div>
                      <h3 className="mt-3 text-sm font-semibold text-[#1F2937]">
                        FlowCare Clinic
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-[#4B5563]">
                        123 Health Street,
                        <br />
                        Wellness City, Colombo 07
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl bg-[#F5F8FF] px-6 py-6 shadow-sm">
            <div>
              <h3 className="text-base font-semibold text-[#1F2937]">
                Need Immediate Assistance?
              </h3>
              <p className="mt-1 text-sm text-[#4B5563]">
                Call us directly during working hours or book an appointment
                online.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/patient/book")}
              className="inline-flex items-center gap-2 rounded-md border border-[#1A73E8] px-4 py-2 text-sm font-semibold text-[#1A73E8] transition-colors hover:bg-[#E8F0FE]"
            >
              <i className="ti ti-phone" />
              Call Now
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default ContactPage;
