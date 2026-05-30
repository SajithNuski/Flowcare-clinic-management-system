/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind to scan these files for class names
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // FlowCare brand colors — use these as: text-primary, bg-primary, border-primary
        primary: {
          DEFAULT: "#1A73E8", // Main blue — buttons, links, active states
          dark: "#1557B0", // Darker blue — hover states
          light: "#E8F0FE", // Very light blue — backgrounds, highlights
        },
        success: {
          DEFAULT: "#2ECC71", // Green — confirmed, completed, positive
          light: "#EAFAF1", // Light green — success backgrounds
        },
        danger: {
          DEFAULT: "#E53935", // Red — errors, cancelled, no-show
          light: "#FDEDEC", // Light red — error backgrounds
        },
        // Neutral grays for text and borders
        neutral: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        // Soft shadow for cards — modern healthcare look
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        modal: "0 20px 60px rgba(0,0,0,0.15)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
