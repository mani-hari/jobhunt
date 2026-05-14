import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#FAFBFC",
          card: "#FFFFFF",
          hover: "#F0F4F8",
          selected: "#EBF5FF",
        },
        ink: {
          primary: "#1A2B3C",
          secondary: "#5A6B7C",
          muted: "#8A9BAC",
        },
        accent: {
          blue: "#3B82F6",
          "blue-light": "#DBEAFE",
          green: "#22C55E",
          amber: "#F59E0B",
          red: "#EF4444",
        },
        line: {
          DEFAULT: "#E2E8F0",
          focus: "#93C5FD",
        },
      },
      fontFamily: {
        serif: ["'Source Serif 4'", "Georgia", "serif"],
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,43,60,0.04)",
        "card-hover": "0 6px 18px rgba(26,43,60,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
