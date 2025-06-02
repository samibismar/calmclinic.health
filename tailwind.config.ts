import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Medical theme colors based on your vision
        medical: {
          light: "#E8F4F8", // Very light blue background
          primary: "#5BBAD5", // Medical blue (like the briefcase icon)
          secondary: "#4A90A4", // Darker medical blue
          accent: "#FF6B6B", // Soft red for important elements
          gray: {
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
          }
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        medical: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        'medical': '0.75rem',
      },
      boxShadow: {
        'medical': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'medical-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
};

export default config;